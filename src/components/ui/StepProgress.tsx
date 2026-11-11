'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface StepProgressProps {
  steps: string[];
  /** ms between each step advancing */
  duration?: number;
  /** Whether the process is active */
  active: boolean;
}

/**
 * Inline (non-fullscreen) step progress indicator.
 * Steps advance one-by-one, never loop.
 * The active step pulses; completed steps turn grey with a check.
 */
export default function StepProgress({ steps, duration = 1600, active }: StepProgressProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active) {
      setCurrent(0);
      return;
    }
    if (current >= steps.length - 1) return; // stop at last step
    const t = setTimeout(() => setCurrent((c) => c + 1), duration);
    return () => clearTimeout(t);
  }, [active, current, duration, steps.length]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-2 py-3 px-1"
        >
          {steps.map((step, i) => {
            const isDone = i < current;
            const isActive = i === current;
            return (
              <motion.div
                key={step}
                className="flex items-center gap-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: isDone ? 0.4 : isActive ? 1 : 0.25 }}
                transition={{ duration: 0.4 }}
              >
                {/* Circle indicator */}
                <span
                  className={[
                    'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border',
                    isDone
                      ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                      : isActive
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-300',
                  ].join(' ')}
                >
                  {isDone ? (
                    // checkmark svg
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  )}
                </span>

                {/* Label */}
                <span
                  className={[
                    'text-xs font-medium transition-colors',
                    isDone
                      ? 'text-zinc-400 dark:text-zinc-500 line-through'
                      : isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-zinc-300 dark:text-zinc-600',
                  ].join(' ')}
                >
                  {step}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

