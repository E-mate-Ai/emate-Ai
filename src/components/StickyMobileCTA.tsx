'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Zap, MessageSquare, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface StickyMobileCTAProps {
  onQuickPrompt?: (promptText: string) => void;
}

export default function StickyMobileCTA({ onQuickPrompt }: StickyMobileCTAProps) {
  const router = useRouter();
  const pathname = usePathname();

  // If on upgrade or auth screen, don't show the duplicate study CTA
  if (pathname === '/sign-up-login-screen' || pathname === '/thank-you') {
    return null;
  }

  const handleStartStudy = () => {
    trackEvent('sticky_mobile_cta_click', { action: 'start_study' });
    if (onQuickPrompt) {
      onQuickPrompt('Create a 15-minute high-yield study sprint plan for my next exam: ');
    } else {
      router.push('/ai-topper-chat');
    }
  };

  const handleUpgradeOrNotes = () => {
    if (pathname === '/upgrade') {
      const plusButton = document.querySelector('[data-tier="plus"]');
      if (plusButton) {
        plusButton.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    trackEvent('sticky_mobile_cta_click', { action: 'upgrade' });
    router.push('/upgrade');
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden p-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform">
      <div className="flex items-center gap-2 max-w-md mx-auto">
        <button
          type="button"
          onClick={handleStartStudy}
          className="flex-1 min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold tracking-tight shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={15} className="animate-pulse" />
          <span>Quick Study Sprint</span>
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={handleUpgradeOrNotes}
          className="min-h-[44px] px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 active:scale-[0.98] text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          title="Upgrade"
        >
          <Zap size={14} className="text-amber-500" />
          <span>Pro</span>
        </button>
      </div>
    </div>
  );
}
