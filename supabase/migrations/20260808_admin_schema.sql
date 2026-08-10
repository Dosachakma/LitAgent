-- Migration for LitAgent Phase 11: Admin Dashboard, Roles, Audit Logs, and Settings

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 2. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON public.admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_logs(created_at DESC);

-- 3. Create admin_settings table for centralized app configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, description)
VALUES 
    ('daily_checkin_xp', '50'::jsonb, 'Base XP awarded for daily check-in'),
    ('referral_xp', '200'::jsonb, 'XP awarded to both referrer and qualified referred user'),
    ('mission_xp_default', '100'::jsonb, 'Default XP reward for newly created missions'),
    ('max_referral_rewards', '50'::jsonb, 'Maximum number of referrals a user can earn XP from'),
    ('leaderboard_display_count', '100'::jsonb, 'Number of top users displayed on public leaderboard'),
    ('news_sync_interval_mins', '30'::jsonb, 'Automated news sync interval in minutes'),
    ('feature_toggles', '{"enable_referrals": true, "enable_checkin": true, "enable_missions": true, "maintenance_mode": false}'::jsonb, 'Global feature flags and maintenance toggles')
ON CONFLICT (key) DO NOTHING;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- user_roles policies
DROP POLICY IF EXISTS "Allow read user_roles for authenticated" ON public.user_roles;
CREATE POLICY "Allow read user_roles for authenticated" ON public.user_roles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow read user_roles for anon" ON public.user_roles;
CREATE POLICY "Allow read user_roles for anon" ON public.user_roles
    FOR SELECT TO anon USING (true);

-- admin_audit_logs policies
DROP POLICY IF EXISTS "Allow read admin_audit_logs for admins" ON public.admin_audit_logs;
CREATE POLICY "Allow read admin_audit_logs for admins" ON public.admin_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid()::text 
            AND user_roles.role IN ('admin', 'super_admin')
        )
    );

-- admin_settings policies
DROP POLICY IF EXISTS "Allow read admin_settings for all" ON public.admin_settings;
CREATE POLICY "Allow read admin_settings for all" ON public.admin_settings
    FOR SELECT USING (true);
