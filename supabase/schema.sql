-- ============================================================================
-- SaansPlan – Family Air Defense Copilot
-- Supabase Postgres Schema + Row-Level Security (Clerk JWT compatible)
-- Run this in your Supabase SQL Editor.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Households (Digital Twin)
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name text not null,
  city text not null default 'New Delhi',
  locality text not null default 'Rohini Sector 13',
  pincode text not null default '110085',
  lat double precision not null default 28.7041,
  lon double precision not null default 77.1025,
  budget_mode boolean not null default false,
  home_profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_households_clerk_user
  on public.households (clerk_user_id);

-- 2. Household Members (Per-member risk & schedule; minimal PII)
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  role text not null,
  age integer not null check (age >= 0 and age <= 120),
  sensitivity text not null default 'standard',
  commute_mode text not null default 'wfh_indoor',
  schedule jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_members_household
  on public.household_members (household_id);

-- 3. Daily Clean Air Plans
create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  plan_date date not null default current_date,
  language text not null default 'en',
  summary_headline text not null,
  total_reduction_percent double precision not null default 0,
  actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (household_id, plan_date)
);

-- 4. Impact Ledger (Verified before/after savings)
create table if not exists public.impact_ledger (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  clerk_user_id text not null,
  action_id text not null,
  action_title text not null,
  status text not null check (status in ('done', 'skipped')),
  pm25_saved_ug_m3 double precision not null default 0,
  percent_saved double precision not null default 0,
  co2_saved_kg double precision not null default 0,
  money_saved_inr double precision not null default 0,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_ledger_household_date
  on public.impact_ledger (household_id, recorded_at desc);

-- ============================================================================
-- Row-Level Security (RLS) using Clerk JWT sub claim
-- ============================================================================
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.daily_plans enable row level security;
alter table public.impact_ledger enable row level security;

create policy "Users manage own households"
  on public.households
  for all
  using ((auth.jwt() ->> 'sub') = clerk_user_id)
  with check ((auth.jwt() ->> 'sub') = clerk_user_id);

create policy "Users manage own household members"
  on public.household_members
  for all
  using (
    exists (
      select 1 from public.households h
      where h.id = household_members.household_id
        and h.clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy "Users manage own daily plans"
  on public.daily_plans
  for all
  using (
    exists (
      select 1 from public.households h
      where h.id = daily_plans.household_id
        and h.clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy "Users manage own impact ledger"
  on public.impact_ledger
  for all
  using ((auth.jwt() ->> 'sub') = clerk_user_id)
  with check ((auth.jwt() ->> 'sub') = clerk_user_id);
