import { NextResponse } from 'next/server';
import { generateDailyCleanAirPlan } from '@/lib/agent/planner';
import { getEnvironmentalSnapshot } from '@/lib/data/environment';
import { PlanRequestSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = PlanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid plan request', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { household, language } = parsed.data;
    const env = await getEnvironmentalSnapshot({
      city: household.city,
      locality: household.locality,
      lat: household.lat,
      lon: household.lon,
    });

    const plan = await generateDailyCleanAirPlan(household, env, language);
    return NextResponse.json({ plan, environment: env });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate daily plan' },
      { status: 500 }
    );
  }
}
