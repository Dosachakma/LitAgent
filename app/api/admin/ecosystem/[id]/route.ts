import { NextRequest, NextResponse } from 'next/server';
import { saveAdminProject, deleteAdminProject } from '@/lib/admin-service';
import { checkIsAdmin } from '@/lib/admin-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { adminUserId, ...projectData } = body;

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId is required' }, { status: 400 });
    }

    const isAdmin = await checkIsAdmin(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await saveAdminProject({ ...projectData, id }, adminUserId, true);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, project: result.project });
  } catch (error) {
    console.error('Admin PUT project error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
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
        { error: 'adminUserId and a valid reason are required' },
        { status: 400 }
      );
    }

    const isAdmin = await checkIsAdmin(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await deleteAdminProject(id, adminUserId, reason);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE project error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
