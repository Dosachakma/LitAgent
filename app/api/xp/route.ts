import { NextRequest, NextResponse } from 'next/server';
import { getUserXP, getXPHistory } from '@/lib/xp-service';
import { getLevelProgress } from '@/lib/xp-config';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId query parameter is required.' },
        { status: 400 }
      );
    }

    const profile = await getUserXP(userId);
    const levelProgress = getLevelProgress(profile.total_xp);
    const history = await getXPHistory(userId, 20);

    return NextResponse.json({
      success: true,
      profile,
      levelProgress,
      history,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
