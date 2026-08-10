'use client';

import { ShieldCheck, Award, Users, AlertCircle } from 'lucide-react';
import { BadgePill } from '@/components/shared/badge-pill';
import type { Project, VerificationStatus } from '@/lib/types';

interface VerificationBadgeProps {
  project?: Project;
  status?: VerificationStatus;
}

export function VerificationBadge({ project, status }: VerificationBadgeProps) {
  // Determine verification level strictly from project data
  let effectiveStatus: VerificationStatus = status || 'Unverified';

  if (project) {
    if (project.is_official || project.verification_status === 'Official') {
      effectiveStatus = 'Official';
    } else if (project.is_verified || project.verification_status === 'Verified') {
      effectiveStatus = 'Verified';
    } else if (project.verification_status === 'Community') {
      effectiveStatus = 'Community';
    } else {
      effectiveStatus = 'Unverified';
    }
  }

  switch (effectiveStatus) {
    case 'Official':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300 shadow-sm">
          <Award className="h-3.5 w-3.5 text-purple-400" />
          Official LitVM
        </span>
      );

    case 'Verified':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 shadow-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Verified
        </span>
      );

    case 'Community':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300">
          <Users className="h-3.5 w-3.5 text-blue-400" />
          Community
        </span>
      );

    case 'Unverified':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
          Unverified
        </span>
      );
  }
}
