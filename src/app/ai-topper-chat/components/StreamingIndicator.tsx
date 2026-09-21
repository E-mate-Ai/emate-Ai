import React from 'react';

export default function StreamingIndicator() {
  return (
    <div className="flex items-center justify-start py-2 fade-in-up">
      <div className="w-14 h-8 rounded-full bg-[#eaeaea] dark:bg-zinc-800 flex items-center justify-center gap-1.5 shadow-2xs">
        <span
          className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
