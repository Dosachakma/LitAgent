'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, Copy, LogOut, Check, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { truncateAddress } from '@/lib/format';
import { cn } from '@/lib/utils';
import { WalletModal } from '@/components/wallet/wallet-modal';
import {
  LITVM_TESTNET,
  switchOrAddNetwork,
  providerLabel,
  getExplorerUrl,
  type EIP1193Provider,
} from '@/lib/wallet-service';

export function WalletConnect() {
  const {
    address,
    chainId,
    provider,
    activeProvider,
    walletName,
    isConnecting,
    error,
    setModalOpen,
    setChainId,
    disconnect,
  } = useWalletStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLitVMNetwork =
    !address ||
    chainId === LITVM_TESTNET.chainId ||
    chainId === LITVM_TESTNET.chainIdHex;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwitchNetwork = async () => {
    if (!activeProvider) return;
    setSwitchingNetwork(true);
    try {
      await switchOrAddNetwork(activeProvider);
      setChainId(LITVM_TESTNET.chainId);
    } catch (err) {
      console.error('Failed to switch network:', err);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {!address ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              disabled={isConnecting}
              className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </span>
              <span className="sm:hidden">{isConnecting ? '...' : 'Connect'}</span>
            </button>
            {error && (
              <p className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-destructive/30 bg-black/90 p-3 text-xs text-destructive shadow-xl backdrop-blur-md">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all',
                isLitVMNetwork
                  ? 'border-white/10 bg-white/5 text-white hover:border-primary/40 hover:bg-white/10'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
              )}
            >
              {isLitVMNetwork ? (
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              )}

              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs">
                  {truncateAddress(address)}
                </span>
                <span className="hidden md:inline-block text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                  {isLitVMNetwork ? 'LitVM' : 'Wrong Net'}
                </span>
              </div>

              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground transition-transform',
                  dropdownOpen && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-[#0d0e15] p-3 shadow-2xl backdrop-blur-xl"
                >
                  <div className="px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Connected Account
                      </span>
                      <span className="text-[10px] font-medium text-primary">
                        {walletName || (provider ? providerLabel(provider) : 'Web3 Wallet')}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-white break-all pt-1">
                      {address}
                    </p>
                  </div>

                  {/* Network Status Badge inside Dropdown */}
                  <div className="my-2 p-2.5 rounded-xl border border-white/5 bg-white/5 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active Network</span>
                      <span
                        className={cn(
                          'font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md',
                          isLitVMNetwork
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        )}
                      >
                        {isLitVMNetwork ? 'LitVM Testnet (4441)' : `Chain ${chainId}`}
                      </span>
                    </div>

                    {!isLitVMNetwork && activeProvider && (
                      <button
                        onClick={handleSwitchNetwork}
                        disabled={switchingNetwork}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                      >
                        <RefreshCw className={cn('h-3.5 w-3.5', switchingNetwork && 'animate-spin')} />
                        {switchingNetwork ? 'Switching...' : 'Switch to LitVM Testnet'}
                      </button>
                    )}
                  </div>

                  <div className="my-1 h-px bg-white/10" />

                  <button
                    onClick={handleCopy}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? 'Address Copied!' : 'Copy address'}
                  </button>

                  <a
                    href={getExplorerUrl(address, 'address')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Caldera Explorer
                  </a>

                  <button
                    onClick={() => {
                      disconnect();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect Wallet
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Global Wallet Selection Modal */}
      <WalletModal />
    </>
  );
}
