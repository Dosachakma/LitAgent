'use client';

import { supabase } from './supabase';
import type { Profile, WalletRecord, SessionRecord } from './types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'username' | 'avatar' | 'email' | 'wallet_address' | 'ens_name'>>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

export async function linkWallet(
  userId: string,
  walletAddress: string,
  walletProvider: string,
  network: string | null = null
): Promise<WalletRecord | null> {
  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: userId,
      wallet_address: walletAddress.toLowerCase(),
      wallet_provider: walletProvider,
      network,
    })
    .select('*')
    .maybeSingle();
  if (error) return null;
  return data as WalletRecord | null;
}

export async function unlinkWallet(userId: string, walletId: string): Promise<boolean> {
  const { error } = await supabase
    .from('wallets')
    .delete()
    .eq('id', walletId)
    .eq('user_id', userId);
  return !error;
}

export async function getLinkedWallets(userId: string): Promise<WalletRecord[]> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('connected_at', { ascending: false });
  if (error || !data) return [];
  return data as WalletRecord[];
}

export async function recordSession(
  userId: string,
  device: string | null = null,
  ip: string | null = null
): Promise<SessionRecord | null> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      device,
      ip,
      last_login: new Date().toISOString(),
    })
    .select('*')
    .maybeSingle();
  if (error) return null;
  return data as SessionRecord | null;
}

export async function getSessionHistory(userId: string): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_login', { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data as SessionRecord[];
}
