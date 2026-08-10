import { NextRequest, NextResponse } from 'next/server';
import { fetchMissionsWithUserProgress } from '@/lib/xp-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const category = searchParams.get('category') || undefined;

    const missions = await fetchMissionsWithUserProgress(userId, category);
    return NextResponse.json({ success: true, data: missions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
