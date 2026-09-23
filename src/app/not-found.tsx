'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, MessageSquare, Sparkles, Zap, ArrowLeft, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-x-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[100px] pointer-events-none" />

      <div className="text-center max-w-lg mx-auto flex flex-col items-center gap-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-lg">
          <Image src="/asset/images/e.svg" alt="e-Mate AI logo" width={40} height={40} priority />
        </div>

        <div className="relative">
          <h1 className="text-8xl sm:text-9xl font-black tracking-tighter text-blue-600/15 dark:text-blue-400/15 select-none font-mono">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/30 flex items-center gap-1.5">
              <Sparkles size={12} />
              Page Not Found
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lost in the study matrix?
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
            The page you are looking for does not exist or may have been reorganized. Let&apos;s get you back on track to ace your exams.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-2">
          <Link
            href="/ai-topper-chat"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all min-h-[44px] shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <MessageSquare size={16} />
            Go to AI Workspace
          </Link>

          <Link
            href="/upgrade"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-semibold transition-all min-h-[44px] active:scale-95"
          >
            <Zap size={16} className="text-amber-500" />
            Explore Pro Plans
          </Link>
        </div>

        {/* Helpful quick links */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 w-full flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1">
            <Home size={13} /> Home
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
            Terms of Service
          </Link>
          <span>•</span>
          <a href="mailto:support@emate-ai.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1">
            <HelpCircle size={13} /> Support
          </a>
        </div>
      </div>
    </div>
  );
}
