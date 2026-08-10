import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId || !supabase) {
      return NextResponse.json({ bookmarks: [] });
    }

    const { data, error } = await supabase
      .from('user_news_bookmarks')
      .select('news_id')
      .eq('user_id', userId);

    if (error || !data) {
      return NextResponse.json({ bookmarks: [] });
    }

    const bookmarkedIds = data.map((b) => b.news_id);
    return NextResponse.json({ bookmarks: bookmarkedIds });
  } catch (err: unknown) {
    console.error('Error fetching news bookmarks:', err);
    return NextResponse.json({ bookmarks: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, news_id } = body;

    if (!user_id || !news_id) {
      return NextResponse.json({ error: 'Missing user_id or news_id' }, { status: 400 });
    }

    if (supabase) {
      await supabase.from('user_news_bookmarks').upsert(
        { user_id, news_id },
        { onConflict: 'user_id,news_id' }
      );
    }

    return NextResponse.json({ success: true, user_id, news_id });
  } catch (err: unknown) {
    console.error('Error adding news bookmark:', err);
    return NextResponse.json({ error: 'Failed to bookmark article' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const newsId = searchParams.get('news_id');

    if (!userId || !newsId) {
      return NextResponse.json({ error: 'Missing user_id or news_id' }, { status: 400 });
    }

    if (supabase) {
      await supabase
        .from('user_news_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('news_id', newsId);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Error removing news bookmark:', err);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
