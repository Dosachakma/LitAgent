'use client';

import { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  requireReason = false,
  reasonPlaceholder = 'Please enter a clear reason for this administrative action...',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && (!reason || reason.trim().length < 3)) {
      setError('A valid reason is required for audit logs.');
      return;
    }
    setError('');
    onConfirm(reason);
  };

  const variantStyles = {
    danger: 'gradient-primary text-white bg-destructive hover:bg-destructive/90',
    warning: 'bg-amber-600 text-white hover:bg-amber-500',
    primary: 'gradient-primary text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <GlassCard className="relative w-full max-w-md p-6 space-y-4 border-white/10 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {requireReason && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white flex items-center justify-between">
              <span>Reason for Audit Trail</span>
              <span className="text-[10px] text-destructive font-normal">* Mandatory</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={reasonPlaceholder}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all disabled:opacity-50 ${variantStyles[confirmVariant]}`}
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
