import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { insertLedgerRecord, isSupabaseConfigured } from '@/lib/db/supabase';
import { LedgerActionSchema } from '@/lib/validation/schemas';

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LedgerActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ledger entry', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!hasClerk || !isSupabaseConfigured()) {
      return NextResponse.json({
        mode: 'demo',
        persisted: false,
        entry: parsed.data,
      });
    }

    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const saved = await insertLedgerRecord({
      householdId: parsed.data.householdId,
      clerkUserId: userId,
      actionId: parsed.data.actionId,
      actionTitle: parsed.data.actionTitle,
      status: parsed.data.status,
      pm25SavedUgM3: parsed.data.pm25SavedUgM3,
      percentSaved: parsed.data.percentSaved,
      co2SavedKg: parsed.data.co2SavedKg,
      moneySavedInr: parsed.data.moneySavedInr,
    });

    return NextResponse.json({ mode: 'cloud', persisted: saved });
  } catch {
    return NextResponse.json(
      { error: 'Failed to record impact ledger entry' },
      { status: 500 }
    );
  }
}
