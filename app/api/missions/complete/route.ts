import { NextRequest, NextResponse } from 'next/server';
import { completeMission } from '@/lib/xp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, missionId, verificationContext } = body;

    if (!userId || !missionId) {
      return NextResponse.json(
        { success: false, message: 'userId and missionId are required.' },
        { status: 400 }
      );
    }

    const result = await completeMission(userId, missionId, verificationContext);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
