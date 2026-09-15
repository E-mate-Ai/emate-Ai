'use client';

import React, { useEffect, useState } from 'react';

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

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'dark bg-zinc-950 text-zinc-400' : 'bg-slate-50 text-zinc-600'
      }`}
    >
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200/80 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/40 p-4 justify-between shadow-sm dark:shadow-none">
        <div className="space-y-6">
          {/* Logo & New Chat button header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-5 w-24 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-7 w-7 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse" />
          </div>

          {/* New Chat Button */}
          <div className="h-10 w-full rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/20 animate-pulse" />

          {/* Navigation Items */}
          <div className="space-y-3 pt-2">
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800/50 animate-pulse" />
            <div className="space-y-2">
              <div className="h-9 w-full rounded-lg bg-zinc-200/70 dark:bg-zinc-800/40 animate-pulse" />
              <div className="h-9 w-full rounded-lg bg-zinc-200/50 dark:bg-zinc-800/30 animate-pulse" />
              <div className="h-9 w-full rounded-lg bg-zinc-200/40 dark:bg-zinc-800/20 animate-pulse" />
              <div className="h-9 w-full rounded-lg bg-zinc-200/30 dark:bg-zinc-800/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/60">
          <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Area Skeleton */}
      <main className="flex flex-1 flex-col justify-between p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-200/70 dark:border-zinc-800/40">
          <div className="h-9 w-40 rounded-xl bg-zinc-200 dark:bg-zinc-800/70 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/60 animate-pulse" />
            <div className="h-9 w-24 rounded-xl bg-blue-500/20 dark:bg-blue-600/30 border border-blue-500/20 animate-pulse" />
          </div>
        </div>

        {/* Center Content / Greeting */}
        <div className="flex flex-col items-center justify-center my-auto w-full space-y-8 py-12">
          {/* App Logo/Icon Pulsing */}
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 dark:bg-gradient-to-tr dark:from-blue-600/30 dark:to-indigo-500/20 dark:border-blue-500/30 flex items-center justify-center animate-pulse shadow-md dark:shadow-lg dark:shadow-blue-500/10">
            <div className="h-8 w-8 rounded-xl bg-blue-500/30 dark:bg-blue-500/40 animate-pulse" />
          </div>

          <div className="space-y-3 text-center w-full flex flex-col items-center">
            <div className="h-7 w-64 md:w-80 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-44 md:w-56 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/60 animate-pulse" />
          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full max-w-2xl pt-4">
            <div className="h-20 rounded-2xl bg-white border border-zinc-200/90 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800/60 dark:shadow-none p-4 flex flex-col justify-between animate-pulse">
              <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-48 rounded bg-zinc-200/60 dark:bg-zinc-800/40" />
            </div>
            <div className="h-20 rounded-2xl bg-white border border-zinc-200/90 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800/60 dark:shadow-none p-4 flex flex-col justify-between animate-pulse">
              <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-44 rounded bg-zinc-200/60 dark:bg-zinc-800/40" />
            </div>
            <div className="h-20 rounded-2xl bg-white border border-zinc-200/90 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800/60 dark:shadow-none p-4 flex flex-col justify-between animate-pulse">
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-52 rounded bg-zinc-200/60 dark:bg-zinc-800/40" />
            </div>
            <div className="h-20 rounded-2xl bg-white border border-zinc-200/90 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800/60 dark:shadow-none p-4 flex flex-col justify-between animate-pulse">
              <div className="h-4 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-36 rounded bg-zinc-200/60 dark:bg-zinc-800/40" />
            </div>
          </div>
        </div>

        {/* Bottom Input Pill Bar Skeleton */}
        <div className="w-full max-w-3xl mx-auto pt-4">
          <div className="h-16 w-full rounded-2xl bg-white border border-zinc-200/90 shadow-md dark:bg-zinc-900/80 dark:border-zinc-800/80 dark:shadow-xl p-3 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-48 rounded bg-zinc-200/70 dark:bg-zinc-800/60" />
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-500/30 dark:bg-blue-600/40" />
          </div>
        </div>
      </main>
    </div>
  );
}
