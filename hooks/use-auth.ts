'use client';

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { getProfile, recordSession } from '@/lib/auth-service';
import type { AuthUser } from '@/lib/types';

function mapProfileToAuthUser(
  profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>,
  email: string | null
): AuthUser {
  return {
    id: profile.id,
    email: profile.email ?? email,
    walletAddress: profile.wallet_address,
    username: profile.username,
    avatar: profile.avatar,
  };
}

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, signOut } =
    useAuthStore();

  const loadSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data) {
        setUser(null);
        return;
      }
      const session = data.session;

      if (!session) {
        setUser(null);
        return;
      }

      const profile = await getProfile(session.user.id).catch(() => null);
      if (profile) {
        setUser(mapProfileToAuthUser(profile, session.user.email ?? null));
        recordSession(
          session.user.id,
          typeof navigator !== 'undefined' ? navigator.userAgent : null
        ).catch(() => {});
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email ?? null,
          walletAddress: null,
          username: null,
          avatar: null,
        });
      }
    } catch {
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    loadSession();

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          (async () => {
            try {
              if (!session) {
                setUser(null);
                return;
              }
              const profile = await getProfile(session.user.id).catch(() => null);
              if (profile) {
                setUser(mapProfileToAuthUser(profile, session.user.email ?? null));
              } else {
                setUser({
                  id: session.user.id,
                  email: session.user.email ?? null,
                  walletAddress: null,
                  username: null,
                  avatar: null,
                });
              }
            } catch {
              setUser(null);
            }
          })();
        }
      );
      subscription = data?.subscription ?? null;
    } catch {
      setUser(null);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadSession, setUser]);

  return { user, isLoading, isAuthenticated, signOut };
}
