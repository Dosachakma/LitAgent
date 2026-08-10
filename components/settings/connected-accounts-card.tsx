'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '@/components/shared/glass-card';
import {
  CheckCircle2,
  Link2,
  Unlink,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { ConnectedAccount, SocialProvider } from '@/lib/types';
import { useWalletStore } from '@/store/wallet-store';

interface ConfigErrorState {
  provider: SocialProvider;
  title: string;
  error: string;
  callbackUrl?: string;
  requiredVars: string[];
}

export function ConnectedAccountsCard() {
  const { address } = useWalletStore();
  const userId = address ? address.toLowerCase() : 'demo-user';

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionProvider, setActionProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [configError, setConfigError] = useState<ConfigErrorState | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<{
    provider: SocialProvider;
    username: string;
  } | null>(null);

  // Telegram auth state
  const [telegramBotUsername, setTelegramBotUsername] = useState<string | null>(null);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramVerifying, setTelegramVerifying] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/connected-accounts?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Error fetching connected accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle postMessage from OAuth popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { provider, username } = event.data;
        setSuccessMessage(`Successfully authorized and connected ${provider.toUpperCase()} (@${username})!`);
        fetchAccounts();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchAccounts]);

  // Initiate OAuth flow
  const handleConnect = async (provider: SocialProvider) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfigError(null);
    setActionProvider(provider);

    try {
      const res = await fetch(
        `/api/auth/oauth/url?provider=${provider}&userId=${encodeURIComponent(userId)}`
      );
      const data = await res.json();

      if (!data.configured) {
        let requiredVars: string[] = [];
        if (provider === 'x') requiredVars = ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'];
        if (provider === 'discord') requiredVars = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET'];
        if (provider === 'telegram') requiredVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_USERNAME'];

        setConfigError({
          provider,
          title: `${provider === 'x' ? 'X / Twitter' : provider.toUpperCase()} Connection Not Configured`,
          error: data.error || `${provider.toUpperCase()} connection is not configured on the server.`,
          callbackUrl: data.callbackUrl,
          requiredVars,
        });
        return;
      }

      if (provider === 'telegram') {
        setTelegramBotUsername(data.botUsername);
        setShowTelegramModal(true);
        return;
      }

      if (data.url) {
        const popup = window.open(
          data.url,
          'oauth_popup',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          setErrorMessage(
            'Popup blocked by browser. Please allow popups for this site to connect your account.'
          );
        }
      }
    } catch (err) {
      console.error('Connect error:', err);
      setErrorMessage(`Error starting authorization for ${provider.toUpperCase()}.`);
    } finally {
      setActionProvider(null);
    }
  };

  // Process Telegram authentication response
  const handleTelegramAuth = useCallback(async (telegramUser: any) => {
    setTelegramVerifying(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          authData: telegramUser,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Failed to verify Telegram authorization.');
      } else {
        setSuccessMessage(`Successfully verified Telegram account @${data.account.username}!`);
        setShowTelegramModal(false);
        await fetchAccounts();
      }
    } catch (err) {
      console.error('Telegram verify error:', err);
      setErrorMessage('Failed to verify Telegram account.');
    } finally {
      setTelegramVerifying(false);
    }
  }, [userId, fetchAccounts]);

  // Mount Telegram widget inside modal when modal opens
  useEffect(() => {
    if (showTelegramModal && telegramBotUsername) {
      // Define global window handler
      (window as any).onTelegramAuth = (user: any) => {
        handleTelegramAuth(user);
      };

      const container = document.getElementById('telegram-widget-container');
      if (container) {
        container.innerHTML = '';
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', telegramBotUsername);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '8');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        script.async = true;
        container.appendChild(script);
      }
    }
  }, [showTelegramModal, telegramBotUsername, handleTelegramAuth]);

  // Execute disconnect
  const executeDisconnect = async (provider: SocialProvider) => {
    try {
      setActionProvider(provider);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await fetch(
        `/api/user/connected-accounts?userId=${encodeURIComponent(userId)}&provider=${provider}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        setSuccessMessage(`Disconnected ${provider === 'x' ? 'X / Twitter' : provider.toUpperCase()} account.`);
        setConfirmDisconnect(null);
        await fetchAccounts();
      } else {
        setErrorMessage(`Failed to disconnect ${provider.toUpperCase()} account.`);
      }
    } catch (err) {
      setErrorMessage(`Error disconnecting ${provider.toUpperCase()} account.`);
      console.error('Disconnect error:', err);
    } finally {
      setActionProvider(null);
    }
  };

  const getAccount = (provider: SocialProvider) => accounts.find((a) => a.provider === provider);

  const providerConfigs: {
    id: SocialProvider;
    title: string;
    description: string;
    iconColor: string;
  }[] = [
    {
      id: 'x',
      title: 'X / Twitter',
      description: 'Connect your official X account',
      iconColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    {
      id: 'telegram',
      title: 'Telegram',
      description: 'Connect your official Telegram account',
      iconColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      id: 'discord',
      title: 'Discord',
      description: 'Connect your official Discord account',
      iconColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
  ];

  return (
    <GlassCard className="p-5 lg:col-span-2 space-y-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Connected Accounts</h3>
            <p className="text-xs text-muted-foreground">
              Verify official social identities for automated mission tracking & anti-abuse enforcement
            </p>
          </div>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid of Social Accounts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {providerConfigs.map((p) => {
          const connected = getAccount(p.id);
          const isProcessing = actionProvider === p.id;

          return (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-xl border border-white/8 bg-white/[0.02] p-5 transition-all hover:border-white/15"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${p.iconColor}`}>
                    {p.id === 'x' && (
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    )}
                    {p.id === 'telegram' && (
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.66-2.89 8.01-3.45 3.81-1.59 4.61-1.87 5.13-1.88.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.22z" />
                      </svg>
                    )}
                    {p.id === 'discord' && (
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    )}
                  </div>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Not Connected
                    </span>
                  )}
                </div>

                <h4 className="mt-3.5 font-semibold text-white text-sm">{p.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </p>

                {connected && (
                  <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Verified Account
                    </p>
                    <p className="mt-0.5 text-xs font-mono font-bold text-white truncate">
                      @{connected.username}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-white/5">
                {connected ? (
                  <button
                    onClick={() =>
                      setConfirmDisconnect({ provider: p.id, username: connected.username })
                    }
                    disabled={isProcessing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Unlink className="h-3.5 w-3.5" /> Disconnect
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(p.id)}
                    disabled={isProcessing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-xs font-medium text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="h-3.5 w-3.5" /> Connect {p.title.split(' ')[0]}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Missing Modal / Notice */}
      {configError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-neutral-900/95 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{configError.title}</h3>
                  <p className="text-xs text-amber-400/90 font-medium">Missing Server Credentials</p>
                </div>
              </div>
              <button
                onClick={() => setConfigError(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Official authorization requires registered application keys. Please configure these environment variables in your server configuration:
            </p>

            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2">
              <p className="text-[11px] font-semibold text-white uppercase tracking-wider">
                Required Environment Variables
              </p>
              <div className="space-y-1">
                {configError.requiredVars.map((v) => (
                  <code key={v} className="block text-xs font-mono text-purple-300">
                    {v}=...
                  </code>
                ))}
              </div>
            </div>

            {configError.callbackUrl && (
              <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-1">
                <p className="text-[11px] font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="h-3 w-3 text-primary" /> OAuth Callback URL
                </p>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {configError.callbackUrl}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setConfigError(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Authorization Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-blue-500/30 bg-neutral-900/95 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Connect Official Telegram</h3>
              </div>
              <button
                onClick={() => setShowTelegramModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Click the official Telegram button below to authenticate with Bot @{telegramBotUsername}.
              Your identity will be cryptographically verified server-side.
            </p>

            <div className="flex flex-col items-center justify-center py-6 border border-white/8 bg-black/30 rounded-xl min-h-[100px]">
              {telegramVerifying ? (
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Telegram signature...</span>
                </div>
              ) : (
                <div id="telegram-widget-container" className="flex justify-center" />
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowTelegramModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Disconnect Modal */}
      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-neutral-900/95 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Disconnect {confirmDisconnect.provider === 'x' ? 'X / Twitter' : confirmDisconnect.provider.toUpperCase()}?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to disconnect @{confirmDisconnect.username}? Unlinking will revoke mission verification privileges for this account. Your wallet, XP, and completed missions will remain intact.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDisconnect(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDisconnect(confirmDisconnect.provider)}
                disabled={Boolean(actionProvider)}
                className="flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
              >
                {actionProvider === confirmDisconnect.provider ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Confirm Disconnect'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
