import { NextResponse } from 'next/server';
import { simulateIndoorMassBalance } from '@/lib/exposure-engine';
import { SimulateRequestSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SimulateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid simulation parameters', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = simulateIndoorMassBalance(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Simulation failed' },
      { status: 500 }
    );
  }
}
