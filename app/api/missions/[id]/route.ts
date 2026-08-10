import { NextRequest, NextResponse } from 'next/server';
import { fetchMissionsWithUserProgress } from '@/lib/xp-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;

    const allMissions = await fetchMissionsWithUserProgress(userId);
    const mission = allMissions.find((m) => m.id === id || m.slug === id);

    if (!mission) {
      return NextResponse.json({ success: false, message: 'Mission not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: mission });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
