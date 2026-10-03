'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Sparkles, ArrowRight, Gift, Zap, BookOpen, Trophy, CheckCircle2, ShieldCheck } from 'lucide-react';
import { applyTheme } from '@/lib/theme';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string || '').toUpperCase();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('nk-theme') as 'light' | 'dark' | null) || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);

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

  const isDark = theme === 'dark';
  const bg = isDark ? '#0b0b0d' : '#f7f8fb';
  const fg = isDark ? '#fafafa' : '#0b0b12';
  const cardBg = isDark ? '#141417' : '#ffffff';
  const cardBorder = isDark ? 'rgba(138,162,255,0.18)' : 'rgba(31,81,255,0.16)';
  const accent = '#1f51ff';
  const accentBright = isDark ? '#8aa2ff' : '#1f51ff';
  const mutedFg = isDark ? '#9ca0ab' : '#71717a';

  const features = [
    { icon: Zap, text: 'Instant AI Flashcards & Active Recall' },
    { icon: BookOpen, text: 'Syllabus RAG & Contextual Study' },
    { icon: Trophy, text: 'Exam Readiness Quizzes & Mock Tests' },
    { icon: Sparkles, text: 'Claude 3.5, GPT-4o & DeepSeek AI' },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-200"
      style={{
        background: bg,
        color: fg,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{
          background: isDark ? 'rgba(31,81,255,0.18)' : 'rgba(31,81,255,0.12)',
        }}
      />

      <div
        className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-200"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        {/* Header Badge */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border shadow-xs"
          style={{
            background: isDark ? 'rgba(138,162,255,0.12)' : 'rgba(31,81,255,0.08)',
            borderColor: cardBorder,
            color: accentBright,
          }}
        >
          <Gift size={14} />
          <span>Exclusive Academic Invitation</span>
        </div>

        {/* Main Card Container matching AuthScreen */}
        <div
          className="w-full rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-6 shadow-xl relative backdrop-blur-md"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md p-2 transition-transform hover:scale-105"
              style={{
                background: isDark ? 'rgba(138,162,255,0.1)' : 'rgba(31,81,255,0.06)',
                border: `1px solid ${cardBorder}`,
              }}
            >
              <Image src="/asset/images/e.svg" alt="e-Mate AI logo" width={44} height={44} priority />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: fg }}>
                e-Mate <span style={{ color: accentBright }}>AI</span>
              </h1>
              <p className="text-xs font-medium mt-0.5" style={{ color: mutedFg }}>
                Smart Study Copilot & Exam Workspace
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: fg }}>
              Study 10× Faster. Ace Exams.
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedFg }}>
              You&apos;ve been invited to join e-Mate AI. Claim your 48-hour bonus study access & tokens below.
            </p>
          </div>

          {/* Code display */}
          {code && (
            <div
              className="w-full rounded-2xl p-4 flex flex-col items-center gap-2"
              style={{
                background: isDark ? '#1c1c20' : '#f2f4fb',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentBright }}>
                Your Referral Code
              </span>
              <div
                className="text-xl font-black tracking-[0.2em] font-mono cursor-pointer transition-transform active:scale-95 select-all"
                style={{ color: fg }}
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                {code}
              </div>
              {copied && (
                <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                  <CheckCircle2 size={12} />
                  <span>Copied to clipboard</span>
                </div>
              )}
            </div>
          )}

          {/* Features */}
          <div className="w-full space-y-2 text-left">
            {features.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-medium"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  color: fg,
                }}
              >
                <Icon size={15} style={{ color: accentBright }} className="shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleGetStarted}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-bold text-sm text-white shadow-lg transition-all active:scale-95 hover:opacity-95"
            style={{
              background: accent,
            }}
          >
            <span>Accept Invite & Get Started</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 text-xs" style={{ color: mutedFg }}>
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Free Plan • No Credit Card Required</span>
        </div>
      </div>
    </div>
  );
}
