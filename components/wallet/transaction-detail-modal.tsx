'use client';

import { useState } from 'react';
import { X, ExternalLink, Copy, Check, ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { truncateAddress } from '@/lib/format';
import type { WalletTransactionDetail } from '@/lib/litvm-rpc-service';

interface TransactionDetailModalProps {
  transaction: WalletTransactionDetail | null;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!transaction) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(transaction.hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <GlassCard className="relative w-full max-w-lg p-6 space-y-5 border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Transaction Details</h3>
              <p className="text-xs text-muted-foreground">{transaction.network}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status & Value Banner */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Transaction Value
            </span>
            <p className="text-2xl font-bold text-white mt-0.5">{transaction.value}</p>
          </div>
          <BadgePill
            label={transaction.status}
            variant={
              transaction.status === 'completed'
                ? 'success'
                : transaction.status === 'pending'
                ? 'warning'
                : 'error'
            }
          />
        </div>

        {/* Transaction Fields */}
        <div className="space-y-3 text-xs">
          {/* Hash */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground font-medium">Tx Hash</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white/90">{truncateAddress(transaction.hash, 8)}</span>
              <button
                onClick={handleCopyHash}
                className="text-muted-foreground hover:text-white"
                title="Copy Hash"
              >
                {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Block */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground font-medium">Block Number</span>
            <span className="font-mono text-white">{transaction.blockNumber}</span>
          </div>

          {/* From */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground font-medium">From</span>
            <span className="font-mono text-white/90">{truncateAddress(transaction.from, 8)}</span>
          </div>

          {/* To */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground font-medium">To</span>
            <span className="font-mono text-white/90">
              {transaction.to ? truncateAddress(transaction.to, 8) : 'Contract Creation'}
            </span>
          </div>

          {/* Gas Used */}
          {transaction.gasUsed && (
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground font-medium">Gas Used</span>
              <span className="font-mono text-white">{transaction.gasUsed}</span>
            </div>
          )}

          {/* Gas Price */}
          {transaction.gasPrice && (
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground font-medium">Gas Price</span>
              <span className="font-mono text-white">{transaction.gasPrice}</span>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground font-medium">Timestamp</span>
            <span className="text-white/80" suppressHydrationWarning>
              {new Date(transaction.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10"
          >
            Close
          </button>
          <a
            href={transaction.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-white shadow-md hover:scale-[1.02]"
          >
            View on Explorer <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </GlassCard>
    </div>
  );
}
