import { NextRequest, NextResponse } from 'next/server';
import { NewsService } from '@/services/news/news-service';

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.ADMIN_CRON_SECRET;
    if (secret) {
      const authHeader = req.headers.get('authorization');
      const urlSecret = req.nextUrl.searchParams.get('secret');
      if (authHeader !== `Bearer ${secret}` && urlSecret !== secret) {
        return NextResponse.json({ error: 'Unauthorized: Invalid ADMIN_CRON_SECRET' }, { status: 401 });
      }
    }

    const syncResult = await NewsService.syncAllProviders();
    return NextResponse.json(syncResult);
  } catch (err: unknown) {
    console.error('Error in /api/news/sync route:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'News ingestion sync failed',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.ADMIN_CRON_SECRET;
    if (secret) {
      const authHeader = req.headers.get('authorization');
      const urlSecret = req.nextUrl.searchParams.get('secret');
      if (authHeader !== `Bearer ${secret}` && urlSecret !== secret) {
        return NextResponse.json({ error: 'Unauthorized: Invalid ADMIN_CRON_SECRET' }, { status: 401 });
      }
    }

    const syncResult = await NewsService.syncAllProviders();
    return NextResponse.json(syncResult);
  } catch (err: unknown) {
    console.error('Error in /api/news/sync route:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'News ingestion sync failed',
      },
      { status: 500 }
    );
  }
}
