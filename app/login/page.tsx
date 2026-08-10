'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { EmailAuthForm, GoogleSignInButton, LitAgentBrand } from '@/components/auth/email-auth-form';
import { WalletAuthButtons } from '@/components/auth/wallet-auth-buttons';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side — brand */}
      <div className="relative hidden w-1/2 overflow-hidden bg-grid lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-radial-glow" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <LitAgentBrand />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative z-10 max-w-md"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-black/40 border border-purple-500/20 shadow-lg">
              <Image
                src="/litagent-logo.png"
                alt="LitAgent Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              The AI Companion
            </span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            Navigate the <span className="gradient-text">LitVM Ecosystem</span> with AI
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Explore projects, track your portfolio, complete ecosystem missions, and
            get AI-powered insights — all from one beautiful dashboard.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Ask Me AI for ecosystem exploration',
              'Wallet-based authentication',
              'Real-time portfolio tracking',
              'Ecosystem missions and rewards',
            ].map((feature, idx) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + idx * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm text-white/90">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-muted-foreground">
          <p>© 2026 LitAgent. Part of the LitVM Ecosystem.</p>
        </div>
      </div>

      {/* Right side — auth card */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 lg:hidden">
            <LitAgentBrand />
          </div>

          <GlassCard variant="strong" className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {showEmailForm
                  ? emailMode === 'signup'
                    ? 'Create your account'
                    : 'Welcome back'
                  : 'Sign in to LitAgent'}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {showEmailForm
                  ? emailMode === 'signup'
                    ? 'Enter your email and password to create an account.'
                    : 'Enter your email and password to continue.'
                  : 'Connect your wallet or choose an option below to get started.'}
              </p>
            </div>

            {showEmailForm ? (
              <div className="space-y-4">
                <EmailAuthForm mode={emailMode} />
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => setShowEmailForm(false)}
                    className="text-muted-foreground transition-colors hover:text-white"
                  >
                    ← Back to all options
                  </button>
                  <button
                    onClick={() =>
                      setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')
                    }
                    className="font-medium text-primary hover:underline"
                  >
                    {emailMode === 'signin'
                      ? "Don't have an account? Sign up"
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Wallet buttons */}
                <WalletAuthButtons />

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/8" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-sidebar px-3 text-muted-foreground">
                      or continue with
                    </span>
                  </div>
                </div>

                {/* Google */}
                <GoogleSignInButton />

                {/* Email */}
                <button
                  onClick={() => {
                    setShowEmailForm(true);
                    setEmailMode('signin');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-primary/30"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  Continue with Email
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </GlassCard>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing, you agree to LitAgent&apos;s Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
