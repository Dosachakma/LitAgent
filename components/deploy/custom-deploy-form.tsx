'use client';

import { useState } from 'react';
import { Code, Loader2, Sparkles, Wallet, ShieldCheck, Check, FileCode } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { LITVM_TESTNET, truncateAddress } from '@/lib/wallet-service';
import { deployContract } from '@/lib/deploy/contract-deployer';
import { CONTRACT_TEMPLATES, getTemplateById } from '@/lib/deploy/contract-templates';
import type { CustomContractDeployParams, DeploymentRecord, DeploymentStatus } from '@/lib/deploy/deployment-types';
import { DeployStepper } from './deploy-stepper';
import { DeploymentSuccessModal } from './deployment-success-modal';

export function CustomDeployForm({ onDeploySuccess }: { onDeploySuccess?: (record: DeploymentRecord) => void }) {
  const { address, activeProvider, setModalOpen } = useWalletStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<'simple-storage' | 'ownable' | 'erc20' | 'erc721'>('simple-storage');
  const [contractName, setContractName] = useState('LitAgent Storage');
  const [paramValues, setParamValues] = useState<Record<string, string | number>>({
    initialValue: 42,
  });

  const [status, setStatus] = useState<DeploymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successRecord, setSuccessRecord] = useState<DeploymentRecord | null>(null);

  const selectedTemplate = getTemplateById(selectedTemplateId) || CONTRACT_TEMPLATES[0];

  const handleTemplateChange = (id: 'simple-storage' | 'ownable' | 'erc20' | 'erc721') => {
    setSelectedTemplateId(id);
    const tmpl = getTemplateById(id);
    if (tmpl) {
      setContractName(tmpl.name);
      setParamValues(tmpl.defaultParams || {});
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

      const constructorArgs = selectedTemplate.paramFields.map((field) => {
        const val = paramValues[field.key];
        if (field.type === 'number') return Number(val ?? 0);
        if (field.type === 'address') return String(val || address);
        return String(val ?? '');
      });

      const customParams: CustomContractDeployParams = {
        templateId: selectedTemplateId,
        contractName,
        constructorArgs,
      };

      const record = await deployContract(
        activeProvider,
        address,
        {
          type: 'custom',
          params: customParams,
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
      {/* Left Column: Template Selection & Inputs */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleDeploy} className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 glass">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white shadow-md">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Custom Smart Contract Templates</h3>
              <p className="text-xs text-muted-foreground">
                Select pre-compiled Solidity contract templates and configure constructor parameters
              </p>
            </div>
          </div>

          {/* Template Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white">Select Contract Template</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONTRACT_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tmpl.id as 'simple-storage' | 'ownable' | 'erc20' | 'erc721')}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                        : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'}`}>
                      {isSelected ? <Check className="h-4 w-4" /> : <FileCode className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{tmpl.name}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{tmpl.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contract Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white">Contract Name <span className="text-primary">*</span></label>
            <input
              type="text"
              required
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="e.g. MySmartContract"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Constructor Parameter Fields */}
          {selectedTemplate.paramFields.length > 0 && (
            <div className="space-y-3 rounded-xl border border-white/8 bg-black/30 p-4">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Constructor Arguments</h4>
              {selectedTemplate.paramFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {field.label} {field.required && <span className="text-primary">*</span>}
                  </label>
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    required={field.required}
                    value={paramValues[field.key] ?? ''}
                    onChange={(e) =>
                      setParamValues({
                        ...paramValues,
                        [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                      })
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none font-mono"
                  />
                  {field.helpText && (
                    <p className="text-[10px] text-muted-foreground/70">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Compiler Information */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Solidity Compiler:</span>
              <span className="font-mono text-white">v0.8.20+commit.a1b79de6</span>
            </div>
            <div className="flex justify-between">
              <span>EVTarget Architecture:</span>
              <span className="font-mono text-white">LitVM / EVM Shanghai</span>
            </div>
            <div className="flex justify-between">
              <span>Optimization:</span>
              <span className="font-mono text-emerald-400">Enabled (200 runs)</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex justify-end">
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
                    Deploy Custom Contract
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Column: Summary Card & Stepper */}
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
              <span className="text-muted-foreground">Selected Template</span>
              <span className="font-semibold text-white">{selectedTemplate.name}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-muted-foreground">Category</span>
              <span className="font-mono font-bold text-emerald-400">{selectedTemplate.category}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Bytecode Size</span>
              <span className="font-mono text-muted-foreground">
                {Math.round(selectedTemplate.bytecode.length / 2)} bytes
              </span>
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
