import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminReferralData, updateReferralStatus } from '@/lib/admin-service';
import { checkIsAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const isAdmin = await checkIsAdmin(userId);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const data = await fetchAdminReferralData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Admin referrals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { referralId, status, adminUserId, reason } = body;

    if (!referralId || !status || !adminUserId || !reason) {
      return NextResponse.json(
        { error: 'referralId, status, adminUserId, and reason are required' },
        { status: 400 }
      );
    }

    const isAdmin = await checkIsAdmin(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await updateReferralStatus(referralId, status, adminUserId, reason);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin referrals PUT error:', error);
    return NextResponse.json({ error: 'Failed to update referral status' }, { status: 500 });
  }
}
