import { Pool } from 'pg';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { HouseholdTwin } from '@/lib/exposure-engine';

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL;

let pgPool: Pool | null = null;
let tablesInitialized = false;

function getPgPool(): Pool | null {
  if (!connectionString) return null;
  if (!pgPool) {
    pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pgPool;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    connectionString ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  );
}

/**
 * Automatically initializes Postgres schema in Supabase if not yet created.
 */
async function ensureTables(pool: Pool) {
  if (tablesInitialized) return;
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS households (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        city TEXT NOT NULL DEFAULT 'New Delhi',
        locality TEXT NOT NULL DEFAULT 'Rohini Sector 13',
        pincode TEXT NOT NULL DEFAULT '110085',
        lat DOUBLE PRECISION NOT NULL DEFAULT 28.7041,
        lon DOUBLE PRECISION NOT NULL DEFAULT 77.1025,
        budget_mode BOOLEAN NOT NULL DEFAULT false,
        home_profile JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_households_clerk_user ON households(clerk_user_id);

      CREATE TABLE IF NOT EXISTS household_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        age INTEGER NOT NULL,
        sensitivity TEXT NOT NULL DEFAULT 'standard',
        commute_mode TEXT NOT NULL DEFAULT 'wfh_indoor',
        schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_members_household ON household_members(household_id);

      CREATE TABLE IF NOT EXISTS daily_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
        language TEXT NOT NULL DEFAULT 'en',
        summary_headline TEXT NOT NULL,
        total_reduction_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
        actions JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (household_id, plan_date)
      );

      CREATE TABLE IF NOT EXISTS impact_ledger (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        clerk_user_id TEXT NOT NULL,
        action_id TEXT NOT NULL,
        action_title TEXT NOT NULL,
        status TEXT NOT NULL,
        pm25_saved_ug_m3 DOUBLE PRECISION NOT NULL DEFAULT 0,
        percent_saved DOUBLE PRECISION NOT NULL DEFAULT 0,
        co2_saved_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
        money_saved_inr DOUBLE PRECISION NOT NULL DEFAULT 0,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    tablesInitialized = true;
  } catch (err) {
    console.error('Database schema ensure error:', err);
  }
}

