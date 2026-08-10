import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminUserDetails } from '@/lib/admin-service';
import { checkIsAdmin } from '@/lib/admin-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const adminUserId = searchParams.get('adminUserId');

    if (adminUserId) {
      const isAdmin = await checkIsAdmin(adminUserId);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const userDetails = await fetchAdminUserDetails(id);
    if (!userDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: userDetails });
  } catch (error) {
    console.error('Admin GET user details error:', error);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}
