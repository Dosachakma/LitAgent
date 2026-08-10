'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface BadgePillProps {
  icon?: LucideIcon;
  label: string;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'primary';
  className?: string;
}

const variantStyles = {
  default: 'bg-white/5 text-muted-foreground border-white/10',
  secondary: 'bg-white/10 text-zinc-300 border-white/15',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
};

export function BadgePill({
  icon: Icon,
  label,
  variant = 'default',
  className,
}: BadgePillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
