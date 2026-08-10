import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminXPTransactions } from '@/lib/admin-service';
import { checkIsAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const source = searchParams.get('source') || undefined;

    if (userId) {
      const isAdmin = await checkIsAdmin(userId);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const result = await fetchAdminXPTransactions({ page, limit, source });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Admin XP GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch XP transactions' }, { status: 500 });
  }
}
