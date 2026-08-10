'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  getWalletOptions,
  detectProviders,
  requestAccounts,
  personalSign,
  generateNonce,
  buildSignInMessage,
  getChainId,
  type EIP1193Provider,
} from '@/lib/wallet-service';
import { useWalletStore } from '@/store/wallet-store';
import type { WalletProvider } from '@/lib/types';
import { cn } from '@/lib/utils';

type ButtonConfig = {
  provider: WalletProvider;
  label: string;
  icon: React.ReactNode;
  gradient: string;
};

const walletButtons: ButtonConfig[] = [
  {
    provider: 'metamask',
    label: 'Connect MetaMask',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#F6851B" />
        <path
          d="M21.5 12.5l-3.5 2.8.3-1.6 3.2-2.2-3 .1z"
          fill="#E2761B"
          stroke="#E2761B"
          strokeWidth=".5"
        />
        <path
          d="M10.5 12.5l3.5 2.8-.3-1.6-3.2-2.2 3 .1z"
          fill="#E4761B"
          stroke="#E4761B"
          strokeWidth=".5"
        />
        <path
          d="M19 20.5l-1-1h-4l-1 1-1.5 1.5 1 4 2-1.5h3l2 1.5 1-4z"
          fill="#E4761B"
          stroke="#E4761B"
          strokeWidth=".5"
        />
        <path
          d="M10 10l1 3.5-.5 6.5 2 6 2.5-1 3-3v-4l-3-1-1.5-4.5L10 10z"
          fill="#763D16"
          stroke="#763D16"
          strokeWidth=".5"
        />
        <path
          d="M22 10l-1 3.5.5 6.5-2 6-2.5-1-3-3v-4l3-1 1.5-4.5L22 10z"
          fill="#D7C1B3"
          stroke="#D7C1B3"
          strokeWidth=".5"
        />
      </svg>
    ),
    gradient: 'hover:border-[#F6851B]/40',
  },
  {
    provider: 'rabby',
    label: 'Connect Rabby',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#0E0E0E" />
        <path
          d="M16 7c-3.5 0-6 2.5-6 6 0 2 1 3.5 1 5 0 .5-.5 1.5-.5 2.5 0 1 .5 2 1.5 2s1.5-1 1.5-2c0-.5-.5-1-.5-1.5 0-1 1-1.5 2-1.5s2 .5 2 1.5c0 .5-.5 1-.5 1.5 0 1 .5 2 1.5 2s1.5-1 1.5-2c0-1-.5-2-.5-2.5 0-1.5 1-3 1-5 0-3.5-2.5-6-6-6z"
          fill="#A855F7"
        />
      </svg>
    ),
    gradient: 'hover:border-[#A855F7]/40',
  },
];

export function WalletAuthButtons() {
  const router = useRouter();
  const { setAddress, setChainId, setProvider, setActiveProvider, setConnecting, setModalOpen } = useWalletStore();
  const [connectingProvider, setConnectingProvider] = useState<WalletProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWithProvider = async (
    provider: WalletProvider,
    target: EIP1193Provider | null
  ) => {
    if (!target) {
      // If direct target is not available, open the full wallet modal
      setModalOpen(true);
      return;
    }

    setConnectingProvider(provider);
    setError(null);

    try {
      const accounts = await requestAccounts(target);
      if (accounts.length === 0) {
        setError('No accounts returned. Please unlock your wallet and try again.');
        return;
      }

      const address = accounts[0];
      let chainId = '1';
      try {
        const hex = await getChainId(target);
        if (hex && hex.startsWith('0x')) {
          chainId = parseInt(hex, 16).toString();
        } else if (hex) {
          chainId = hex;
        }
      } catch {
        // Fallback
      }

      const nonce = generateNonce();
      const message = buildSignInMessage(address, nonce);
      const signature = await personalSign(target, address, message);

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', address.toLowerCase())
        .maybeSingle();

      if (existing) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: `wallet+${address.toLowerCase()}@litagent.app`,
          password: signature.slice(0, 32),
        });

        if (signInError) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: `wallet+${address.toLowerCase()}@litagent.app`,
            password: signature.slice(0, 32),
            options: {
              data: { wallet_address: address.toLowerCase() },
            },
          });
          if (signUpError) throw signUpError;
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: `wallet+${address.toLowerCase()}@litagent.app`,
          password: signature.slice(0, 32),
          options: {
            data: { wallet_address: address.toLowerCase() },
          },
        });
        if (signUpError) throw signUpError;
      }

      setAddress(address);
      setChainId(chainId);
      setProvider(provider);
      setActiveProvider(target);
      router.push('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
    } finally {
      setConnectingProvider(null);
      setConnecting(false);
    }
  };

  const handleConnect = async (provider: WalletProvider) => {
    setConnecting(true);
    setError(null);

    const { metamask, rabby, injected } = detectProviders();
    const target =
      provider === 'metamask' ? metamask : provider === 'rabby' ? rabby : injected;

    await connectWithProvider(provider, target);
  };

  return (
    <div className="space-y-2.5">
      {/* Primary Multi-Wallet Connection Modal Launcher */}
      <button
        onClick={() => setModalOpen(true)}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        <Wallet className="h-4 w-4" />
        <span>Select EVM Wallet</span>
      </button>

      <div className="relative my-3 text-center">
        <span className="bg-[#0d0e15] px-2 text-[10px] uppercase text-muted-foreground">
          or quick connect
        </span>
      </div>

      {walletButtons.map((btn) => {
        const isLoading = connectingProvider === btn.provider;
        return (
          <button
            key={btn.provider}
            onClick={() => handleConnect(btn.provider)}
            disabled={connectingProvider !== null}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:opacity-60',
              btn.gradient
            )}
          >
            {btn.icon}
            <span>{btn.label}</span>
            {isLoading && (
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />
            )}
          </button>
        );
      })}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
