'use client';

import { useState } from 'react';
import { Coins, Loader2, Sparkles, Wallet, AlertCircle, ShieldCheck } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { LITVM_TESTNET, truncateAddress } from '@/lib/wallet-service';
import { deployContract } from '@/lib/deploy/contract-deployer';
import { estimateDeploymentGas } from '@/lib/deploy/gas-estimator';
import { encodeERC20DeployData } from '@/lib/deploy/contract-templates';
import type { DeploymentRecord, DeploymentStatus, ERC20DeployParams } from '@/lib/deploy/deployment-types';
import { DeployStepper } from './deploy-stepper';
import { DeploymentSuccessModal } from './deployment-success-modal';

export function ERC20DeployForm({ onDeploySuccess }: { onDeploySuccess?: (record: DeploymentRecord) => void }) {
  const { address, activeProvider, setModalOpen } = useWalletStore();

  const [form, setForm] = useState<ERC20DeployParams>({
    name: 'LitAgent Token',
    symbol: 'LIT',
    decimals: 18,
    initialSupply: '1000000',
    description: 'Utility token created via LitAgent 1-Click Deploy on LitVM Testnet.',
  });

  const [status, setStatus] = useState<DeploymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [estimatingGas, setEstimatingGas] = useState(false);
  const [gasCost, setGasCost] = useState<string | null>(null);
  const [successRecord, setSuccessRecord] = useState<DeploymentRecord | null>(null);

  const handleEstimateGas = async () => {
    if (!activeProvider || !address) return;
    try {
      setEstimatingGas(true);
      const data = encodeERC20DeployData(form, address as `0x${string}`);
      const est = await estimateDeploymentGas(activeProvider, address, data);
      setGasCost(`${est.estimatedCostEth} zkLTC (${est.estimatedGas} gas)`);
    } catch (err) {
      console.warn('Gas estimate failed:', err);
      setGasCost('~0.00125 zkLTC');
    } finally {
      setEstimatingGas(false);
    }
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!address || !activeProvider) {
      setModalOpen(true);
      return;
    }

    try {
      setStatus('validating');
      const record = await deployContract(
        activeProvider,
        address,
        {
          type: 'erc20',
          params: form,
        },
        (step, details) => {
          setStatus(step);
          if (details?.error) {
            setErrorMessage(details.error);
          }
        }
      );

      setSuccessRecord(record);
      if (onDeploySuccess) onDeploySuccess(record);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj?.message || 'Deployment failed.');
      setStatus('failed');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Form Controls */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleDeploy} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 glass">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white shadow-md">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ERC-20 Token Configuration</h3>
              <p className="text-xs text-muted-foreground">
                Deploy a standard OpenZeppelin-compatible fungible token on LitVM
              </p>
            </div>
          </div>

          {/* Token Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white">Token Name <span className="text-primary">*</span></label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. LitAgent Token"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Token Symbol & Decimals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white">Token Symbol <span className="text-primary">*</span></label>
              <input
                type="text"
                required
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g. LIT"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white">Decimals <span className="text-primary">*</span></label>
              <input
                type="number"
                min="0"
                max="18"
                required
                value={form.decimals}
                onChange={(e) => setForm({ ...form, decimals: parseInt(e.target.value) || 18 })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>

          {/* Initial Supply */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white">Initial Supply <span className="text-primary">*</span></label>
            <input
              type="text"
              required
              value={form.initialSupply}
              onChange={(e) => setForm({ ...form, initialSupply: e.target.value })}
              placeholder="1000000"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Total supply of tokens minted to your connected wallet upon deployment.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white">Description (Optional)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Token description, project notes, or utility details..."
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleEstimateGas}
              disabled={estimatingGas || !address}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
            >
              {estimatingGas ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {gasCost ? `Est. Gas: ${gasCost}` : 'Estimate Gas Fee'}
            </button>

            {!address ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl gradient-primary px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.98]"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet to Deploy
              </button>
            ) : (
              <button
                type="submit"
                disabled={status !== 'idle' && status !== 'failed'}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl gradient-primary px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 disabled:opacity-50 active:scale-[0.98]"
              >
                {status !== 'idle' && status !== 'failed' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Deploy ERC-20 Token
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Column: Live Summary & Stepper */}
      <div className="lg:col-span-5 space-y-6">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 glass">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Deployment Summary
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-muted-foreground">Network</span>
              <span className="font-semibold text-white">{LITVM_TESTNET.chainName}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-muted-foreground">Chain ID</span>
              <span className="font-mono text-white">{LITVM_TESTNET.chainId}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-muted-foreground">Deployer Wallet</span>
              <span className="font-mono text-primary">
                {address ? truncateAddress(address, 6) : 'Not Connected'}
              </span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-muted-foreground">Contract Type</span>
              <span className="font-semibold text-white">ERC-20 Fungible Token</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-muted-foreground">Token Symbol</span>
              <span className="font-mono font-bold text-emerald-400">{form.symbol || '---'}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-muted-foreground">Initial Supply</span>
              <span className="font-mono text-white">{form.initialSupply} {form.symbol}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Gas</span>
              <span className="font-mono text-muted-foreground">{gasCost || 'Calculated at checkout'}</span>
            </div>
          </div>
        </div>

        {/* Stepper Status widget */}
        {status !== 'idle' && (
          <DeployStepper status={status} errorMessage={errorMessage} />
        )}
      </div>

      {/* Success Modal */}
      <DeploymentSuccessModal
        record={successRecord}
        onClose={() => setSuccessRecord(null)}
        onDeployAnother={() => {
          setStatus('idle');
          setErrorMessage(null);
          setSuccessRecord(null);
        }}
      />
    </div>
  );
}
