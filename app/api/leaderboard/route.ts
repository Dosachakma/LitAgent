import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/xp-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') || 'all') as 'all' | 'weekly' | 'monthly';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || undefined;

    const entries = await getLeaderboard({ period, limit, search });
    return NextResponse.json({
      success: true,
      period,
      count: entries.length,
      data: entries,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
