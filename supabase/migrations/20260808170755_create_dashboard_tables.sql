/*
# Create ecosystem tables: projects, news_articles, missions, user_activity, user_notifications

## Purpose
Creates content tables (projects, news, missions) plus per-user activity and
notification tables that power the LitAgent dashboard.

## 1. New Tables
### projects — ecosystem project directory (read-only from client)
### news_articles — official LitVM news (read-only from client)
### missions — ecosystem tasks with rewards (read-only from client)
### user_activity — per-user activity log (owner-scoped CRUD)
### user_notifications — per-user notifications (owner-scoped)

## 2. Security
- Content tables: RLS enabled, SELECT for authenticated only (shared content).
- user_activity / user_notifications: RLS enabled, owner-scoped CRUD with DEFAULT auth.uid().

## 3. Indexes
- news_articles.published_at DESC, missions.created_at DESC,
  user_activity + user_notifications (user_id, created_at DESC), projects.featured

## 4. Notes
1. Content tables are read-only from the client, managed server-side.
2. user_activity / user_notifications have DEFAULT auth.uid() so inserts omitting user_id satisfy RLS.
3. The `featured` boolean on projects lets the dashboard show a curated subset.
*/

-- ===================== PROJECTS =====================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  category text,
  logo_url text,
  website_url text,
  twitter_url text,
  discord_url text,
  contract_addresses jsonb,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_projects" ON projects;
CREATE POLICY "select_projects" ON projects FOR SELECT
  TO authenticated USING (true);

-- ===================== NEWS ARTICLES =====================
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  content text,
  source text NOT NULL,
  url text NOT NULL,
  image_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  tags text[] DEFAULT '{}'
);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_news_articles" ON news_articles;
CREATE POLICY "select_news_articles" ON news_articles FOR SELECT
  TO authenticated USING (true);

-- ===================== MISSIONS =====================
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_missions" ON missions;
CREATE POLICY "select_missions" ON missions FOR SELECT
  TO authenticated USING (true);

-- ===================== USER ACTIVITY =====================
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activity" ON user_activity;
CREATE POLICY "select_own_activity" ON user_activity FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_activity" ON user_activity;
CREATE POLICY "insert_own_activity" ON user_activity FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_activity" ON user_activity;
CREATE POLICY "delete_own_activity" ON user_activity FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===================== USER NOTIFICATIONS =====================
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON user_notifications;
CREATE POLICY "select_own_notifications" ON user_notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON user_notifications;
CREATE POLICY "insert_own_notifications" ON user_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON user_notifications;
CREATE POLICY "update_own_notifications" ON user_notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON user_notifications;
CREATE POLICY "delete_own_notifications" ON user_notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===================== INDEXES =====================
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_missions_created_at ON missions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON user_activity (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created ON user_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects (featured) WHERE featured = true;
