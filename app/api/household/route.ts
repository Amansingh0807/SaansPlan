import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  getHouseholdForUser,
  isSupabaseConfigured,
  upsertHouseholdForUser,
} from '@/lib/db/supabase';
import { HouseholdTwinSchema } from '@/lib/validation/schemas';

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export async function GET() {
  if (!hasClerk || !isSupabaseConfigured()) {
    return NextResponse.json({
      mode: 'demo',
      household: null,
      message: 'Clerk or Supabase env vars not configured; running in local demo mode.',
    });
  }

  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const household = await getHouseholdForUser(userId);
    return NextResponse.json({ mode: 'cloud', household });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch household' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = HouseholdTwinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid household profile', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!hasClerk || !isSupabaseConfigured()) {
      return NextResponse.json({
        mode: 'demo',
        saved: false,
        household: parsed.data,
      });
    }

    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await upsertHouseholdForUser(userId, parsed.data);
    return NextResponse.json({
      mode: 'cloud',
      saved: result.saved,
      householdId: result.householdId,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save household' },
      { status: 500 }
    );
  }
}
