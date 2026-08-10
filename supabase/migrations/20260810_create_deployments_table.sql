-- Migration for LitAgent: Deployments History Table

CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    wallet_address TEXT NOT NULL,
    chain_id TEXT NOT NULL DEFAULT '4441',
    network TEXT NOT NULL DEFAULT 'LitVM Liteforge Testnet',
    contract_type TEXT NOT NULL, -- 'erc20', 'erc721', 'custom'
    contract_name TEXT NOT NULL,
    contract_symbol TEXT,
    contract_address TEXT,
    transaction_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'deployed', -- 'preparing', 'awaiting_signature', 'submitting', 'confirming', 'deployed', 'failed'
    error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployments_wallet ON public.deployments(wallet_address);
CREATE INDEX IF NOT EXISTS idx_deployments_user ON public.deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_created ON public.deployments(created_at DESC);

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read deployments" ON public.deployments FOR SELECT USING (TRUE);
CREATE POLICY "Public insert deployments" ON public.deployments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public update deployments" ON public.deployments FOR UPDATE USING (TRUE);