/**
 * Returns a Supabase REST client if REST keys are present.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getHouseholdForUser(
  clerkUserId: string
): Promise<HouseholdTwin | null> {
  const pool = getPgPool();
  if (pool) {
    await ensureTables(pool);
    const { rows: householdRows } = await pool.query(
      `SELECT * FROM households WHERE clerk_user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [clerkUserId]
    );

    if (householdRows.length === 0) return null;
    const h = householdRows[0];

    const { rows: memberRows } = await pool.query(
      `SELECT * FROM household_members WHERE household_id = $1`,
      [h.id]
    );

    return {
      id: h.id,
      name: h.name,
      city: h.city,
      locality: h.locality,
      pincode: h.pincode,
      lat: Number(h.lat),
      lon: Number(h.lon),
      budgetMode: Boolean(h.budget_mode),
      home: typeof h.home_profile === 'string' ? JSON.parse(h.home_profile) : h.home_profile,
      members: memberRows.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        age: Number(m.age),
        sensitivity: m.sensitivity,
        commuteMode: m.commute_mode,
        schedule: typeof m.schedule === 'string' ? JSON.parse(m.schedule) : m.schedule,
      })),
    };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: household, error } = await supabase
    .from('households')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !household) return null;

  const { data: members } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', household.id);

  return {
    id: household.id,
    name: household.name,
    city: household.city,
    locality: household.locality,
    pincode: household.pincode,
    lat: household.lat,
    lon: household.lon,
    budgetMode: household.budget_mode,
    home: household.home_profile,
    members: (members ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      age: m.age,
      sensitivity: m.sensitivity,
      commuteMode: m.commute_mode,
      schedule: m.schedule,
    })),
  };
}

export async function upsertHouseholdForUser(
  clerkUserId: string,
  twin: HouseholdTwin
): Promise<{ saved: boolean; householdId: string }> {
  const pool = getPgPool();
  if (pool) {
    await ensureTables(pool);
    const { rows: existingRows } = await pool.query(
      `SELECT id FROM households WHERE clerk_user_id = $1 LIMIT 1`,
      [clerkUserId]
    );

    let householdId: string;
    if (existingRows.length > 0) {
      householdId = existingRows[0].id;
      await pool.query(
        `UPDATE households
         SET name = $1, city = $2, locality = $3, pincode = $4, lat = $5, lon = $6,
             budget_mode = $7, home_profile = $8, updated_at = NOW()
         WHERE id = $9`,
        [
          twin.name,
          twin.city,
          twin.locality,
          twin.pincode,
          twin.lat,
          twin.lon,
          twin.budgetMode,
          JSON.stringify(twin.home),
          householdId,
        ]
      );
      await pool.query(
        `DELETE FROM household_members WHERE household_id = $1`,
        [householdId]
      );
    } else {
      const { rows: inserted } = await pool.query(
        `INSERT INTO households (clerk_user_id, name, city, locality, pincode, lat, lon, budget_mode, home_profile)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          clerkUserId,
          twin.name,
          twin.city,
          twin.locality,
          twin.pincode,
          twin.lat,
          twin.lon,
          twin.budgetMode,
          JSON.stringify(twin.home),
        ]
      );
      householdId = inserted[0].id;
    }

    if (twin.members.length > 0) {
      for (const m of twin.members) {
        await pool.query(
          `INSERT INTO household_members (household_id, name, role, age, sensitivity, commute_mode, schedule)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            householdId,
            m.name,
            m.role,
            m.age,
            m.sensitivity,
            m.commuteMode,
            JSON.stringify(m.schedule),
          ]
        );
      }
    }

    return { saved: true, householdId };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { saved: false, householdId: twin.id };
  }

  const { data: existing } = await supabase
    .from('households')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .limit(1)
    .maybeSingle();

  let householdId = existing?.id as string | undefined;

  if (householdId) {
    await supabase
      .from('households')
      .update({
        name: twin.name,
        city: twin.city,
        locality: twin.locality,
        pincode: twin.pincode,
        lat: twin.lat,
        lon: twin.lon,
        budget_mode: twin.budgetMode,
        home_profile: twin.home,
        updated_at: new Date().toISOString(),
      })
      .eq('id', householdId);

    await supabase
      .from('household_members')
      .delete()
      .eq('household_id', householdId);
  } else {
    const { data: inserted } = await supabase
      .from('households')
      .insert({
        clerk_user_id: clerkUserId,
        name: twin.name,
        city: twin.city,
        locality: twin.locality,
        pincode: twin.pincode,
        lat: twin.lat,
        lon: twin.lon,
        budget_mode: twin.budgetMode,
        home_profile: twin.home,
      })
      .select('id')
      .single();

    householdId = inserted?.id;
  }

  if (householdId && twin.members.length > 0) {
    await supabase.from('household_members').insert(
      twin.members.map((m) => ({
        household_id: householdId,
        name: m.name,
        role: m.role,
        age: m.age,
        sensitivity: m.sensitivity,
        commute_mode: m.commuteMode,
        schedule: m.schedule,
      }))
    );
  }

  return { saved: Boolean(householdId), householdId: householdId ?? twin.id };
}

export async function insertLedgerRecord(params: {
  householdId: string;
  clerkUserId: string;
  actionId: string;
  actionTitle: string;
  status: string;
  pm25SavedUgM3: number;
  percentSaved: number;
  co2SavedKg: number;
  moneySavedInr: number;
}): Promise<boolean> {
  const pool = getPgPool();
  if (pool) {
    await ensureTables(pool);
    await pool.query(
      `INSERT INTO impact_ledger
       (household_id, clerk_user_id, action_id, action_title, status, pm25_saved_ug_m3, percent_saved, co2_saved_kg, money_saved_inr)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        params.householdId,
        params.clerkUserId,
        params.actionId,
        params.actionTitle,
        params.status,
        params.pm25SavedUgM3,
        params.percentSaved,
        params.co2SavedKg,
        params.moneySavedInr,
      ]
    );
    return true;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return false;

  const { error } = await supabase.from('impact_ledger').insert({
    household_id: params.householdId,
    clerk_user_id: params.clerkUserId,
    action_id: params.actionId,
    action_title: params.actionTitle,
    status: params.status,
    pm25_saved_ug_m3: params.pm25SavedUgM3,
    percent_saved: params.percentSaved,
    co2_saved_kg: params.co2SavedKg,
    money_saved_inr: params.moneySavedInr,
  });

  return !error;
}
