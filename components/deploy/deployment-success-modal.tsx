'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, ExternalLink, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { getExplorerUrl, LITVM_TESTNET } from '@/lib/wallet-service';
import type { DeploymentRecord } from '@/lib/deploy/deployment-types';

interface DeploymentSuccessModalProps {
  record: DeploymentRecord | null;
  onClose: () => void;
  onDeployAnother: () => void;
}

export function DeploymentSuccessModal({
  record,
  onClose,
  onDeployAnother,
}: DeploymentSuccessModalProps) {
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!record) return null;

  const handleCopyAddr = () => {
    if (record.contract_address) {
      navigator.clipboard.writeText(record.contract_address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const handleCopyHash = () => {
    if (record.transaction_hash) {
      navigator.clipboard.writeText(record.transaction_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 my-auto w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-[#0d0e15] p-6 shadow-2xl glass-strong space-y-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header Badge & Title */}
          <div className="text-center space-y-3 pt-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40 shadow-lg glow-emerald">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Contract Deployed Successfully!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Your smart contract is live on the {LITVM_TESTNET.chainName} ({LITVM_TESTNET.chainId})
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs">
            {/* Contract Name & Type */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-muted-foreground">Contract Name</span>
              <span className="font-semibold text-white">{record.contract_name}</span>
            </div>

            {/* Contract Type */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-muted-foreground">Contract Standard</span>
              <span className="uppercase font-mono font-bold text-primary">{record.contract_type}</span>
            </div>

            {/* Contract Address */}
            <div className="space-y-1 pt-1">
              <span className="text-muted-foreground font-medium">Contract Address</span>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/40 p-2.5">
                <span className="font-mono text-xs text-emerald-400 break-all">
                  {record.contract_address || 'Deployment Pending'}
                </span>
                <button
                  onClick={handleCopyAddr}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                  title="Copy Contract Address"
                >
                  {copiedAddr ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Transaction Hash */}
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium">Transaction Hash</span>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/40 p-2.5">
                <span className="font-mono text-xs text-muted-foreground break-all">
                  {record.transaction_hash}
                </span>
                <button
                  onClick={handleCopyHash}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                  title="Copy Transaction Hash"
                >
                  {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href={getExplorerUrl(record.contract_address || record.transaction_hash, record.contract_address ? 'address' : 'tx')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              View on Explorer <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              onClick={() => {
                onClose();
                onDeployAnother();
              }}
              className="flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-transform active:scale-[0.98]"
            >
              Deploy Another <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Network badge footer */}
          <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground/70">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Verified on LitVM Liteforge Caldera Explorer</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
