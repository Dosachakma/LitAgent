'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { getDeploymentHistory } from '@/lib/deploy/deployment-service';
import type { DeploymentRecord } from '@/lib/deploy/deployment-types';
import { truncateAddress, getExplorerUrl } from '@/lib/wallet-service';
import { BadgePill } from '@/components/shared/badge-pill';
import { useWalletStore } from '@/store/wallet-store';

export function DeploymentHistoryTable() {
  const { address } = useWalletStore();
  const [history, setHistory] = useState<DeploymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const records = await getDeploymentHistory(address);
      setHistory(records);
    } catch (e) {
      console.warn('Error fetching deployments history:', e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHistory = history.filter((item) => {
    const matchesFilter = filterType === 'all' || item.contract_type === filterType;
    const matchesSearch =
      !searchQuery ||
      item.contract_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contract_symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contract_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.transaction_hash.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 glass">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Deployment History
          </h3>
          <p className="text-xs text-muted-foreground">
            Contracts deployed via LitAgent on LitVM Liteforge Network
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Type tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/5 w-full sm:w-auto">
          {['all', 'erc20', 'erc721', 'custom'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all ${
                filterType === t
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              {t === 'all' ? 'All Contracts' : t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contract name, symbol, address..."
            className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
          Fetching deployed contract history...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <p className="text-xs text-muted-foreground">No deployment records found.</p>
          <p className="text-[11px] text-muted-foreground/70">
            Deploy your first ERC-20 token, ERC-721 NFT collection, or custom contract above!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="py-2.5 px-3 font-medium">Contract</th>
                <th className="py-2.5 px-3 font-medium">Type</th>
                <th className="py-2.5 px-3 font-medium">Deployed Address</th>
                <th className="py-2.5 px-3 font-medium">Tx Hash</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Date</th>
                <th className="py-2.5 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredHistory.map((rec) => (
                <tr key={rec.id} className="transition-colors hover:bg-white/5">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                        {rec.contract_type === 'erc20' ? (
                          <Sparkles className="h-4 w-4" />
                        ) : rec.contract_type === 'erc721' ? (
                          <Layers className="h-4 w-4" />
                        ) : (
                          <FileCode className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{rec.contract_name}</p>
                        {rec.contract_symbol && (
                          <p className="text-[10px] text-muted-foreground font-mono">{rec.contract_symbol}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 uppercase font-mono font-bold text-primary">
                    {rec.contract_type}
                  </td>

                  <td className="py-3 px-3 font-mono text-emerald-400">
                    {rec.contract_address ? (
                      <div className="flex items-center gap-1.5">
                        <span>{truncateAddress(rec.contract_address, 6)}</span>
                        <button
                          onClick={() => handleCopy(rec.contract_address!, `addr_${rec.id}`)}
                          className="text-muted-foreground hover:text-white"
                          title="Copy Address"
                        >
                          {copiedId === `addr_${rec.id}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Pending</span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>{truncateAddress(rec.transaction_hash, 6)}</span>
                      <button
                        onClick={() => handleCopy(rec.transaction_hash, `tx_${rec.id}`)}
                        className="text-muted-foreground hover:text-white"
                        title="Copy Tx Hash"
                      >
                        {copiedId === `tx_${rec.id}` ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <BadgePill
                      label={rec.status === 'deployed' ? 'Deployed' : rec.status}
                      variant={rec.status === 'deployed' ? 'success' : rec.status === 'failed' ? 'error' : 'warning'}
                    />
                  </td>

                  <td className="py-3 px-3 text-muted-foreground text-[11px]">
                    {new Date(rec.created_at).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <a
                      href={getExplorerUrl(rec.contract_address || rec.transaction_hash, rec.contract_address ? 'address' : 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      Explorer <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
