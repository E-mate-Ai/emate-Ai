'use client';

import React, { useEffect, useState } from 'react';

/**
 * Full-page skeleton loader displayed via Suspense while AITopperChatScreen
 * lazy-loads. Layout is intentionally pixel-accurate to the real UI so there
 * is zero perceived content shift when the real page replaces it.
 */
export default function SkeletonLoader() {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const updateThemeState = () => {
      if (typeof window === 'undefined') return;
      const savedTheme = localStorage.getItem('nk-theme');
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(savedTheme === 'dark' || hasDarkClass);
    };

    updateThemeState();
    window.addEventListener('storage', updateThemeState);
    window.addEventListener('nk-theme', updateThemeState as EventListener);

    return () => {
      window.removeEventListener('storage', updateThemeState);
      window.removeEventListener('nk-theme', updateThemeState as EventListener);
    };
  }, []);

  const bg = isDark ? '#0a0a0a' : '#ffffff';
  const sidebarBg = isDark ? '#111113' : '#f8f8f9';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const shimmer = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const shimmerStrong = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';

  const Pulse = ({
    className,
    style,
    delay = 0,
  }: {
    className: string;
    style?: React.CSSProperties;
    delay?: number;
  }) => (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ animationDelay: `${delay}ms`, background: shimmer, ...style }}
    />
  );

  return (
    <div
      className="flex h-screen w-screen overflow-hidden select-none"
      style={{ background: bg, transition: 'background 0.2s ease' }}
    >
      {/* ── Sidebar Skeleton ───────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 h-full border-r"
        style={{ width: 248, minWidth: 248, background: sidebarBg, borderColor: border }}
      >
        {/* Header: logo + collapse button */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl animate-pulse" style={{ background: shimmerStrong }} />
            <div className="h-4 w-24 rounded-md animate-pulse" style={{ background: shimmer }} />
          </div>
          <div className="h-7 w-7 rounded-lg animate-pulse" style={{ background: shimmer }} />
        </div>

        {/* New Chat button */}
        <div className="px-3 pb-3">
          <div
            className="h-9 w-full rounded-xl animate-pulse"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}
          />
        </div>

        {/* Nav items */}
        <div className="px-3 space-y-1 pb-4">
          {[{ w: '90%', d: 0 }, { w: '80%', d: 60 }, { w: '85%', d: 120 }, { w: '70%', d: 180 }].map(
            ({ w, d }, i) => (
              <div
                key={i}
                className="h-9 rounded-lg animate-pulse"
                style={{ width: w, background: shimmer, animationDelay: `${d}ms` }}
              />
            )
          )}
        </div>

        {/* Section label */}
        <div className="px-4 pb-2">
          <div className="h-3 w-20 rounded animate-pulse" style={{ background: shimmer }} />
        </div>

        {/* Notebook items */}
        <div className="flex-1 px-3 space-y-1 overflow-hidden">
          {[{ d: 240 }, { d: 300 }, { d: 360 }].map(({ d }, i) => (
            <div
              key={i}
              className="h-9 w-full rounded-lg animate-pulse"
              style={{ background: shimmer, animationDelay: `${d}ms` }}
            />
          ))}
        </div>

        {/* User profile footer */}
        <div
          className="px-4 py-3 flex items-center gap-3 border-t"
          style={{ borderColor: border }}
        >
          <div className="h-8 w-8 rounded-full flex-shrink-0 animate-pulse" style={{ background: shimmerStrong }} />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3 w-28 rounded animate-pulse" style={{ background: shimmerStrong }} />
            <div className="h-2.5 w-20 rounded animate-pulse" style={{ background: shimmer }} />
          </div>
        </div>
      </aside>

      {/* ── Main Content Skeleton ─────────────────────────────── */}
      <main
        className="flex flex-1 flex-col h-full overflow-hidden"
        style={{ background: bg }}
      >
        {/* Top mode tabs (Study / General) */}
        <div
          className="flex items-center gap-2 px-5 pt-4 pb-3 border-b"
          style={{ borderColor: border }}
        >
          <div className="h-8 w-20 rounded-full animate-pulse" style={{ background: shimmerStrong }} />
          <div className="h-8 w-24 rounded-full animate-pulse delay-75" style={{ background: shimmer, animationDelay: '60ms' }} />
          <div className="ml-auto h-8 w-20 rounded-xl animate-pulse" style={{ background: shimmer, animationDelay: '120ms' }} />
        </div>

        {/* Center welcome area */}
        <div className="flex flex-col items-center justify-center flex-1 w-full px-6 space-y-8 pb-12">
          {/* Greeting heading */}
          <div className="space-y-3 text-center w-full flex flex-col items-center">
            <div className="h-8 w-72 md:w-96 rounded-xl animate-pulse" style={{ background: shimmerStrong }} />
            <div className="h-5 w-48 md:w-64 rounded-lg animate-pulse" style={{ background: shimmer, animationDelay: '60ms' }} />
          </div>

          {/* Input box skeleton */}
          <div className="w-full max-w-2xl">
            <div
              className="h-32 w-full rounded-2xl animate-pulse border"
              style={{ background: isDark ? '#17171a' : '#f4f5f6', borderColor: border }}
            >
              {/* Bottom toolbar inside input */}
              <div className="flex items-center justify-between px-4 pb-3 pt-20">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg animate-pulse" style={{ background: shimmer }} />
                  <div className="h-6 w-32 rounded-xl animate-pulse" style={{ background: shimmer, animationDelay: '80ms' }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg animate-pulse" style={{ background: shimmer, animationDelay: '40ms' }} />
                  <div className="h-7 w-7 rounded-lg animate-pulse" style={{ background: shimmer, animationDelay: '80ms' }} />
                  <div className="h-7 w-7 rounded-full animate-pulse" style={{ background: shimmerStrong, animationDelay: '120ms' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Suggestion tabs + cards */}
          <div className="w-full max-w-2xl space-y-3">
            {/* Category tabs */}
            <div
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border overflow-x-auto"
              style={{ background: isDark ? '#14141a' : '#f8f8f9', borderColor: border }}
            >
              {[{ w: 80, d: 0 }, { w: 96, d: 50 }, { w: 84, d: 100 }, { w: 72, d: 150 }, { w: 90, d: 200 }].map(
                ({ w, d }, i) => (
                  <div
                    key={i}
                    className="h-7 flex-shrink-0 rounded-xl animate-pulse"
                    style={{ width: w, background: i === 0 ? shimmerStrong : shimmer, animationDelay: `${d}ms` }}
                  />
                )
              )}
            </div>

            {/* Suggestion items */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: border, background: isDark ? '#14141a' : '#f8f8f9' }}>
              {[{ w: '75%', d: 0 }, { w: '65%', d: 60 }, { w: '70%', d: 120 }].map(({ w, d }, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0" style={{ borderColor: border }}>
                  <div className="h-4 w-4 rounded flex-shrink-0 animate-pulse" style={{ background: shimmer, animationDelay: `${d}ms` }} />
                  <div
                    className="h-3.5 rounded animate-pulse"
                    style={{ width: w, background: shimmer, animationDelay: `${d + 30}ms` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
