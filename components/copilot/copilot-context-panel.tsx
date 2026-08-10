'use client';

import {
  Globe,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Boxes,
  FileText,
  ShieldCheck,
  Twitter,
  MessageCircle,
} from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { LITVM_NETWORK_INFO } from '@/lib/ai/knowledge-base';
import { truncateAddress } from '@/lib/format';
import { BadgePill } from '@/components/shared/badge-pill';

export function CopilotContextPanel() {
  const { address, chainId } = useWalletStore();
  const isConnected = !!address;

  const isLitVMNetwork = chainId === '4441' || chainId === '0x1159';

  return (
    <div className="flex h-full w-full flex-col space-y-4 border-l border-white/8 bg-zinc-950/80 backdrop-blur-md p-4 overflow-y-auto scrollbar-thin">
      <div className="flex items-center gap-2 border-b border-white/8 pb-3">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Context & Safety
        </h3>
      </div>

      {/* Network Status Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground">
            Current Network
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Operational
          </span>
        </div>

        <p className="text-xs font-semibold text-white">
          {LITVM_NETWORK_INFO.name}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div>
            <p className="text-[10px] text-muted-foreground">Chain ID</p>
            <p className="font-mono text-zinc-200">{LITVM_NETWORK_INFO.chainId}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Gas Currency</p>
            <p className="font-semibold text-primary">{LITVM_NETWORK_INFO.currency}</p>
          </div>
        </div>
      </div>

      {/* Wallet Status Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Wallet Status
          </span>
          {isConnected ? (
            isLitVMNetwork ? (
              <BadgePill label="LitVM Connected" variant="success" />
            ) : (
              <BadgePill label="Wrong Network" variant="warning" />
            )
          ) : (
            <BadgePill label="Not Connected" variant="default" />
          )}
        </div>

        {isConnected ? (
          <div className="space-y-1.5 pt-1">
            <p className="font-mono text-xs text-white">
              {address ? truncateAddress(address, 6) : 'Connected'}
            </p>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-muted-foreground">Network:</span>
              <span className="font-semibold text-white">
                Chain ID 4441
              </span>
            </div>

            {!isLitVMNetwork && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-[10px] text-amber-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Switch wallet network to Chain ID 4441 for LitVM transactions.
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Connect your Web3 wallet to allow AI Copilot to analyze your LitVM holdings.
          </p>
        )}
      </div>

      {/* Relevant Ecosystem Tools */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Boxes className="h-3 w-3" /> LitVM Hub & Tools
        </p>

        <div className="space-y-1.5">
          <a
            href={LITVM_NETWORK_INFO.faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-2.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>Testnet Faucet (Caldera)</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>

          <a
            href={LITVM_NETWORK_INFO.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-2.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>Block Explorer</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>

          <a
            href={LITVM_NETWORK_INFO.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-2.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>Official LitVM Portal</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Trusted Official Links */}
      <div className="space-y-2 pt-2 border-t border-white/8">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3" /> Official Socials & Blog
        </p>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={LITVM_NETWORK_INFO.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-white/5 p-2 text-xs text-zinc-300 hover:text-sky-400 hover:bg-white/10"
          >
            <Twitter className="h-3.5 w-3.5" />
            <span>Official X</span>
          </a>

          <a
            href={LITVM_NETWORK_INFO.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-white/5 p-2 text-xs text-zinc-300 hover:text-sky-400 hover:bg-white/10"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Telegram</span>
          </a>

          <a
            href={LITVM_NETWORK_INFO.blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-white/5 p-2 text-xs text-zinc-300 hover:text-purple-400 hover:bg-white/10 col-span-2"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>LitVM Official Blog</span>
          </a>
        </div>
      </div>
    </div>
  );
}
