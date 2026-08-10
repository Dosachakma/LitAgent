'use client';

import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { DeploymentStatus } from '@/lib/deploy/deployment-types';
import { cn } from '@/lib/utils';

interface DeployStepperProps {
  status: DeploymentStatus;
  errorMessage?: string | null;
}

const STEPS: { key: DeploymentStatus[]; label: string; description: string }[] = [
  {
    key: ['configuring', 'validating'],
    label: '1. Configure & Validate',
    description: 'Verify parameters and parameters format',
  },
  {
    key: ['estimating_gas'],
    label: '2. Estimate Gas',
    description: 'Querying LitVM gas units and fee estimation',
  },
  {
    key: ['awaiting_signature'],
    label: '3. Awaiting Signature',
    description: 'Approve transaction signature in your EVM wallet',
  },
  {
    key: ['confirming'],
    label: '4. Blockchain Confirmation',
    description: 'Broadcasting & waiting for block inclusion',
  },
  {
    key: ['deployed'],
    label: '5. Contract Deployed',
    description: 'Address generated and saved to history',
  },
];

export function DeployStepper({ status, errorMessage }: DeployStepperProps) {
  const getStepState = (stepKeys: DeploymentStatus[]) => {
    if (status === 'failed') return 'failed';
    if (status === 'idle') return 'pending';

    const statusOrder: DeploymentStatus[] = [
      'configuring',
      'validating',
      'estimating_gas',
      'awaiting_signature',
      'confirming',
      'deployed',
    ];

    const currentIdx = statusOrder.indexOf(status);
    const stepIdx = Math.max(...stepKeys.map((k) => statusOrder.indexOf(k)));

    if (currentIdx > stepIdx) return 'completed';
    if (stepKeys.includes(status)) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h4 className="text-sm font-semibold text-white">Deployment Pipeline</h4>
        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
          LitVM Liteforge (4441)
        </span>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Deployment Failed</p>
            <p className="mt-0.5 text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {STEPS.map((step) => {
          const state = getStepState(step.key);

          return (
            <div key={step.label} className="flex items-start gap-3">
              {/* Step indicator icon */}
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                  state === 'completed' && 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]',
                  state === 'active' && 'bg-primary text-white ring-4 ring-primary/20 animate-pulse',
                  state === 'pending' && 'bg-white/10 text-muted-foreground',
                  state === 'failed' && 'bg-destructive text-white'
                )}
              >
                {state === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : state === 'active' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>•</span>
                )}
              </div>

              {/* Step text details */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    'text-xs font-semibold transition-colors',
                    state === 'completed' && 'text-emerald-400',
                    state === 'active' && 'text-white',
                    state === 'pending' && 'text-muted-foreground',
                    state === 'failed' && 'text-destructive'
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground/80">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
