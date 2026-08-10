export type NewsSourceType = 'blog' | 'x' | 'telegram' | 'discord' | 'docs' | 'community';

export type VerificationStatus = 'Official' | 'Verified' | 'Community' | 'Unverified';

export type NewsCategory =
  | 'All'
  | 'Official'
  | 'Announcements'
  | 'Ecosystem'
  | 'Developer'
  | 'Testnet'
  | 'Updates'
  | 'Partnerships'
  | 'Community';

export interface AISummaryData {
  short_summary: string;
  key_points: string[];
  why_it_matters: string;
  related_areas: string[];
}

export interface NewsArticleItem {
  id: string;
  source: string;
  source_type: NewsSourceType;
  external_id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  url: string;
  image_url: string | null;
  published_at: string;
  fetched_at: string;
  is_official: boolean;
  is_verified: boolean;
  is_featured?: boolean;
  verification_status: VerificationStatus;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'hidden';
  ai_summary?: AISummaryData | null;
  related_projects?: string[] | null;
  related_docs?: { title: string; url: string }[] | null;
  created_at: string;
  updated_at: string;
}

export interface NewsProviderConfig {
  id: string;
  name: string;
  source_type: NewsSourceType;
  official_url: string;
  is_official: boolean;
  status: 'active' | 'pending' | 'error';
  last_sync_at?: string | null;
  error_message?: string | null;
  requires_credentials?: boolean;
}

export interface NewsQueryFilters {
  query?: string;
  category?: string;
  source_type?: NewsSourceType | 'all';
  official_only?: boolean;
  saved_only?: boolean;
  bookmarked_ids?: string[];
  sort_by?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface UserNewsBookmark {
  id: string;
  user_id: string;
  news_id: string;
  created_at: string;
}

export interface NewsSyncResult {
  success: boolean;
  total_fetched: number;
  total_imported: number;
  total_duplicates: number;
  provider_statuses: NewsProviderConfig[];
  synced_at: string;
  error?: string;
}
