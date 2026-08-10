-- Migration for LitAgent Phase 8: Missions, XP, Leaderboard and Epochs

-- 1. Create user_xp table
CREATE TABLE IF NOT EXISTS public.user_xp (
    user_id TEXT PRIMARY KEY,
    total_xp INT NOT NULL DEFAULT 0,
    current_level INT NOT NULL DEFAULT 1,
    streak_count INT NOT NULL DEFAULT 0,
    last_checkin_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create xp_transactions table for auditable logging
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount INT NOT NULL,
    type TEXT NOT NULL, -- e.g. 'mission_completion', 'daily_checkin', 'referral'
    source TEXT NOT NULL, -- e.g. 'mission', 'checkin', 'system', 'referral'
    reference_id TEXT, -- e.g. mission_id, checkin_date
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_tx_user_id ON public.xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_tx_reference ON public.xp_transactions(user_id, source, reference_id);

-- 3. Create missions table
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g. 'DAILY_CHECKIN', 'EXPLORE_PROJECT', etc.
    category TEXT NOT NULL DEFAULT 'Ecosystem', -- e.g. 'Daily', 'Weekly', 'Social', 'Ecosystem', 'Special', 'Campaign'
    xp_reward INT NOT NULL DEFAULT 50,
    difficulty TEXT NOT NULL DEFAULT 'Easy',
    status TEXT NOT NULL DEFAULT 'active',
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    requirements JSONB DEFAULT '[]'::jsonb,
    verification_type TEXT NOT NULL DEFAULT 'database', -- 'manual', 'database', 'wallet', 'transaction', 'social_api', 'external_api', 'admin'
    max_completions INT NOT NULL DEFAULT 1,
    project_id TEXT,
    project_slug TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create user_missions table
CREATE TABLE IF NOT EXISTS public.user_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'expired', 'locked'
    progress INT NOT NULL DEFAULT 0,
    max_progress INT NOT NULL DEFAULT 1,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_mission UNIQUE (user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_missions_user ON public.user_missions(user_id);

-- 5. Create daily_checkins table
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    checkin_date TEXT NOT NULL, -- 'YYYY-MM-DD' UTC
    streak INT NOT NULL DEFAULT 1,
    xp_awarded INT NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_daily_checkin UNIQUE (user_id, checkin_date)
);

-- 6. Create epochs table for seasonal reward tracking
CREATE TABLE IF NOT EXISTS public.epochs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    number INT UNIQUE NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'ended', 'upcoming'
    xp_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    reward_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security Rules
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epochs ENABLE ROW LEVEL SECURITY;

-- Read policies for public / authenticated users
CREATE POLICY "Public read active missions" ON public.missions FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read epochs" ON public.epochs FOR SELECT USING (TRUE);
CREATE POLICY "Users read own xp profile" ON public.user_xp FOR SELECT USING (TRUE);
CREATE POLICY "Users read own xp transactions" ON public.xp_transactions FOR SELECT USING (TRUE);
CREATE POLICY "Users read own mission progress" ON public.user_missions FOR SELECT USING (TRUE);
CREATE POLICY "Users read own checkins" ON public.daily_checkins FOR SELECT USING (TRUE);
