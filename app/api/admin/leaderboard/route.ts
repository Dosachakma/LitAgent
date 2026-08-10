import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/xp-service';
import { checkIsAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const timeframe = (searchParams.get('timeframe') || 'all_time') as 'all_time' | 'weekly' | 'monthly';

    if (userId) {
      const isAdmin = await checkIsAdmin(userId);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const leaderboard = await getLeaderboard({ limit: 100, timeframe });
    return NextResponse.json({ success: true, leaderboard, timeframe });
  } catch (error) {
    console.error('Admin leaderboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard inspection data' }, { status: 500 });
  }
}
