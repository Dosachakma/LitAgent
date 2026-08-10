-- Create news_articles table
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'Unverified',
  category TEXT NOT NULL DEFAULT 'Announcements',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published',
  ai_summary JSONB,
  related_projects JSONB DEFAULT '[]'::jsonb,
  related_docs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for news querying
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news_articles (category);
CREATE INDEX IF NOT EXISTS idx_news_source_type ON public.news_articles (source_type);
CREATE INDEX IF NOT EXISTS idx_news_is_official ON public.news_articles (is_official);
CREATE INDEX IF NOT EXISTS idx_news_slug ON public.news_articles (slug);
CREATE INDEX IF NOT EXISTS idx_news_external_id ON public.news_articles (external_id);

-- Create user_news_bookmarks table
CREATE TABLE IF NOT EXISTS public.user_news_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  news_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, news_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON public.user_news_bookmarks (user_id);
