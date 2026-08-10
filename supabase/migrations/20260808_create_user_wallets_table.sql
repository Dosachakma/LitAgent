-- Migration for LitAgent Phase 10: User Wallets Table

CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    address TEXT NOT NULL,
    chain_id TEXT NOT NULL DEFAULT '4441',
    wallet_type TEXT NOT NULL DEFAULT 'injected',
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_wallet UNIQUE (user_id, address)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON public.user_wallets(address);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read user_wallets" ON public.user_wallets FOR SELECT USING (TRUE);
CREATE POLICY "Public insert user_wallets" ON public.user_wallets FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public update user_wallets" ON public.user_wallets FOR UPDATE USING (TRUE);
