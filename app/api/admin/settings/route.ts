import { NextRequest, NextResponse } from 'next/server';
import { getAdminSettings, updateAdminSetting, AdminSettingsMap } from '@/lib/settings-service';
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

    const settings = await getAdminSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, adminUserId, reason } = body;

    if (!key || value === undefined || !adminUserId) {
      return NextResponse.json(
        { error: 'key, value, and adminUserId are required' },
        { status: 400 }
      );
    }

    const isAdmin = await checkIsAdmin(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const success = await updateAdminSetting(
      key as keyof AdminSettingsMap,
      value,
      adminUserId,
      reason
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
