import { NextRequest, NextResponse } from 'next/server';
import { executeDailyCheckin } from '@/lib/xp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body?.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required for daily check-in.' },
        { status: 400 }
      );
    }

    const result = await executeDailyCheckin(userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
