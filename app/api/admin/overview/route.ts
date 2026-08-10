import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminOverviewStats } from '@/lib/admin-service';
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

    const stats = await fetchAdminOverviewStats();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Admin overview API error:', error);
    return NextResponse.json({ error: 'Failed to fetch overview stats' }, { status: 500 });
  }
}
