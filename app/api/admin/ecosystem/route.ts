import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminProjects, saveAdminProject } from '@/lib/admin-service';
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

    const projects = await fetchAdminProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('Admin GET projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch ecosystem projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminUserId, ...projectData } = body;

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId is required' }, { status: 400 });
    }

    const isAdmin = await checkIsAdmin(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await saveAdminProject(projectData, adminUserId, false);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, project: result.project });
  } catch (error) {
    console.error('Admin POST project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
