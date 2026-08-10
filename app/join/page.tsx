'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  useEffect(() => {
    if (refCode) {
      try {
        localStorage.setItem('litagent_referral_code', refCode);
      } catch {
        // Handle storage quota / iframe restrictions gracefully
      }
    }

    // Short redirect delay for smooth UX
    const timer = setTimeout(() => {
      router.push('/missions');
    }, 1500);

    return () => clearTimeout(timer);
  }, [refCode, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <GlassCard className="max-w-md w-full p-8 text-center space-y-4 border-primary/30 gradient-card glow-primary">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl gradient-primary text-white shadow-xl">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold text-white">Welcome to LitAgent Ecosystem</h1>
        <p className="text-xs text-muted-foreground">
          {refCode ? (
            <>
              Referral code <span className="font-bold text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{refCode}</span> applied! Redirecting to Missions Hub...
            </>
          ) : (
            'Redirecting to Missions Hub...'
          )}
        </p>
        <div className="flex justify-center pt-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-bounce" />
        </div>
      </GlassCard>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <JoinContent />
    </Suspense>
  );
}
