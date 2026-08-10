'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Coins,
  LogOut,
  Clock,
  ArrowUpRight,
  Lock,
  Layers,
  Activity,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { NetworkStatusCard } from '@/components/wallet/network-status-card';
import { TransactionDetailModal } from '@/components/wallet/transaction-detail-modal';
import { WalletAuthButtons } from '@/components/auth/wallet-auth-buttons';
import { useWalletStore } from '@/store/wallet-store';
import { truncateAddress } from '@/lib/format';
import {
  LITVM_TESTNET,
  providerLabel,
  getExplorerUrl,
} from '@/lib/wallet-service';
import { useToast } from '@/hooks/use-toast';
import type { WalletTokenBalance, WalletTransactionDetail } from '@/lib/litvm-rpc-service';

export function WalletPage() {
  const { address, provider, chainId, disconnect } = useWalletStore();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [nativeBalance, setNativeBalance] = useState<string>('0.0000');
  const [tokens, setTokens] = useState<WalletTokenBalance[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionDetail[]>([]);
  const [selectedTx, setSelectedTx] = useState<WalletTransactionDetail | null>(null);

  const fetchWalletData = useCallback(async () => {
    if (!address) return;
    setLoadingData(true);
    try {
      const res = await fetch(`/api/wallet?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setNativeBalance(data.nativeBalance || '0.0000');
        setTokens(data.tokens || []);
        setTransactions(data.transactions || []);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setNativeBalance('0.0000');
      }
    } catch (err) {
      console.error('Error loading wallet data:', err);
      toast({
        title: 'Network Sync Error',
        description: 'Unable to load LitVM network data. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  }, [address, toast]);

  useEffect(() => {
    if (address) {
      fetchWalletData();
    }
  }, [address, provider, chainId, fetchWalletData]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast({
      title: 'Address Copied',
      description: 'Wallet address copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Wallet Dashboard"
        subtitle="Professional Web3 wallet management, LitVM network status, and real-time asset telemetry"
        icon={<Wallet className="h-5 w-5" />}
      />

      {address ? (
        <div className="space-y-6">
          {/* Top overview row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Primary wallet card */}
            <GlassCard className="p-6 lg:col-span-2 flex flex-col justify-between space-y-6">
              <div>
                {/* Wallet Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Wallet Avatar / Identicon */}
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg ring-2 ring-primary/20">
                      <Wallet className="h-6 w-6" />
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-lg">
                          {provider ? providerLabel(provider) : 'Web3 Wallet'}
                        </h3>
                        <BadgePill label="Connected" variant="success" />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                        <span>{truncateAddress(address, 6)}</span>
                        {lastUpdated && (
                          <span className="text-[10px] text-muted-foreground/60">
                            • Synced {lastUpdated}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchWalletData}
                      disabled={loadingData}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                      title="Refresh Blockchain Data"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                      onClick={disconnect}
                      className="flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Address bar with copy & explorer links */}
                <div className="mt-6 rounded-xl border border-white/8 bg-white/5 p-4">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Full Connected Address
                  </span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-white break-all sm:text-sm">
                      {address}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={handleCopy}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:text-white hover:bg-white/10"
                        title="Copy Address"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>

                      <a
                        href={getExplorerUrl(address, 'address')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:text-white hover:bg-white/10"
                        title="View on Caldera Explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Native Balance Display */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary">
                      <Coins className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Native zkLTC Balance</p>
                      <p className="text-2xl font-bold text-white">
                        {loadingData ? (
                          <span className="animate-pulse">Loading...</span>
                        ) : (
                          `${nativeBalance} ${LITVM_TESTNET.nativeCurrency.symbol}`
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={getExplorerUrl(address, 'address')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      Explorer <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>Real-time JSON-RPC connection active</span>
                </div>
                <span className="font-mono text-[11px]">Chain: {LITVM_TESTNET.chainId}</span>
              </div>
            </GlassCard>

            {/* Network Status Card */}
            <NetworkStatusCard />
          </div>

          {/* Supported Tokens Section */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Supported Token Assets
                </h3>
                <p className="text-xs text-muted-foreground">
                  Verified tokens with contract data on LitVM Testnet
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {tokens.length} Assets
              </span>
            </div>

            {loadingData ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Syncing token contract balances on LitVM RPC...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                      <th className="py-2.5 px-3 font-medium">Asset</th>
                      <th className="py-2.5 px-3 font-medium">Contract Address</th>
                      <th className="py-2.5 px-3 font-medium">Balance</th>
                      <th className="py-2.5 px-3 font-medium">Testnet Price Feed</th>
                      <th className="py-2.5 px-3 font-medium text-right">Explorer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tokens.map((t) => (
                      <tr key={t.token.symbol} className="transition-colors hover:bg-white/5">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                              {t.token.symbol.slice(0, 3)}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{t.token.name}</p>
                              <p className="text-[10px] text-muted-foreground">{t.token.symbol}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-muted-foreground">
                          {t.token.isNative ? (
                            <BadgePill label="Native Asset" variant="primary" />
                          ) : (
                            truncateAddress(t.token.address, 6)
                          )}
                        </td>

                        <td className="py-3 px-3 font-bold text-white">
                          {t.balanceFormatted}
                        </td>

                        <td className="py-3 px-3">
                          {t.priceUsd !== null ? (
                            <span className="text-emerald-400 font-mono">${t.priceUsd.toFixed(2)} USD</span>
                          ) : (
                            <span className="text-muted-foreground/70 italic text-[11px]">
                              Price unavailable (Testnet)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <a
                            href={
                              t.token.isNative
                                ? getExplorerUrl(address, 'address')
                                : `https://liteforge.explorer.caldera.xyz/token/${t.token.address}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Contract <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Recent Transactions Section */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Recent Blockchain Transactions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Transactions detected on LitVM Liteforge Testnet
                </p>
              </div>
              <a
                href={getExplorerUrl(address, 'address')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Full Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {loadingData ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Querying LitVM explorer API for account transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No recorded transactions found for address <span className="font-mono text-white">{truncateAddress(address, 6)}</span> on LitVM Testnet.
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  Transactions will automatically populate when you perform transfers, claims, or contract interactions.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                      <th className="py-2.5 px-3 font-medium">Type</th>
                      <th className="py-2.5 px-3 font-medium">Tx Hash</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium">Value</th>
                      <th className="py-2.5 px-3 font-medium">Timestamp</th>
                      <th className="py-2.5 px-3 font-medium text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.slice(0, 10).map((tx) => (
                      <tr
                        key={tx.hash}
                        onClick={() => setSelectedTx(tx)}
                        className="cursor-pointer transition-colors hover:bg-white/5"
                      >
                        <td className="py-3 px-3 capitalize font-medium text-white">
                          {tx.type.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3 font-mono text-primary">
                          {truncateAddress(tx.hash, 6)}
                        </td>
                        <td className="py-3 px-3">
                          <BadgePill
                            label={tx.status}
                            variant={tx.status === 'completed' ? 'success' : 'warning'}
                          />
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">{tx.value}</td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTx(tx);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Inspect <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Security & Verification status */}
          <GlassCard className="p-5 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Non-Custodial Security Protocol</h4>
                <p className="text-xs text-muted-foreground">
                  LitAgent operates with strict client-side signers. Private keys and seed phrases are never requested, stored, or transmitted. All on-chain actions must be explicitly authorized via your connected wallet.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        /* Unconnected State */
        <div className="space-y-6">
          <GlassCard className="p-8 max-w-xl mx-auto text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-white shadow-xl">
              <Wallet className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Connect Web3 Wallet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Connect your preferred browser wallet to view your real LitVM portfolio, zkLTC native balances, token holdings, and transaction history.
              </p>
            </div>

            <div className="pt-2">
              <WalletAuthButtons />
            </div>
          </GlassCard>

          {/* Network details for unauthenticated users */}
          <div className="max-w-xl mx-auto">
            <NetworkStatusCard />
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
