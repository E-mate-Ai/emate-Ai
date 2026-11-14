'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export interface ImageGenerationProps {
  children: React.ReactNode;
  /** Time (ms) before the progress countdown begins. Default 2500. */
  startingDelay?: number;
  /** Total duration (ms) of the unmask progress. Default 30000. */
  duration?: number;
}

export const ImageGeneration = ({ children, startingDelay = 1500, duration = 20000 }: ImageGenerationProps) => {
  const [progress, setProgress] = React.useState(0);
  const [loadingState, setLoadingState] = React.useState<'starting' | 'generating' | 'completed'>(
    'starting'
  );

  React.useEffect(() => {
    const startingTimeout = setTimeout(() => {
      setLoadingState('generating');

      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progressPercentage = Math.min(100, (elapsedTime / duration) * 100);
        setProgress(progressPercentage);

        if (progressPercentage >= 100) {
          clearInterval(interval);
          setLoadingState('completed');
        }
      }, 16);

      return () => clearInterval(interval);
    }, startingDelay);

    return () => clearTimeout(startingTimeout);
  }, [startingDelay, duration]);

  const label =
    loadingState === 'starting'
      ? 'Analyzing visual prompt...'
      : loadingState === 'generating'
        ? 'Rendering image with Flux. May take a moment...'
        : 'Image generated.';

  return (
    <div className="flex flex-col gap-2.5 my-2">
      <motion.span
        className="bg-[linear-gradient(110deg,#64748b,35%,#3b82f6,50%,#64748b,75%,#64748b)] dark:bg-[linear-gradient(110deg,#94a3b8,35%,#60a5fa,50%,#94a3b8,75%,#94a3b8)] bg-[length:200%_100%] bg-clip-text text-transparent text-xs sm:text-sm font-medium tracking-wide flex items-center gap-2"
        initial={{ backgroundPosition: '200% 0' }}
        animate={{
          backgroundPosition: loadingState === 'completed' ? '0% 0' : '-200% 0',
        }}
        transition={{
          repeat: loadingState === 'completed' ? 0 : Infinity,
          duration: 2.4,
          ease: 'linear',
        }}
      >
        <Sparkles size={14} className="text-blue-500 animate-pulse shrink-0" />
        <span>{label}</span>
      </motion.span>
      <div className="relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 max-w-md overflow-hidden shadow-xs">
        {children}
        <motion.div
          className="absolute inset-0 pointer-events-none backdrop-blur-md"
          initial={false}
          animate={{
            clipPath: `polygon(0 ${progress}%, 100% ${progress}%, 100% 100%, 0 100%)`,
            opacity: loadingState === 'completed' ? 0 : 1,
          }}
          style={{
            clipPath: `polygon(0 ${progress}%, 100% ${progress}%, 100% 100%, 0 100%)`,
            maskImage:
              progress === 0
                ? 'linear-gradient(to bottom, black -5%, black 100%)'
                : `linear-gradient(to bottom, transparent ${progress - 5}%, transparent ${progress}%, black ${progress + 5}%)`,
            WebkitMaskImage:
              progress === 0
                ? 'linear-gradient(to bottom, black -5%, black 100%)'
                : `linear-gradient(to bottom, transparent ${progress - 5}%, transparent ${progress}%, black ${progress + 5}%)`,
          }}
        />
      </div>
    </div>
  );
};

ImageGeneration.displayName = 'ImageGeneration';