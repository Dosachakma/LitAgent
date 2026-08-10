import { NextRequest, NextResponse } from 'next/server';
import { adjustUserXP } from '@/lib/admin-service';
import { checkIsAdmin } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUserId, amount, reason, adminUserId } = body;

    if (!targetUserId || typeof amount !== 'number' || !adminUserId || !reason) {
      return NextResponse.json(
        { error: 'targetUserId, numerical amount, adminUserId, and mandatory reason are required' },
        { status: 400 }
      );
    }

    const isAdmin = await checkIsAdmin(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await adjustUserXP({
      userId: targetUserId,
      amount,
      reason,
      adminUserId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newTotalXP: result.newTotalXP,
      message: 'XP adjusted successfully and logged to immutable audit records.',
    });
  } catch (error) {
    console.error('Admin XP adjust error:', error);
    return NextResponse.json({ error: 'Failed to adjust user XP' }, { status: 500 });
  }
}
