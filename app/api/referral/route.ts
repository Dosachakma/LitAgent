import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralStats,
  getReferralHistory,
  recordReferral,
  qualifyReferral,
} from '@/lib/referral-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Authentication required to view referral data.' },
      { status: 401 }
    );
  }

  try {
    const stats = await getReferralStats(userId);
    const history = await getReferralHistory(userId);

    return NextResponse.json({
      success: true,
      stats,
      history,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching referral data';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, referrerCode, referredUserId, triggerAction } = body;

    if (action === 'record') {
      const result = await recordReferral({ referrerCode, referredUserId });
      return NextResponse.json(result);
    }

    if (action === 'qualify') {
      const result = await qualifyReferral(referredUserId, triggerAction);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, message: 'Invalid referral action.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error executing referral action';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
