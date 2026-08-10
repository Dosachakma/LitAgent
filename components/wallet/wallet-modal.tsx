'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Loader2, AlertCircle, ShieldCheck, ArrowRight, Wallet } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import {
  initEIP6963Discovery,
  getWalletOptions,
  connectWalletOption,
  switchOrAddNetwork,
  LITVM_TESTNET,
  type WalletOption,
  type EIP1193Provider,
} from '@/lib/wallet-service';
import type { WalletProvider } from '@/lib/types';

export function WalletModal() {
  const {
    isModalOpen,
    setModalOpen,
    setAddress,
    setChainId,
    setProvider,
    setActiveProvider,
    setWalletName,
    setWalletIcon,
    setConnecting,
    isConnecting,
    setError,
    error,
    disconnect,
  } = useWalletStore();

  const [mounted, setMounted] = useState(false);
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Refresh wallet options when modal opens or EIP-6963 fires
  const refreshWallets = useCallback(() => {
    setWalletOptions(getWalletOptions());
  }, []);

  useEffect(() => {
    const cleanup = initEIP6963Discovery();
    refreshWallets();

    // Periodic check for newly injected providers
    const interval = setInterval(refreshWallets, 1500);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [refreshWallets]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && !isConnecting) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isConnecting, setModalOpen]);

  // Handle wallet selection and connection
  const handleSelectWallet = async (option: WalletOption) => {
    if (!option.installed || !option.provider) {
      if (option.installUrl) {
        window.open(option.installUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setSelectedWallet(option);
    setConnecting(true);
    setError(null);

    try {
      const { address, chainId, provider } = await connectWalletOption(option);

      setAddress(address);
      setChainId(chainId);
      setProvider(option.id as WalletProvider);
      setActiveProvider(provider);
      setWalletName(option.name);
      setWalletIcon(option.icon);

      // Attach EIP-1193 event listeners
      attachProviderListeners(provider, option.name);

      // Auto-prompt network switch if on wrong network
      if (chainId !== LITVM_TESTNET.chainId && chainId !== LITVM_TESTNET.chainIdHex) {
        try {
          await switchOrAddNetwork(provider);
          setChainId(LITVM_TESTNET.chainId);
        } catch (netErr: unknown) {
          console.warn('Network switch request dismissed:', netErr);
        }
      }

      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(msg);
    } finally {
      setConnecting(false);
      setSelectedWallet(null);
    }
  };

  const attachProviderListeners = (provider: EIP1193Provider, walletName: string) => {
    if (!provider.on) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accList = accounts as string[];
      if (accList && accList.length > 0) {
        setAddress(accList[0]);
      } else {
        disconnect();
      }
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      if (typeof chainIdHex === 'string') {
        const parsed = chainIdHex.startsWith('0x')
          ? parseInt(chainIdHex, 16).toString()
          : chainIdHex;
        setChainId(parsed);
      }
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
  };

  if (!mounted) return null;

  const installedWallets = walletOptions.filter((w) => w.installed);
  const otherWallets = walletOptions.filter((w) => !w.installed);

  return createPortal(
    <AnimatePresence>
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isConnecting) setModalOpen(false);
            }}
            className="fixed inset-0 bg-black/65 backdrop-blur-md"
          />

          {/* Modal Window Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-[10000] my-auto w-[calc(100vw-32px)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0e15] p-6 shadow-2xl glass-strong"
          >
            {/* Close button */}
            <button
              onClick={() => {
                if (!isConnecting) setModalOpen(false);
              }}
              disabled={isConnecting}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 pr-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-white shadow-md shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h2 id="wallet-modal-title" className="text-lg font-bold text-white">
                  Connect Wallet
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select your EVM wallet to interact with LitAgent & LitVM
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Connection Issue</p>
                  <p className="mt-0.5 text-destructive/90">{error}</p>
                </div>
              </div>
            )}

            {/* Connecting Overlay State */}
            {isConnecting && selectedWallet ? (
              <div className="my-8 flex flex-col items-center justify-center space-y-4 text-center py-6">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                  <div
                    className="h-14 w-14 p-1.5 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg"
                    dangerouslySetInnerHTML={{ __html: selectedWallet.icon.startsWith('<svg') ? selectedWallet.icon : `<img src="${selectedWallet.icon}" alt="${selectedWallet.name}" class="h-full w-full object-contain" />` }}
                  />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Connecting to {selectedWallet.name}...
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                    Please approve the connection request in your browser wallet extension popup.
                  </p>
                </div>
              </div>
            ) : (
              /* Wallet Selection List */
              <div className="mt-6 space-y-5">
                {/* Installed Wallets */}
                {installedWallets.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Installed Wallets
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {installedWallets.length} Detected
                      </span>
                    </div>

                    <div className="space-y-2">
                      {installedWallets.map((wallet) => (
                        <button
                          key={wallet.id}
                          onClick={() => handleSelectWallet(wallet)}
                          className="group flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/5 p-3.5 transition-all hover:border-primary/40 hover:bg-white/10 active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 shrink-0 p-1 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden"
                              dangerouslySetInnerHTML={{ __html: wallet.icon.startsWith('<svg') ? wallet.icon : `<img src="${wallet.icon}" alt="${wallet.name}" class="h-full w-full object-contain" />` }}
                            />
                            <div className="text-left">
                              <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                                {wallet.name}
                              </p>
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Installed
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-muted-foreground group-hover:text-white transition-colors">
                            <span className="text-xs font-medium hidden sm:inline">Connect</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Supported Wallets */}
                {otherWallets.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {installedWallets.length > 0 ? 'Other Supported Wallets' : 'Available Wallets'}
                    </span>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {otherWallets.map((wallet) => (
                        <div
                          key={wallet.id}
                          className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-8 shrink-0 p-1 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden opacity-80"
                              dangerouslySetInnerHTML={{ __html: wallet.icon.startsWith('<svg') ? wallet.icon : `<img src="${wallet.icon}" alt="${wallet.name}" class="h-full w-full object-contain" />` }}
                            />
                            <div>
                              <p className="text-sm font-medium text-white/80">{wallet.name}</p>
                              <span className="text-[10px] text-muted-foreground">Not Installed</span>
                            </div>
                          </div>

                          <a
                            href={wallet.installUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors"
                          >
                            Install <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Notice */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                LitVM Liteforge Network ({LITVM_TESTNET.chainId})
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/70">EIP-6963 / EIP-1193</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

