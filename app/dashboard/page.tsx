import { Suspense } from 'react';
import { connection } from 'next/server';
import { DEMO_PERSONAS } from '@/lib/exposure-engine';
import { getEnvironmentalSnapshot } from '@/lib/data/environment';
import { generateDailyCleanAirPlan } from '@/lib/agent/planner';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { SaansPlanCockpit } from '@/components/saansplan/SaansPlanCockpit';

async function DashboardLoader() {
  await connection();

  const defaultTwin = DEMO_PERSONAS[0];
  const env = await getEnvironmentalSnapshot({
    city: defaultTwin.city,
    locality: defaultTwin.locality,
    lat: defaultTwin.lat,
    lon: defaultTwin.lon,
  });
  const plan = await generateDailyCleanAirPlan(defaultTwin, env, 'en');

  const clerkEnabled = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
  const supabaseEnabled = isSupabaseConfigured();

  return (
    <SaansPlanCockpit
      initialEnv={env}
      initialPlan={plan}
      clerkEnabled={clerkEnabled}
      supabaseEnabled={supabaseEnabled}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F6F2] text-sm font-mono text-slate-700">
          Loading SaansPlan Air Defense Cockpit…
        </div>
      }
    >
      <DashboardLoader />
    </Suspense>
  );
}
