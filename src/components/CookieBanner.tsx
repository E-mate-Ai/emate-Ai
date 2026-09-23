'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Check, Shield } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const COOKIE_CONSENT_KEY = 'nk-cookie-consent-v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: true,
    functional: true,
  });

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Small delay so initial page loads smoothly
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({ essential: true, analytics: true, functional: true, timestamp: Date.now() })
      );
    } catch (_) {}
    trackEvent('cookie_consent', { action: 'accept_all' });
    setVisible(false);
  };

  const handleDeclineOptional = () => {
    try {
      localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({ essential: true, analytics: false, functional: false, timestamp: Date.now() })
      );
    } catch (_) {}
    trackEvent('cookie_consent', { action: 'decline_optional' });
    setVisible(false);
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({ ...preferences, essential: true, timestamp: Date.now() })
      );
    } catch (_) {}
    trackEvent('cookie_consent', { action: 'custom', ...preferences });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-5 text-zinc-900 dark:text-zinc-100">
        <button
          onClick={handleDeclineOptional}
          aria-label="Close cookie banner"
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Cookie size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
              We value your study privacy
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              e-Mate AI uses essential cookies to save your notebooks, protect study sessions, and provide performance analytics. Read our{' '}
              <Link
                href="/privacy"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href="/terms"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700"
              >
                Terms
              </Link>.
            </p>
          </div>
        </div>

        {showPreferences ? (
          <div className="my-3 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <div className="flex items-center justify-between text-xs py-1">
              <div>
                <span className="font-semibold block text-zinc-900 dark:text-zinc-200">Strictly Necessary</span>
                <span className="text-[11px] text-zinc-500">Authentication & syllabus state</span>
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Required</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <div>
                <span className="font-semibold block text-zinc-900 dark:text-zinc-200">Analytics & Performance</span>
                <span className="text-[11px] text-zinc-500">Helps us optimize query latency</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <div>
                <span className="font-semibold block text-zinc-900 dark:text-zinc-200">Functional & Themes</span>
                <span className="text-[11px] text-zinc-500">Saves your dark mode & sidebar width</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSavePreferences}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm"
              >
                Save Preferences
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              onClick={handleAcceptAll}
              className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              Accept All
            </button>
            <button
              onClick={handleDeclineOptional}
              className="w-full sm:w-auto py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
            >
              Necessary Only
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition py-1"
            >
              Customize
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
