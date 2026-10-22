'use client';

import React from 'react';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface StatusFallbackBannerProps {
  message: string;
  selectedModel?: string;
  fallbackFromModel?: string;
}

export default function StatusFallbackBanner({
  message,
  selectedModel,
  fallbackFromModel,
}: StatusFallbackBannerProps) {
  return (
    <div className="my-2.5 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
      <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 leading-relaxed">
        <p className="font-semibold">{message}</p>
        {fallbackFromModel && selectedModel && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] opacity-80">
            <span className="line-through">{fallbackFromModel}</span>
            <ArrowRight size={10} />
            <span className="font-bold underline">{selectedModel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
