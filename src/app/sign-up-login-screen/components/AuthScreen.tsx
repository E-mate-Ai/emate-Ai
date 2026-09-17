'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, X, ArrowLeft, Mail, CheckCircle2, Sparkles, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { clearGuestModeEnabled, setGuestModeEnabled } from '@/lib/guest-mode';
import { applyTheme } from '@/lib/theme';

import { useRouter } from 'next/navigation';

export default function AuthScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'password' | 'confirm'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const updateTheme = () => {
      const savedTheme = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
      const t = savedTheme || 'light';
      setTheme(t);
      applyTheme(t);
    };

    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  const getRedirectUrl = () => {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028';
    return `${base}/auth/callback?next=/`;
  };

  /* ── Google OAuth ── */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
      return;
    }
    if (data?.url) {
      window.location.assign(data.url);
    }
  };

  /* ── Email step ── */
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email address is required');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    setError(null);
    setEmail(trimmed);
    setStep('password');
  };

  /* ── Guest ── */
  const handleGuestContinue = async () => {
    setGuestModeEnabled(true);

    // Set guest cookie so middleware allows access
    document.cookie = 'is_guest_user=true; path=/; max-age=86400; SameSite=Lax';
    localStorage.setItem('guest_session', 'true');

    // Server-side cookie for production
    try {
      await fetch('/api/auth/guest', { method: 'POST' });
    } catch {
      // Client-side cookie is sufficient
    }

    toast.success('Continuing as guest');
    router.push('/');
  };

  /* ── Password / signup step ── */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name || email.split('@')[0] },
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      // Sync user profile to Supabase profiles table
      if (data.user) {
        try {
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              email: data.user.email,
              full_name: name || email.split('@')[0],
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (err) {
          console.error('Failed to sync profile to Supabase:', err);
        }
      }

      // Email confirmation required
      if (data.user && !data.session) {
        setStep('confirm');
        setIsLoading(false);
        return;
      }

      // Auto-confirm is ON
      clearGuestModeEnabled();
      toast.success('Account created! Welcome to e-Mate.');
      router.push('/');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid credentials')
        ) {
          setError('Invalid email or password. Try again or create a new account.');
        } else {
          setError(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.session) {
        clearGuestModeEnabled();
        toast.success('Welcome back!');
        router.push('/');
      }
    }
  };

  /* ── Forgot password ── */
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getRedirectUrl()}?next=/`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent! Check your inbox.');
    }
  };

  /* ── Resend confirmation ── */
  const handleResendConfirmation = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Confirmation email resent!');
    }
  };

  /* ─────── Styles (e-Mate blue/system theme) ─────── */
  const isDark = theme === 'dark';
  const bg = isDark ? '#0b0b0d' : '#f7f8fb';
  const fg = isDark ? '#fafafa' : '#0b0b12';
  const cardBg = isDark ? '#141417' : '#ffffff';
  const cardBorder = isDark ? 'rgba(138,162,255,0.18)' : 'rgba(31,81,255,0.16)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
  const inputBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const accent = '#1f51ff';
  const accentBright = isDark ? '#8aa2ff' : '#1f51ff';
  const accentText = isDark ? '#a8b8ff' : '#1f51ff';
  const btnPrimaryBg = isDark ? accentBright : accent;
  const btnPrimaryFg = isDark ? '#0b0b0d' : '#ffffff';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const socialBg = isDark ? '#1c1c20' : '#f2f4fb';
  const socialBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
  const mutedFg = isDark ? '#9ca0ab' : '#71717a';
  const accentSoft = isDark ? 'rgba(138,162,255,0.16)' : 'rgba(31,81,255,0.10)';

  const rootStyle: React.CSSProperties & Record<string, string> = {
    background: bg,
    color: fg,
    fontFamily: "'Inter', sans-serif",
    '--accent': accent,
    '--accent-bright': accentBright,
    '--accent-text': accentText,
    '--muted': mutedFg,
  };

  const focusRingCls = isDark ? 'focus:ring-[#8aa2ff]' : 'focus:ring-[#1f51ff]';
  const inputClass = `w-full h-12 px-5 bg-transparent border rounded-2xl text-sm text-left placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all ${focusRingCls}`;
  const guestBorder = isDark ? 'rgba(138,162,255,0.35)' : 'rgba(31,81,255,0.32)';
  const guestText = isDark ? accentBright : '#1f51ff';

  const brandPanelBg = isDark
    ? 'linear-gradient(160deg,#16161a 0%,#121216 100%)'
    : 'linear-gradient(160deg,#1f51ff 0%,#1435c8 100%)';

  const perks = [
    { icon: Zap, title: 'Turn notes into flashcards', desc: 'Feed in PDFs and notes — get quizzes in seconds.' },
    { icon: Sparkles, title: 'AI study copilot', desc: 'Clear explanations, derivations, and cram-ready summaries.' },
    { icon: ShieldCheck, title: 'Private by design', desc: 'Your data stays yours. No ads, no selling.' },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col md:flex-row relative font-sans transition-colors duration-500"
      style={rootStyle}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      />

      <style>{`
        button { cursor: pointer; }
        button:disabled { cursor: default; }
        .auth-link { color: var(--accent-text); }
        .auth-link:hover { color: var(--accent-bright); }
        .auth-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
        .auth-muted { color: var(--muted); }
        .auth-muted:hover { color: var(--accent-text); }
        .auth-btn { transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease, border-color .18s ease; }
        .auth-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px -8px rgba(31,81,255,0.35); }
        .auth-btn:active { transform: translateY(0); }
        .auth-social:hover { border-color: var(--accent); }
        @media (prefers-reduced-motion: reduce){ *,*::before,*::after { animation:none !important; transition:none !important } }
      `}</style>

      {/* ── Brand panel (left, desktop) ── */}
      <aside className="relative hidden md:flex md:w-[46%] lg:w-[44%] min-h-screen flex-col justify-between p-10 lg:p-14 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: brandPanelBg }}
        />
        {/* decorative glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: isDark ? 'rgba(31,81,255,0.35)' : 'rgba(255,255,255,0.18)' }} />
        <div className="absolute bottom-0 -left-24 w-128 h-128 rounded-full opacity-25 blur-3xl"
          style={{ background: isDark ? 'rgba(138,162,255,0.18)' : 'rgba(255,255,255,0.12)' }} />

        <div className="relative z-10">
          <a href="/" className="inline-flex items-center gap-3 group" aria-label="e-Mate AI home">
            <div
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/15 backdrop-blur shadow-lg transition-transform group-hover:scale-105"
            >
              <img
                src="/asset/images/e.svg"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-white">e-Mate AI</span>
          </a>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
            Your AI study copilot,
            <br />
            one login away.
          </h1>
          <p className="text-white/75 text-base leading-relaxed max-w-md">
            Flashcards, quizzes, PDF summaries, and hands-free voice study — built for university students who want to study smarter.
          </p>

          <ul className="space-y-5 mt-2">
            {perks.map((p) => (
              <li key={p.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20">
                  <p.icon size={19} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{p.title}</p>
                  <p className="text-white/70 text-sm leading-relaxed mt-0.5">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/50 text-xs">
          © {new Date().getFullYear()} e-Mate AI. All rights reserved.
        </p>
      </aside>

      {/* ── Form side (right, or full on mobile) ── */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-10 blur-[120px] rounded-full"
            style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)' }}
          />
        </div>

        {/* Mobile logo bar */}
        <div className="w-full flex justify-between items-center md:hidden max-w-[440px] z-10 mb-6">
          <a href="/" className="flex items-center gap-3" aria-label="e-Mate AI home">
            <div
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border"
              style={{ borderColor: 'rgba(15,23,42,0.08)', background: '#f8f9fa' }}
            >
              <img src="/asset/images/e.svg" alt="" className="h-full w-full object-contain" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              e-Mate AI
            </p>
          </a>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-[440px] border rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 my-auto transition-all"
          style={{
            background: cardBg,
            borderColor: cardBorder,
            boxShadow: isDark
              ? '0 24px 80px -24px rgba(31,81,255,0.30)'
              : '0 24px 80px -28px rgba(31,81,255,0.22)',
          }}
        >
          {/* Close */}
          <button
            onClick={() => window.location.assign('/')}
            className="absolute right-5 top-5 p-2 rounded-full transition focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2"
            style={{ color: mutedFg }}
            aria-label="Close and return home"
          >
            <X size={18} />
          </button>

          {/* ── Confirm screen ── */}
          {step === 'confirm' ? (
            <div className="space-y-6 text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: accentSoft }}
              >
                <CheckCircle2 size={32} style={{ color: accentText }} />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: fg }}>
                  Check your email
                </h1>
                <p className="text-sm leading-relaxed px-4" style={{ color: mutedFg }}>
                  We sent a confirmation link to{' '}
                  <span className="font-medium" style={{ color: fg }}>
                    {email}
                  </span>
                  . Click the link to activate your account.
                </p>
              </div>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  borderColor: cardBorder,
                }}
              >
                <Mail size={16} style={{ color: mutedFg }} className="shrink-0" />
                <p className="text-xs" style={{ color: mutedFg }}>
                  Didn&apos;t receive it? Check spam or{' '}
                  <button
                    onClick={handleResendConfirmation}
                    className="hover:underline font-medium auth-link"
                  >
                    resend
                  </button>
                </p>
              </div>
              <button
                onClick={() => {
                  setStep('email');
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-sm transition auth-muted"
              >
                ← Back to sign in
              </button>
            </div>
          ) : step === 'email' ? (
            /* ── Email step ── */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: fg }}>
                  {isSignUp ? 'Create account' : 'Log in or sign up'}
                </h1>
                <p className="text-xs sm:text-sm leading-normal px-2" style={{ color: mutedFg }}>
                  AI-powered study copilot for university students.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="px-4 py-3 rounded-xl text-xs text-red-700 dark:text-red-400 border border-red-500/20 bg-red-500/5"
                >
                  {error}
                </div>
              )}

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-12 flex items-center justify-center gap-3 border rounded-full text-sm font-semibold transition-all disabled:opacity-50 auth-social focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2"
                style={{ background: socialBg, borderColor: socialBorder, color: fg }}
              >
                {googleLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px" style={{ background: dividerColor }} />
                <span className="text-[10px] font-bold tracking-wider" style={{ color: mutedFg }}>
                  OR
                </span>
                <div className="flex-1 h-px" style={{ background: dividerColor }} />
              </div>

              {/* Guest */}
              <button
                type="button"
                onClick={handleGuestContinue}
                className="w-full h-11 border rounded-full text-sm font-medium transition-all auth-social focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2"
                style={{ borderColor: guestBorder, color: guestText }}
              >
                Continue as Guest
              </button>

              {/* Email form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3" noValidate>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: mutedFg }} htmlFor="auth-email">
                    Email address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    style={{ borderColor: inputBorder, color: fg, backgroundColor: inputBg }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold rounded-full transition-all flex items-center justify-center auth-btn focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2"
                  style={{ background: btnPrimaryBg, color: btnPrimaryFg }}
                >
                  Continue with email
                </button>
              </form>

              <p className="text-center text-xs" style={{ color: mutedFg }}>
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSignUp(false);
                        setError(null);
                      }}
                      className="hover:underline font-semibold auth-link"
                    >
                      Sign in
                    </a>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSignUp(true);
                        setError(null);
                      }}
                      className="hover:underline font-semibold auth-link"
                    >
                      Sign up
                    </a>
                  </>
                )}
              </p>
            </div>
          ) : (
            /* ── Password step ── */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <button
                  onClick={() => {
                    setStep('email');
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold mb-2 transition auth-muted focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: fg }}>
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="text-xs truncate px-4" style={{ color: mutedFg }}>
                  {email}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="px-4 py-3 rounded-xl text-xs text-red-700 dark:text-red-400 border border-red-500/20 bg-red-500/5"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-3" noValidate>
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: mutedFg }} htmlFor="auth-name">
                      Full name (optional)
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      autoComplete="name"
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      style={{ borderColor: inputBorder, color: fg, backgroundColor: inputBg }}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: mutedFg }} htmlFor="auth-password">
                    {isSignUp ? 'Password' : 'Current password'}
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isSignUp ? 'Min 6 characters' : 'Enter your password'}
                      value={password}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-12`}
                      style={{ borderColor: inputBorder, color: fg, backgroundColor: inputBg }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2"
                      style={{ color: mutedFg }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-60 auth-btn focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2"
                  style={{ background: btnPrimaryBg, color: btnPrimaryFg }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />{' '}
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </>
                  ) : isSignUp ? (
                    'Create Account'
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <p className="text-center text-xs" style={{ color: mutedFg }}>
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSignUp(false);
                        setError(null);
                      }}
                      className="hover:underline font-semibold auth-link"
                    >
                      Sign in
                    </a>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSignUp(true);
                        setError(null);
                      }}
                      className="hover:underline font-semibold auth-link"
                    >
                      Sign up
                    </a>
                  </>
                )}
              </p>

              {!isSignUp && (
                <button
                  onClick={handleForgotPassword}
                  className="block mx-auto text-xs transition auth-muted focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2"
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer disclaimer */}
        <div
          className="w-full max-w-md text-center text-[10px] sm:text-[11px] leading-normal px-4 z-10 mt-6"
          style={{ color: mutedFg }}
        >
          By continuing you agree to our{' '}
          <a href="/#about" className="underline cursor-pointer hover:text-current">Terms &amp; Privacy Policy</a>. Chats may be
          reviewed to improve our models. <a href="/#faq" className="underline cursor-pointer hover:text-current">Learn more</a>
        </div>
      </main>
    </div>
  );
}
