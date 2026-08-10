import { supabase } from './supabase';
import type { ConnectedAccount, SocialProvider } from './types';

// In-memory fallback cache when Supabase database table isn't created or in mock mode
const inMemoryConnectedAccounts: Map<string, ConnectedAccount[]> = new Map();

export async function getConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('connected_at', { ascending: false });

      if (!error && data) {
        return data as ConnectedAccount[];
      }
    } catch {
      // Fallback to in-memory store
    }
  }

  return inMemoryConnectedAccounts.get(userId) || [];
}

export async function connectAccount(params: {
  userId: string;
  provider: SocialProvider;
  providerUserId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}): Promise<{ success: boolean; account?: ConnectedAccount; error?: string }> {
  const { userId, provider, providerUserId, username, displayName, avatarUrl } = params;

  // Clean username (remove leading @ if provided)
  const cleanUsername = username.replace(/^@/, '').trim();

  if (!cleanUsername) {
    return { success: false, error: 'A valid username or account ID is required.' };
  }

  // Check account switching / duplicate account rule:
  // Is this social provider account ID / handle already connected to ANOTHER user?
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('connected_accounts')
        .select('user_id')
        .eq('provider', provider)
        .or(`provider_user_id.eq.${providerUserId},username.ilike.${cleanUsername}`)
        .maybeSingle();

      if (existing && existing.user_id !== userId) {
        return {
          success: false,
          error: `This ${provider.toUpperCase()} account is already connected to another LitAgent account.`,
        };
      }
    } catch {
      // Ignore DB query error and proceed to memory check
    }
  }

  // Check in-memory accounts for duplicate connection
  for (const [otherUserId, accounts] of Array.from(inMemoryConnectedAccounts.entries())) {
    if (otherUserId !== userId) {
      const isAlreadyLinked = accounts.some(
        (acc) =>
          acc.provider === provider &&
          (acc.provider_user_id === providerUserId ||
            acc.username.toLowerCase() === cleanUsername.toLowerCase())
      );
      if (isAlreadyLinked) {
        return {
          success: false,
          error: `This ${provider.toUpperCase()} account is already connected to another LitAgent account.`,
        };
      }
    }
  }

  const now = new Date().toISOString();
  const accountRecord: ConnectedAccount = {
    id: `ca-${provider}-${crypto.randomUUID()}`,
    user_id: userId,
    provider,
    provider_user_id: providerUserId,
    username: cleanUsername,
    display_name: displayName || cleanUsername,
    avatar_url: avatarUrl || null,
    connected_at: now,
    updated_at: now,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('connected_accounts')
        .upsert(
          {
            id: accountRecord.id,
            user_id: userId,
            provider,
            provider_user_id: providerUserId,
            username: cleanUsername,
            display_name: accountRecord.display_name,
            avatar_url: accountRecord.avatar_url,
            connected_at: now,
            updated_at: now,
          },
          { onConflict: 'user_id,provider' }
        )
        .select('*')
        .maybeSingle();

      if (!error && data) {
        // Sync handle to profile
        const profileUpdates: Record<string, string> = {};
        if (provider === 'x') profileUpdates.x_handle = cleanUsername;
        if (provider === 'telegram') profileUpdates.telegram_handle = cleanUsername;
        if (provider === 'discord') profileUpdates.discord_handle = cleanUsername;

        await supabase.from('profiles').update(profileUpdates).eq('id', userId);

        return { success: true, account: data as ConnectedAccount };
      }
    } catch {
      // Fallback to memory
    }
  }

  // Save in memory
  const userAccounts = inMemoryConnectedAccounts.get(userId) || [];
  const filtered = userAccounts.filter((a) => a.provider !== provider);
  filtered.push(accountRecord);
  inMemoryConnectedAccounts.set(userId, filtered);

  return { success: true, account: accountRecord };
}

export async function disconnectAccount(
  userId: string,
  provider: SocialProvider
): Promise<boolean> {
  if (supabase) {
    try {
      await supabase
        .from('connected_accounts')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      const profileUpdates: Record<string, null> = {};
      if (provider === 'x') profileUpdates.x_handle = null;
      if (provider === 'telegram') profileUpdates.telegram_handle = null;
      if (provider === 'discord') profileUpdates.discord_handle = null;

      await supabase.from('profiles').update(profileUpdates).eq('id', userId);
    } catch {
      // Ignore DB error
    }
  }

  // Update in-memory
  const userAccounts = inMemoryConnectedAccounts.get(userId) || [];
  const filtered = userAccounts.filter((a) => a.provider !== provider);
  inMemoryConnectedAccounts.set(userId, filtered);

  return true;
}
