'use client';

import { useState } from 'react';
import { Rocket, Coins, Layers, Code, ShieldCheck, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { useWalletStore } from '@/store/wallet-store';
import { LITVM_TESTNET, switchOrAddNetwork } from '@/lib/wallet-service';
import { ERC20DeployForm } from '@/components/deploy/erc20-deploy-form';
import { ERC721DeployForm } from '@/components/deploy/erc721-deploy-form';
import { CustomDeployForm } from '@/components/deploy/custom-deploy-form';
import { DeploymentHistoryTable } from '@/components/deploy/deployment-history-table';

export function DeployPage() {
  const { address, activeProvider, chainId, setModalOpen } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'erc20' | 'erc721' | 'custom'>('erc20');
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  const isWrongChain = chainId && chainId !== LITVM_TESTNET.chainId && chainId !== LITVM_TESTNET.chainIdHex;

  const handleSwitchNetwork = async () => {
    if (!activeProvider) return;
    try {
      setSwitchingNetwork(true);
      await switchOrAddNetwork(activeProvider);
    } catch (err) {
      console.error('Failed to switch network:', err);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <SectionTitle
        title="1-Click Deploy"
        subtitle="Deploy tokens, NFTs, and smart contracts on LitVM without writing deployment scripts."
        icon={<Rocket className="h-5 w-5 text-primary" />}
      />

      {/* Network / Connection Warning Banner */}
      {!address ? (
        <GlassCard className="p-4 border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Wallet Connection Required</h4>
              <p className="text-xs text-muted-foreground">
                Connect your EVM browser wallet (MetaMask, Rabby, Zerion, Phantom, etc.) to deploy smart contracts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110"
          >
            Connect Wallet
          </button>
        </GlassCard>
      ) : isWrongChain ? (
        <GlassCard className="p-4 border-destructive/30 bg-destructive/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Wrong Network Detected</h4>
              <p className="text-xs text-muted-foreground">
                Please switch your connected wallet to LitVM Liteforge Testnet ({LITVM_TESTNET.chainId}) to deploy contracts.
              </p>
            </div>
          </div>
          <button
            onClick={handleSwitchNetwork}
            disabled={switchingNetwork}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/20 px-4 py-2 text-xs font-bold text-white hover:bg-destructive/30 disabled:opacity-50"
          >
            {switchingNetwork ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Switch to LitVM LiteForge
          </button>
        </GlassCard>
      ) : null}

      {/* Contract Type Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ERC-20 Card Tab */}
        <button
          onClick={() => setActiveTab('erc20')}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            activeTab === 'erc20'
              ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${activeTab === 'erc20' ? 'gradient-primary text-white' : 'bg-white/10 text-muted-foreground'}`}>
              <Coins className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">
              Fungible
            </span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
            1. ERC-20 Token
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create fungible token with custom supply, symbol, and decimals.
          </p>
        </button>

        {/* ERC-721 Card Tab */}
        <button
          onClick={() => setActiveTab('erc721')}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            activeTab === 'erc721'
              ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${activeTab === 'erc721' ? 'gradient-primary text-white' : 'bg-white/10 text-muted-foreground'}`}>
              <Layers className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
              NFT Collection
            </span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
            2. ERC-721 NFT
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Deploy digital collectible NFT collections with IPFS metadata URI.
          </p>
        </button>

        {/* Custom Contract Tab */}
        <button
          onClick={() => setActiveTab('custom')}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            activeTab === 'custom'
              ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${activeTab === 'custom' ? 'gradient-primary text-white' : 'bg-white/10 text-muted-foreground'}`}>
              <Code className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-400">
              Template
            </span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
            3. Custom Contract
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Deploy Simple Storage, Ownable, or custom Solidity templates.
          </p>
        </button>
      </div>

      {/* Selected Deployment Form */}
      <div>
        {activeTab === 'erc20' && <ERC20DeployForm />}
        {activeTab === 'erc721' && <ERC721DeployForm />}
        {activeTab === 'custom' && <CustomDeployForm />}
      </div>

      {/* Deployment History Table */}
      <DeploymentHistoryTable />

      {/* Safety Notice */}
      <GlassCard className="p-4 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <h4 className="font-semibold text-white">Non-Custodial Smart Contract Deployment</h4>
            <p className="text-muted-foreground">
              All transactions are constructed client-side and explicitly authorized through your connected EVM wallet. Private keys and seed phrases are never accessed or stored.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
