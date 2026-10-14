'use client';

import React from 'react';
import type { FlashcardDeck } from '@/lib/flashcards/types';
import { BookOpen, Sparkles, Play, ArrowRight, Layers } from 'lucide-react';

interface DeckFanPreviewProps {
  deck: FlashcardDeck;
  onStartLearning: () => void;
  onOpenDeckModal?: () => void;
  isDark?: boolean;
}

const TAB_COLORS = [
  '#2d5bff', // e-Mate Primary Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
];

export default function DeckFanPreview({
  deck,
  onStartLearning,
  onOpenDeckModal,
  isDark = false,
}: DeckFanPreviewProps) {
  const cards = deck.cards || [];
  const previewCards = cards.slice(0, 5);

  return (
    <div
      className={`relative mx-auto w-full max-w-5xl rounded-3xl p-6 sm:p-8 md:p-10 transition-all border shadow-xs ${
        isDark
          ? 'bg-[#151b28] border-zinc-800 text-zinc-100'
          : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.15fr_1.25fr]">
        {/* Left Column: Deck Information & Call to Action */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              <Layers size={13} />
              <span>{deck.subject}</span>
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
              {deck.difficulty}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {deck.cardCount} Visual Cards
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight text-zinc-900 dark:text-zinc-50">
            {deck.title}
          </h3>

          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-lg">
            Master {deck.topic} through active recall, verified educational diagrams, and spaced repetition review.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStartLearning}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-95 cursor-pointer bg-blue-600"
            >
              <Play size={15} fill="currentColor" />
              <span>Start Learning ({deck.cardCount} Cards)</span>
              <ArrowRight size={14} />
            </button>

            {onOpenDeckModal && (
              <button
                type="button"
                onClick={onOpenDeckModal}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 cursor-pointer active:scale-95"
              >
                <BookOpen size={14} />
                <span>Quick Preview</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Physical Overlapping Fan Arrangement */}
        <div className="relative flex items-center justify-center py-4 sm:py-6 overflow-hidden lg:overflow-visible">
          {/* Luminous ambient glow behind fan */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none opacity-70" />

          <div className="relative h-[330px] sm:h-[370px] w-[310px] sm:w-[370px]">
            {/* Title Card (Left Tilted Card) */}
            <div
              className={`absolute left-0 top-5 z-10 w-[165px] sm:w-[190px] h-[250px] sm:h-[280px] rounded-2xl p-2.5 shadow-xl transition-all duration-300 hover:rotate-0 hover:scale-105 hover:!z-50 hover:shadow-2xl hover:ring-2 hover:ring-blue-500 border-2 cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 border-blue-500/40'
                  : 'bg-blue-50/60 border-blue-200'
              }`}
              style={{ transform: 'rotate(-10deg) translate(-10px, 15px)' }}
              onClick={onStartLearning}
            >
              <div
                className={`flex h-full w-full flex-col justify-between rounded-xl p-4 text-center transition-colors border ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                    : 'bg-white border-zinc-200/80 text-zinc-900'
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  e-Mate AI
                </div>
                <div className="my-auto py-2">
                  <p className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {deck.subject}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Visual Flashcards
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  {deck.cardCount} Cards
                </div>
              </div>
            </div>

            {/* Overlapping Fanned Flashcards Stack with dynamic interactive hover elevation */}
            {previewCards.map((card, idx) => {
              const rotation = (idx - 1) * 3;
              const xOffset = 85 + idx * 24;
              const yOffset = idx * 6;
              const zIndex = 20 + idx;
              const tabColor = TAB_COLORS[idx % TAB_COLORS.length];

              return (
                <div
                  key={card.id}
                  className={`group absolute top-0 h-[265px] sm:h-[300px] w-[180px] sm:w-[210px] rounded-2xl p-2.5 shadow-xl transition-all duration-300 hover:-translate-y-6 hover:scale-110 hover:!z-50 hover:shadow-2xl hover:ring-2 hover:ring-blue-500 border cursor-pointer ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700/80'
                      : 'bg-white border-zinc-200'
                  }`}
                  style={{
                    left: 0,
                    transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg)`,
                    zIndex,
                  }}
                  onClick={onStartLearning}
                >
                  {/* Colorful Top Tab */}
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 h-3.5 w-10 rounded-t-md shadow-xs opacity-90 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: tabColor }}
                  />

                  {/* Inner Card Surface */}
                  <div
                    className={`flex h-full w-full flex-col justify-between rounded-xl p-3 text-center transition-colors border ${
                      isDark
                        ? 'bg-zinc-950 border-zinc-800/80 text-zinc-100 group-hover:bg-zinc-900'
                        : 'bg-zinc-50/70 border-zinc-200/60 text-zinc-900 group-hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/60 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {idx + 1}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold truncate max-w-[80px]">
                        {card.categoryPill || 'Card'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold tracking-tight line-clamp-2 my-1 text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {card.scientificName || card.front}
                    </p>

                    {/* Image thumbnail */}
                    {card.image && (
                      <div className="my-1 h-20 sm:h-24 w-full overflow-hidden rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.image.url}
                          alt={card.image.alt || card.front}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.failed) {
                              target.dataset.failed = 'true';
                              target.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250"><rect width="400" height="250" fill="#0f172a"/><circle cx="200" cy="110" r="45" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/><text x="200" y="115" font-family="sans-serif" font-size="12" fill="#60a5fa" text-anchor="middle" font-weight="bold">${(card.scientificName || card.categoryPill || 'e-Mate').slice(0, 16)}</text><text x="200" y="180" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">Educational Concept Visual</text></svg>`
                              )}`;
                            }
                          }}
                          className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}

                    <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 line-clamp-2">
                      {card.back}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
