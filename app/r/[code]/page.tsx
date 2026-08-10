'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VanityReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (code) {
      try {
        localStorage.setItem('litagent_referral_code', code);
      } catch {
        // Handle storage gracefully
      }
      router.push(`/join?ref=${encodeURIComponent(code)}`);
    } else {
      router.push('/missions');
    }
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-white text-xs">
      Applying referral code {code}...
    </div>
  );
}
