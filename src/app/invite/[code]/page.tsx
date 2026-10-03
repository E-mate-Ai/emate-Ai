'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Sparkles, ArrowRight, Gift, Zap, BookOpen, Trophy, CheckCircle2 } from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string || '').toUpperCase();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Store the referral code in localStorage so we can credit the inviter after sign-up
    if (code && code !== 'EMATE') {
      try {
        localStorage.setItem('emate_referral_code', code);
        localStorage.setItem('emate_referral_ts', Date.now().toString());
      } catch {}
    }
  }, [code]);

  const handleGetStarted = () => {
    router.push('/sign-up-login-screen');
  };

  const features = [
    { icon: Zap, text: 'Instant AI flashcard generation from any topic' },
    { icon: BookOpen, text: 'Syllabus-aware study context (RAG)' },
    { icon: Trophy, text: 'Active recall quizzes to ace every exam' },
    { icon: Sparkles, text: 'Multi-model AI: Claude, GPT-4o, DeepSeek & more' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[700px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-cyan-500/10 dark:bg-cyan-600/10 blur-[80px] pointer-events-none" />

      <div
        className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto gap-8 animate-in fade-in zoom-in-95 duration-300"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        {/* Invite Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 dark:bg-blue-400/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 text-sm font-semibold">
          <Gift size={15} />
          <span>You&apos;ve been invited to e-Mate AI!</span>
        </div>

        {/* Logo & Brand */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-blue-600/10 dark:bg-blue-500/10 border border-blue-500/25 shadow-xl shadow-blue-500/20 flex items-center justify-center">
            <Image src="/asset/images/e.svg" alt="e-Mate AI" width={56} height={56} priority />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              e-Mate{' '}
              <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-base font-medium mt-1">
              Smart Study Copilot & Academic Topper Workspace
            </p>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Study 10× Faster. Ace Every Exam.
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed">
            Your friend invited you to try e-Mate AI — the AI-powered workspace trusted by 10,000+ students and toppers. Use their invite code and both of you earn rewards!
          </p>
        </div>

        {/* Referral Code Card */}
        {code && (
          <div className="w-full rounded-3xl border border-blue-500/25 bg-blue-50 dark:bg-blue-950/30 p-5 flex flex-col items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Your Friend&apos;s Invite Code
            </p>
            <div
              className="w-full text-center text-2xl font-black tracking-[0.25em] text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 rounded-2xl py-4 px-6 border border-zinc-200 dark:border-zinc-800 select-all cursor-pointer transition-all active:scale-98"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              title="Click to copy"
            >
              {code}
            </div>
            {copied && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-semibold animate-in fade-in duration-150">
                <CheckCircle2 size={14} />
                <span>Copied!</span>
              </div>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center">
              Enter this code in Settings after signing up to claim your reward tokens.
            </p>
          </div>
        )}

        {/* Features Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {features.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60"
            >
              <Icon size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-snug">
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleGetStarted}
            className="flex-1 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            Get Started Free
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Trust note */}
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Free to use • No credit card required • Join 10,000+ students
        </p>

        {/* Footer brand */}
        <p className="text-xs text-zinc-400 dark:text-zinc-600 flex items-center gap-1.5">
          <span>©</span>
          <span>e-Mate AI</span>
          <span>·</span>
          <a
            href="https://emate-ai.runs-on.dev"
            className="text-blue-500 hover:underline"
          >
            emate-ai.runs-on.dev
          </a>
        </p>
      </div>
    </div>
  );
}
