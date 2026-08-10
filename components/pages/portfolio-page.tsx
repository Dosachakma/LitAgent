'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  TrendingUp,
  PieChart,
  Coins,
  Image as ImageIcon,
  Activity,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
  ShieldAlert,
  Search,
  ChevronRight,
  Clock,
  ChevronLeft,
  ArrowDownLeft,
} from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { EmptyState } from '@/components/shared/empty-state';
import { StatCard } from '@/components/shared/stat-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { ContentLoader } from '@/components/shared/content-loader';
import { TransactionDetailModal } from '@/components/wallet/transaction-detail-modal';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';
import { truncateAddress } from '@/lib/format';
import { LITVM_TESTNET, getExplorerUrl } from '@/lib/wallet-service';
import type { WalletTokenBalance, WalletTransactionDetail } from '@/lib/litvm-rpc-service';

type PortfolioTab = 'overview' | 'tokens' | 'transactions' | 'activity';

export function PortfolioPage() {
  const { address, provider, chainId } = useWalletStore();
  const { setActiveNav } = useUIStore();

  const [activeTab, setActiveTab] = useState<PortfolioTab>('overview');
  const [nativeBalance, setNativeBalance] = useState<string>('0.0000');
  const [tokens, setTokens] = useState<WalletTokenBalance[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionDetail[]>([]);
  const [selectedTx, setSelectedTx] = useState<WalletTransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadPortfolioData = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/wallet?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setNativeBalance(data.nativeBalance || '0.0000');
        setTokens(data.tokens || []);
        setTransactions(data.transactions || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadPortfolioData();
  }, [address, provider, chainId, loadPortfolioData]);

  // Calculate total portfolio USD value strictly if reliable prices exist
  const hasReliablePriceData = tokens.some((t) => t.isPriceReliable && t.valueUsd !== null);
  const totalPortfolioValueUsd = tokens.reduce((sum, t) => sum + (t.valueUsd || 0), 0);

  const filteredTxs = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    return (
      tx.hash.toLowerCase().includes(term) ||
      tx.type.toLowerCase().includes(term) ||
      tx.status.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage) || 1;
  const paginatedTxs = filteredTxs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Portfolio Intelligence"
        subtitle="Track LitVM ecosystem holdings, native zkLTC assets, and verified transaction history"
        icon={<Briefcase className="h-5 w-5" />}
      />

      {!address ? (
        <EmptyState
          icon={Briefcase}
          title="Connect your wallet to view LitVM portfolio"
          description="Connect a Web3 wallet (MetaMask, Rabby, etc.) to inspect your native zkLTC balances, token contract holdings, and on-chain timeline on LitVM Liteforge Testnet."
        />
      ) : (
        <div className="space-y-6">
          {/* Header Action / Refresh Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white font-medium">
                Live LitVM RPC Telemetry
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ({truncateAddress(address, 6)})
              </span>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Last updated: {lastUpdated}
                </span>
              )}

              <button
                onClick={loadPortfolioData}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Testnet Disclaimer Warning */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>LitVM Testnet Warning:</strong> Testnet assets and price feeds have no guaranteed real-world financial value.
            </span>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Native Asset</span>
                <Coins className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : `${nativeBalance} zkLTC`}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">LitVM Liteforge Network</p>
              </div>
            </GlassCard>

            <GlassCard hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Portfolio Value</span>
                <PieChart className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">
                  {hasReliablePriceData
                    ? `$${totalPortfolioValueUsd.toFixed(2)} USD`
                    : 'Price unavailable'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {hasReliablePriceData ? 'Testnet Price Feeds' : 'Testnet Asset (No Market Price)'}
                </p>
              </div>
            </GlassCard>

            <StatCard
              icon={Coins}
              label="Tracked Tokens"
              value={tokens.length ? `${tokens.length} Assets` : '1 Asset (zkLTC)'}
            />

            <StatCard
              icon={Activity}
              label="On-Chain Transactions"
              value={transactions.length ? `${transactions.length} Transactions` : '0 Transactions'}
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 space-x-2 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: 'overview', label: 'Overview & Allocation', icon: Briefcase },
              { id: 'tokens', label: 'Token Holdings', icon: Coins },
              { id: 'transactions', label: 'Transaction History', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as PortfolioTab)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-white hover:border-white/20'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {loading ? (
            <ContentLoader lines={4} />
          ) : (
            <div className="space-y-6">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Hero Native Card */}
                  <GlassCard variant="gradient" className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <BadgePill label={LITVM_TESTNET.chainName} variant="primary" />
                          <span className="text-xs text-muted-foreground font-mono">
                            {truncateAddress(address, 6)}
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mt-2">
                          {nativeBalance} {LITVM_TESTNET.nativeCurrency.symbol}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Native gas & utility currency on LitVM Liteforge Testnet
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={getExplorerUrl(address, 'address')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
                        >
                          Explorer <ExternalLink className="h-3.5 w-3.5 text-primary" />
                        </a>
                        <button
                          onClick={() => setActiveNav('projects')}
                          className="flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-white shadow-md hover:scale-[1.02]"
                        >
                          Ecosystem Apps <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Token Assets Table */}
                  <GlassCard className="p-5 space-y-4">
                    <h3 className="text-base font-semibold text-white">Detected Token Holdings</h3>
                    <div className="divide-y divide-white/5">
                      {tokens.map((t) => (
                        <div key={t.token.symbol} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white font-bold shadow-md">
                              {t.token.symbol.slice(0, 3)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{t.token.name}</p>
                              <p className="text-xs text-muted-foreground">{t.token.symbol} • {t.token.network}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">{t.balanceFormatted}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {t.priceUsd !== null ? `$${t.priceUsd.toFixed(2)} USD` : 'Testnet Asset'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* TOKENS TAB */}
              {activeTab === 'tokens' && (
                <GlassCard className="p-5 space-y-4">
                  <h3 className="text-base font-semibold text-white">All Tracked Tokens</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-muted-foreground">
                          <th className="py-2.5 px-3 font-medium">Asset</th>
                          <th className="py-2.5 px-3 font-medium">Type</th>
                          <th className="py-2.5 px-3 font-medium">Balance</th>
                          <th className="py-2.5 px-3 font-medium">Price Feed</th>
                          <th className="py-2.5 px-3 font-medium text-right">Explorer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {tokens.map((t) => (
                          <tr key={t.token.symbol} className="hover:bg-white/5">
                            <td className="py-3 px-3 font-semibold text-white">{t.token.name} ({t.token.symbol})</td>
                            <td className="py-3 px-3 text-muted-foreground">{t.token.isNative ? 'Native' : 'ERC-20'}</td>
                            <td className="py-3 px-3 font-bold text-white">{t.balanceFormatted}</td>
                            <td className="py-3 px-3 text-muted-foreground font-mono">
                              {t.priceUsd ? `$${t.priceUsd.toFixed(2)}` : 'Price unavailable'}
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
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                View <ExternalLink className="h-3 w-3" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}

              {/* TRANSACTIONS TAB */}
              {activeTab === 'transactions' && (
                <GlassCard className="p-5 space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        LitVM On-Chain History
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Verified transactions on LitVM Liteforge Testnet
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder="Filter transactions..."
                          className="w-36 bg-transparent text-xs text-white placeholder:text-muted-foreground focus:outline-none sm:w-48"
                        />
                      </div>
                    </div>
                  </div>

                  {paginatedTxs.length === 0 ? (
                    <EmptyState
                      icon={Activity}
                      title={searchTerm ? 'No matching transactions' : 'No transactions found'}
                      description={
                        searchTerm
                          ? 'Try adjusting your search criteria.'
                          : 'No on-chain transactions were found on LitVM Testnet for this address.'
                      }
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-muted-foreground">
                            <th className="py-2.5 px-3 font-medium">Date</th>
                            <th className="py-2.5 px-3 font-medium">Type</th>
                            <th className="py-2.5 px-3 font-medium">Tx Hash</th>
                            <th className="py-2.5 px-3 font-medium">Status</th>
                            <th className="py-2.5 px-3 font-medium">Value</th>
                            <th className="py-2.5 px-3 font-medium text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {paginatedTxs.map((tx) => (
                            <tr
                              key={tx.hash}
                              onClick={() => setSelectedTx(tx)}
                              className="cursor-pointer hover:bg-white/5 transition-colors"
                            >
                              <td className="py-3 px-3 text-white/80 whitespace-nowrap">
                                {new Date(tx.timestamp).toLocaleDateString()}
                              </td>
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

                  {/* Pagination Footer */}
                  {filteredTxs.length > itemsPerPage && (
                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                      <span className="text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredTxs.length)} of {filteredTxs.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white disabled:opacity-30"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-white font-medium">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white disabled:opacity-30"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </GlassCard>
              )}
            </div>
          )}
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
