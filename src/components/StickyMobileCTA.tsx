'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface StickyMobileCTAProps {
  onQuickPrompt?: (promptText: string) => void;
}

export default function StickyMobileCTA({ onQuickPrompt }: StickyMobileCTAProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (
    pathname === '/sign-up-login-screen' ||
    pathname === '/thank-you' ||
    pathname === '/ai-topper-chat'
  ) {
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/85 px-3 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl shadow-[0_-12px_26px_rgba(15,23,42,0.08)] md:hidden">
      <div className="mx-auto flex w-full max-w-md items-center gap-2.5">
        <button
          type="button"
          onClick={handleStartStudy}
          className="group relative flex flex-1 items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-4 py-3 text-left text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/12">
              <Sparkles size={14} className="text-white" />
            </span>
            <span className="text-[13px] font-semibold tracking-[-0.01em]">Study sprint</span>
          </div>
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={handleUpgradeOrNotes}
          className="flex h-[48px] items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 text-xs font-semibold text-white shadow-sm transition active:scale-95"
          title="Upgrade to Pro"
        >
          <span>Upgrade</span>
          <span className="rounded-full bg-white/22 px-2 py-0.5 text-[10px] font-bold text-white">
            Pro
          </span>
        </button>
      </div>
    </div>
  );
}
