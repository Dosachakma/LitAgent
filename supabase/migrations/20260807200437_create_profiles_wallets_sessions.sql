/*
# Create auth support tables: profiles, wallets, sessions

## Purpose
Extends LitAgent with persistent user data for wallet-based and email-based
authentication. These tables store user profiles, linked wallets, and login
session metadata.

## 1. New Tables

### profiles
- `id` (uuid, primary key, defaults to auth.uid()) — one row per authenticated user
- `wallet_address` (text, unique, nullable) — primary wallet address (lowercased)
- `username` (text, nullable) — display name chosen by the user
- `avatar` (text, nullable) — avatar image URL
- `email` (text, nullable) — email address (for email-auth users)
- `ens_name` (text, nullable) — future ENS resolution
- `created_at` (timestamptz, defaults to now())
- `updated_at` (timestamptz, defaults to now())

### wallets
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references profiles.id ON DELETE CASCADE)
- `wallet_address` (text, not null — lowercased address)
- `wallet_provider` (text, not null — 'metamask' | 'rabby' | 'walletconnect' | 'injected')
- `network` (text, nullable — chain identifier, e.g. 'ethereum', 'litvm')
- `connected_at` (timestamptz, defaults to now())

### sessions
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references profiles.id ON DELETE CASCADE)
- `last_login` (timestamptz, defaults to now())
- `ip` (text, nullable) — client IP address
- `device` (text, nullable) — user agent / device description

## 2. Security

### profiles
- RLS enabled.
- Users can SELECT and UPDATE only their own profile row (auth.uid() = id).

### wallets
- RLS enabled.
- Owner-scoped CRUD: users can only access their own linked wallets.

### sessions
- RLS enabled.
- Owner-scoped: users can read and insert their own session records.

## 3. Trigger

A `handle_new_user` trigger automatically creates a profile row when a new
auth.users record is created (works for both email and OAuth signups).

## 4. Important Notes
1. All wallet_address values should be stored lowercased for consistent lookups.
2. The profiles.id defaults to auth.uid() so the auto-created profile is keyed
   to the authenticated user.
3. Email confirmation stays OFF per project conventions.
*/

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text UNIQUE,
  username text,
  avatar text,
  email text,
  ens_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  wallet_provider text NOT NULL CHECK (wallet_provider IN ('metamask', 'rabby', 'walletconnect', 'injected')),
  network text,
  connected_at timestamptz DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wallets" ON wallets;
CREATE POLICY "select_own_wallets" ON wallets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wallets" ON wallets;
CREATE POLICY "insert_own_wallets" ON wallets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wallets" ON wallets;
CREATE POLICY "delete_own_wallets" ON wallets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  last_login timestamptz DEFAULT now(),
  ip text,
  device text
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON sessions;
CREATE POLICY "select_own_sessions" ON sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON sessions;
CREATE POLICY "insert_own_sessions" ON sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
