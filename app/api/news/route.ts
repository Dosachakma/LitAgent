import { NextRequest, NextResponse } from 'next/server';
import { NewsService } from '@/services/news/news-service';
import type { NewsSourceType } from '@/services/news/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get('query') || undefined;
    const category = searchParams.get('category') || undefined;
    const sourceType = (searchParams.get('source_type') as NewsSourceType) || undefined;
    const officialOnly = searchParams.get('official_only') === 'true';
    const savedOnly = searchParams.get('saved_only') === 'true';
    const bookmarkedIds = searchParams.get('bookmarked_ids')
      ? searchParams.get('bookmarked_ids')?.split(',')
      : undefined;
    const sortBy = (searchParams.get('sort_by') as 'newest' | 'oldest') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await NewsService.getArticles({
      query,
      category,
      source_type: sourceType,
      official_only: officialOnly,
      saved_only: savedOnly,
      bookmarked_ids: bookmarkedIds,
      sort_by: sortBy,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Error in /api/news route:', err);
    return NextResponse.json(
      { error: 'Failed to fetch news articles' },
      { status: 500 }
    );
  }
}
