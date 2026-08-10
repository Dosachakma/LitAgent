import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminMissions, createMission } from '@/lib/admin-service';
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

    const missions = await fetchAdminMissions();
    return NextResponse.json({ success: true, missions });
  } catch (error) {
    console.error('Admin GET missions error:', error);
    return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminUserId, ...missionInput } = body;

    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin User ID is required' }, { status: 400 });
    }

    const isAdmin = await checkIsAdmin(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await createMission(missionInput, adminUserId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, mission: result.mission });
  } catch (error) {
    console.error('Admin POST mission error:', error);
    return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
  }
}
