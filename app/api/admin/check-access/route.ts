import { NextRequest, NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ isAdmin: false, error: 'User ID missing' }, { status: 400 });
    }

    const isAdmin = await checkIsAdmin(userId);
    return NextResponse.json({ isAdmin, userId });
  } catch (error) {
    console.error('Check access error:', error);
    return NextResponse.json({ isAdmin: false, error: 'Internal error' }, { status: 500 });
  }
}
