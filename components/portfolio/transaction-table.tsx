'use client';

import { useState } from 'react';
import { Search, ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { EmptyState } from '@/components/shared/empty-state';
import { truncateAddress } from '@/lib/format';
import { LITVM_TESTNET, getExplorerUrl } from '@/lib/wallet-service';

export interface TransactionRecord {
  id: string;
  hash: string;
  type: 'transfer' | 'contract_execution' | 'mission_reward' | 'stake' | 'swap';
  status: 'completed' | 'pending' | 'failed';
  amount?: string;
  symbol?: string;
  from?: string;
  to?: string;
  timestamp: string;
  network: string;
}

interface TransactionTableProps {
  transactions?: TransactionRecord[];
  loading?: boolean;
}

export function TransactionTable({ transactions = [], loading = false }: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filtered = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    return (
      tx.hash.toLowerCase().includes(term) ||
      tx.type.toLowerCase().includes(term) ||
      tx.status.toLowerCase().includes(term) ||
      (tx.symbol && tx.symbol.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: TransactionRecord['status']) => {
    switch (status) {
      case 'completed':
        return <BadgePill label="Completed" variant="success" />;
      case 'pending':
        return <BadgePill label="Pending" variant="warning" />;
      case 'failed':
        return <BadgePill label="Failed" variant="error" />;
      default:
        return <BadgePill label={status} variant="default" />;
    }
  };

  const getTypeIcon = (type: TransactionRecord['type']) => {
    switch (type) {
      case 'transfer':
        return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />;
      case 'swap':
        return <RefreshCw className="h-4 w-4 text-purple-400" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <GlassCard className="p-5">
      {/* Header & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Transaction History
          </h3>
          <p className="text-xs text-muted-foreground">
            On-chain transactions recorded on the LitVM Ecosystem
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
              placeholder="Search by hash, type, status..."
              className="w-36 bg-transparent text-xs text-white placeholder:text-muted-foreground focus:outline-none sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">Loading transactions...</div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={searchTerm ? 'No matching transactions' : 'No transactions recorded'}
          description={
            searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Your transaction history on LitVM Liteforge Testnet will appear here once you make on-chain interactions.'
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="py-3 px-3 font-medium">Date</th>
                <th className="py-3 px-3 font-medium">Type</th>
                <th className="py-3 px-3 font-medium">Hash</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 px-3 font-medium">Network</th>
                <th className="py-3 px-3 font-medium text-right">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map((tx) => (
                <tr key={tx.id} className="transition-colors hover:bg-white/5">
                  <td className="py-3 px-3 text-white/80 whitespace-nowrap" suppressHydrationWarning>
                    {new Date(tx.timestamp).toLocaleDateString()}{' '}
                    <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3 px-3 capitalize text-white font-medium">
                    <div className="flex items-center gap-1.5">
                      {getTypeIcon(tx.type)}
                      <span>{tx.type.replace('_', ' ')}</span>
                      {tx.amount && tx.symbol && (
                        <span className="text-muted-foreground text-[11px] font-normal">
                          ({tx.amount} {tx.symbol})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-primary hover:underline">
                    <a
                      href={getExplorerUrl(tx.hash, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {truncateAddress(tx.hash, 6)}
                    </a>
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(tx.status)}</td>
                  <td className="py-3 px-3 text-muted-foreground">{tx.network || LITVM_TESTNET.chainName}</td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={getExplorerUrl(tx.hash, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {filtered.length > itemsPerPage && (
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
          <span className="text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
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
  );
}
