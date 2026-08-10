import { NextRequest, NextResponse } from 'next/server';
import { getDeploymentHistory } from '@/lib/deploy/deployment-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    const history = await getDeploymentHistory(address);

    return NextResponse.json({
      success: true,
      deployments: history,
      count: history.length,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}
