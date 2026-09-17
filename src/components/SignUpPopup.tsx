'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SignUpPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullAuth?: () => void;
}

export default function SignUpPopup({ isOpen, onClose, onOpenFullAuth }: SignUpPopupProps) {
  const [email, setEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    }

    const handleStorage = () => {
      const t = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
      setTheme(t || 'light');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const getRedirectUrl = () => {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028';
    return `${base}/auth/callback?next=/`;
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getRedirectUrl() },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
        return;
      }
      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      toast.error('Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Please enter your email address');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setEmailLoading(true);
    // Redirect to full auth screen with email prefilled or navigate
    if (onOpenFullAuth) {
      onOpenFullAuth();
    } else {
      window.location.assign(`/sign-up-login-screen?email=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleOpenAuthScreen = () => {
    if (onOpenFullAuth) {
      onOpenFullAuth();
    } else {
      window.location.assign('/sign-up-login-screen');
    }
  };

  return (
    <div
      onClick={handleOpenAuthScreen}
      className="fixed bottom-5 right-5 z-[99] w-[calc(100vw-2.5rem)] max-w-[340px] sm:max-w-[360px] rounded-3xl p-6 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in cursor-pointer hover:scale-[1.01]"
      style={{
        background: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: isDark
          ? '0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(138, 162, 255, 0.1)'
          : '0 20px 50px -10px rgba(0, 0, 0, 0.12), 0 0 20px rgba(0, 0, 0, 0.04)',
        color: isDark ? '#ffffff' : '#09090b',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        type="button"
        className="absolute top-4 right-4 p-1.5 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/20 z-10"
        style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
        title="Dismiss popup"
        aria-label="Close"
      >
        <X size={16} />
      </button>

      {/* Brand Icon */}
      <div className="flex flex-col items-center text-center">
        <div
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl mb-3.5 shadow-sm border"
          style={{
            background: isDark ? '#18181b' : '#f8f9fa',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          }}
        >
          <img src="/asset/images/e.svg" alt="e-Mate AI" className="h-7 w-7 object-contain" />
        </div>

        <h3
          className="text-base font-bold tracking-tight mb-1"
          style={{ color: isDark ? '#ffffff' : '#09090b' }}
        >
          Login or sign up for free
        </h3>
        <p
          className="text-xs font-medium mb-5"
          style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
        >
          Save and sync your searches
        </p>
      </div>

      {/* Auth Actions */}
      <div className="space-y-2.5">
        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full h-11 flex items-center justify-center gap-3 rounded-xl text-xs font-semibold transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 border shadow-sm"
          style={{
            background: isDark ? '#27272a' : '#18181b',
            color: '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
          }}
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Guest / Quick Continue */}
        <button
          type="button"
          onClick={() => {
            if (onOpenFullAuth) onOpenFullAuth();
            else window.location.assign('/sign-up-login-screen');
          }}
          className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/10 border"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            color: isDark ? '#e4e4e7' : '#27272a',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.05-.96.04-2.12.64-2.81 1.44-.61.71-1.15 1.86-1.01 2.97 1.07.08 2.16-.55 2.83-1.36z" />
          </svg>
          <span>Continue with Apple</span>
        </button>

        {/* Form for Email */}
        <form onSubmit={handleEmailSubmit} className="space-y-2 mt-3 pt-2">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl text-xs outline-none transition-all border placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
              color: isDark ? '#ffffff' : '#000000',
            }}
          />
          <button
            type="submit"
            disabled={emailLoading}
            className="w-full h-10 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              color: isDark ? '#ffffff' : '#18181b',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            {emailLoading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            <span>Continue with email</span>
          </button>
        </form>

        {/* Footer text */}
        <div className="pt-2 text-center">
          <button
            onClick={() => {
              if (onOpenFullAuth) onOpenFullAuth();
              else window.location.assign('/sign-up-login-screen');
            }}
            type="button"
            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            Single sign-on (SSO)
          </button>
        </div>
      </div>
    </div>
  );
}
