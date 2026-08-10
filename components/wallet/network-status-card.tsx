'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Cpu, ExternalLink, ShieldAlert } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { useWalletStore } from '@/store/wallet-store';
import {
  LITVM_TESTNET,
  switchOrAddNetwork,
  detectProviders,
} from '@/lib/wallet-service';
import { useToast } from '@/hooks/use-toast';

export function NetworkStatusCard() {
  const { chainId, provider, activeProvider, setChainId, address } = useWalletStore();
  const { toast } = useToast();
  const [switching, setSwitching] = useState(false);

  const isLitVM = !address || chainId === LITVM_TESTNET.chainId || chainId === LITVM_TESTNET.chainIdHex;

  const handleSwitchNetwork = async () => {
    setSwitching(true);
    try {
      let targetProvider = activeProvider;

      if (!targetProvider) {
        const providers = detectProviders();
        if (provider === 'rabby' && providers.rabby) targetProvider = providers.rabby;
        else if (provider === 'metamask' && providers.metamask) targetProvider = providers.metamask;
        else if (providers.injected) targetProvider = providers.injected;
      }

      if (!targetProvider) {
        toast({
          title: 'No Web3 Wallet Found',
          description: 'Please install MetaMask, Rabby, or an EVM wallet to switch network.',
          variant: 'destructive',
        });
        return;
      }

      await switchOrAddNetwork(targetProvider);
      setChainId(LITVM_TESTNET.chainId);
      toast({
        title: 'Network Switched',
        description: `Successfully connected to ${LITVM_TESTNET.chainName}.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to switch network';
      toast({
        title: 'Switch Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <GlassCard className="p-5 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">LitVM Network</h3>
              <p className="text-xs text-muted-foreground">{LITVM_TESTNET.chainName}</p>
            </div>
          </div>
          <BadgePill
            label={isLitVM ? 'LitVM Connected' : 'Wrong Network'}
            variant={isLitVM ? 'success' : 'warning'}
            icon={isLitVM ? CheckCircle2 : AlertTriangle}
          />
        </div>

        {/* Wrong network alert if user is on wrong network */}
        {!isLitVM && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">Wrong Network Detected</p>
              <p className="mt-0.5 text-[11px] text-amber-300/80">
                Your wallet is currently connected to chain ID {chainId}. Please switch to LitVM Testnet (4441) to manage assets.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-muted-foreground">Chain ID</span>
            <span className="font-mono text-white">{LITVM_TESTNET.chainId} ({LITVM_TESTNET.chainIdHex})</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-muted-foreground">Native Symbol</span>
            <span className="font-semibold text-primary">{LITVM_TESTNET.nativeCurrency.symbol}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-muted-foreground">RPC Endpoint</span>
            <span className="font-mono text-white/80 truncate max-w-[180px]">
              liteforge.rpc.caldera.xyz
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-muted-foreground">Explorer</span>
            <a
              href={LITVM_TESTNET.blockExplorerUrls[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1"
            >
              liteforge.explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Testnet Disclaimer */}
      <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/5 p-2.5 text-[11px] text-muted-foreground">
        <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
        <span>
          <strong>LitVM Testnet:</strong> Testnet assets have no guaranteed real-world value.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSwitchNetwork}
          disabled={switching}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg gradient-primary px-3 py-2 text-xs font-medium text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${switching ? 'animate-spin' : ''}`} />
          {switching
            ? 'Switching...'
            : !isLitVM
            ? 'Switch to LitVM Testnet'
            : 'Verify LitVM Network'}
        </button>

        <a
          href={LITVM_TESTNET.blockExplorerUrls[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:text-white hover:bg-white/10"
          title="Open Caldera Explorer"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </GlassCard>
  );
}
