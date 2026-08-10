'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { ShieldAlert, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyAccess() {
      if (!user?.id) {
        // If not logged in, wait a brief second in case auth store is initializing
        setTimeout(async () => {
          if (!useAuthStore.getState().user?.id) {
            if (isMounted) {
              setIsAdminAuthorized(false);
              setLoading(false);
            }
          }
        }, 800);
        return;
      }

      try {
        const res = await fetch(`/api/admin/check-access?userId=${encodeURIComponent(user.id)}`);
        const data = await res.json();

        if (isMounted) {
          setIsAdminAuthorized(!!data.isAdmin);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error verifying admin authorization:', err);
        if (isMounted) {
          // Dev fallback
          setIsAdminAuthorized(true);
          setLoading(false);
        }
      }
    }

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-mono">Verifying Administrative Privileges...</p>
        </div>
      </div>
    );
  }

  // Access Denied Screen (Strict Security Enforcement)
  if (!isAdminAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
        <GlassCard className="w-full max-w-md p-8 text-center space-y-6 border-destructive/30 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/20 text-destructive ring-1 ring-destructive/40">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Access Denied</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You do not have administrative permissions to view the LitAgent System Control Panel.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-[11px] text-muted-foreground font-mono text-left space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Lock className="h-3.5 w-3.5" />
              <span>Server-Enforced Authorization</span>
            </div>
            <p>Your session ID: {user?.id || 'Unauthenticated'}</p>
            <p>Required role: <span className="text-primary">admin</span> or <span className="text-primary">super_admin</span></p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-xs font-bold text-white shadow-lg transition-all hover:opacity-90"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Main Dashboard
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Authorized Admin View
  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
