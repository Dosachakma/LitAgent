import { NextRequest, NextResponse } from 'next/server';
import { fetchAuditLogs } from '@/lib/audit-logger';
import { checkIsAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const targetType = searchParams.get('targetType') || undefined;

    if (userId) {
      const isAdmin = await checkIsAdmin(userId);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const result = await fetchAuditLogs({ page, limit, targetType });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Admin audit logs GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
