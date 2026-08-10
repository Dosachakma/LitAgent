import { NextRequest, NextResponse } from 'next/server';
import { NewsService } from '@/services/news/news-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Article slug is required' }, { status: 400 });
    }

    const article = await NewsService.getArticleBySlug(slug);

    if (!article) {
      return NextResponse.json({ error: 'News article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (err: unknown) {
    console.error('Error fetching news article by slug:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve news article' },
      { status: 500 }
    );
  }
}
