import { NextRequest, NextResponse } from 'next/server';
import { updateMission, deleteMission } from '@/lib/admin-service';
import { checkIsAdmin } from '@/lib/admin-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { adminUserId, reason, ...updates } = body;

    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin User ID is required' }, { status: 400 });
    }

    const isAdmin = await checkIsAdmin(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await updateMission(id, updates, adminUserId, reason);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, mission: result.mission });
  } catch (error) {
    console.error('Admin PUT mission error:', error);
    return NextResponse.json({ error: 'Failed to update mission' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const adminUserId = searchParams.get('adminUserId');
    const reason = searchParams.get('reason');

    if (!adminUserId || !reason) {
      return NextResponse.json(
        { error: 'adminUserId and a valid reason are required to delete a mission' },
        { status: 400 }
      );
    }

    const isAdmin = await checkIsAdmin(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await deleteMission(id, adminUserId, reason);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE mission error:', error);
    return NextResponse.json({ error: 'Failed to delete mission' }, { status: 500 });
  }
}
