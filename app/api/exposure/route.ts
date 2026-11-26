import { NextResponse } from 'next/server';
import { calcHouseholdExposure } from '@/lib/exposure-engine';
import { ExposureRequestSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ExposureRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const summary = calcHouseholdExposure(
      parsed.data.household,
      parsed.data.hourlyPm25
    );
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { error: 'Failed to compute household exposure' },
      { status: 500 }
    );
  }
}
