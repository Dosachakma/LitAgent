'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl glass px-6 py-16 text-center',
        className
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-white shadow-xl glow-primary">
          <Icon className="h-8 w-8" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-lg gradient-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-[0.98]"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
