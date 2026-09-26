'use client';

import React from 'react';

interface SidebarSkeletonProps {
  width?: number;
}

/**
 * A pixel-accurate skeleton of the Sidebar used as the `loading` fallback
 * in the dynamic import so the layout never shifts while Sidebar.js loads.
 */
export default function SidebarSkeleton({ width = 248 }: SidebarSkeletonProps) {
  return (
    <aside
      className="flex flex-col h-full overflow-hidden border-r"
      style={{
        width,
        minWidth: width,
        background: 'var(--sidebar-bg, #ffffff)',
        borderColor: 'rgba(0,0,0,0.06)',
      }}
    >
      {/* Top header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
          <div className="h-4 w-24 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
        </div>
        <div className="h-7 w-7 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse" />
      </div>

      {/* New Chat button */}
      <div className="px-3 pb-3">
        <div className="h-9 w-full rounded-xl bg-blue-500/10 border border-blue-500/15 animate-pulse" />
      </div>

      {/* Navigation nav items */}
      <div className="px-3 space-y-1 pb-4">
        {[0.9, 0.7, 0.8, 0.6].map((opacity, i) => (
          <div
            key={i}
            className="h-9 w-full rounded-lg animate-pulse"
            style={{
              background: `rgba(161,161,170,${opacity * 0.18})`,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      {/* Notebooks section label */}
      <div className="px-4 pb-2">
        <div className="h-3 w-20 rounded bg-zinc-200/70 dark:bg-zinc-800/50 animate-pulse" />
      </div>

      {/* Notebook items */}
      <div className="flex-1 px-3 space-y-1 overflow-hidden">
        {[0.9, 0.75, 0.6].map((opacity, i) => (
          <div
            key={i}
            className="h-9 w-full rounded-lg animate-pulse"
            style={{
              background: `rgba(161,161,170,${opacity * 0.15})`,
              animationDelay: `${(i + 4) * 80}ms`,
            }}
          />
        ))}
      </div>

      {/* User profile footer */}
      <div className="px-4 py-3 border-t border-zinc-200/70 dark:border-zinc-800/50 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="h-3 w-28 rounded bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
          <div className="h-2.5 w-20 rounded bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
