import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminNews } from '@/lib/admin-service';
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

    const news = await fetchAdminNews();
    return NextResponse.json({ success: true, news });
  } catch (error) {
    console.error('Admin GET news error:', error);
    return NextResponse.json({ error: 'Failed to fetch news articles' }, { status: 500 });
  }
}
