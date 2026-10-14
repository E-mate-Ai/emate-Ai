'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { FlashcardDeck, Flashcard, RecallRating } from '@/lib/flashcards/types';
import { recordCardRating, getDeckProgress, toggleBookmarkCard } from '@/lib/flashcards/storage';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
  Maximize2,
  Info,
} from 'lucide-react';
import Link from 'next/link';

interface InlineFlashcardsProps {
  deck: FlashcardDeck;
  /** @deprecated Theme is now auto-detected via useAppTheme. This prop is ignored. */
  theme?: 'light' | 'dark';
}

export default function InlineFlashcards({ deck }: InlineFlashcardsProps) {
  const { isDark } = useAppTheme();
  const [cards, setCards] = useState<Flashcard[]>(deck.cards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState(() => getDeckProgress(deck.id));
  const [showAttribution, setShowAttribution] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setProgress(getDeckProgress(deck.id));
  }, [deck.id]);

  const currentCard = cards[currentIndex];
  const cardRating = currentCard ? progress.cardRatings[currentCard.id]?.rating : undefined;
  const isBookmarked = currentCard ? progress.bookmarkedCardIds.includes(currentCard.id) : false;

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setImageError(false);
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setImageError(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    (rating: RecallRating) => {
      if (!currentCard) return;
      const updated = recordCardRating(deck, currentCard.id, rating);
      setProgress(updated);

      setTimeout(() => {
        if (currentIndex < cards.length - 1) {
          handleNext();
        }
      }, 300);
    },
    [currentCard, deck, currentIndex, cards.length, handleNext]
  );

  const handleToggleBookmark = useCallback(() => {
    if (!currentCard) return;
    toggleBookmarkCard(deck.id, currentCard.id);
    setProgress(getDeckProgress(deck.id));
  }, [deck.id, currentCard]);

  const handleShuffle = useCallback(() => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setImageError(false);
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setImageError(false);
  }, []);

  // Keyboard navigation inside chat if focused
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev, handleFlip]);

  if (!currentCard) return null;

  return (
    <div
      className={`mx-auto my-3 w-full max-w-2xl rounded-2xl border p-4 sm:p-5 shadow-sm transition-colors ${
        isDark ? 'border-zinc-800 bg-[#121214] text-zinc-100' : 'border-zinc-200 bg-white text-zinc-900'
      }`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Layers size={13} />
            <span>Visual Flashcards</span>
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            {deck.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {currentIndex + 1} / {cards.length}
          </span>
          <button
            type="button"
            onClick={handleToggleBookmark}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark card'}
            className={`p-1.5 rounded-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              isBookmarked ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
          <Link
            href="/ai-flashcard-generator"
            title="Open in full Visual Studio"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Maximize2 size={15} />
          </Link>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* ── Flippable Card Container ── */}
      <div
        className="relative min-h-[360px] sm:min-h-[400px] w-full cursor-pointer select-none [perspective:1000px]"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) return;
          handleFlip();
        }}
      >
        <div
          className={`relative h-full w-full rounded-2xl border transition-transform duration-500 ease-out [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          } ${
            isDark
              ? 'border-zinc-800 bg-zinc-900/90 shadow-md'
              : 'border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/50 shadow-sm'
          }`}
        >
          {/* ── FRONT FACE ── */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 [backface-visibility:hidden]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                {currentCard.categoryPill || 'Prompt'}
              </span>
              <span className="text-[11px] text-zinc-400">Tap to reveal answer</span>
            </div>

            {/* Question Text */}
            <div className="my-auto py-2 text-center">
              <h3 className="text-base sm:text-lg font-semibold leading-relaxed text-zinc-900 dark:text-zinc-100">
                {currentCard.front}
              </h3>
            </div>

            {/* Image Preview if available */}
            {currentCard.image && !imageError && (
              <div className="relative my-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 max-h-44 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentCard.image.url}
                  alt={currentCard.image.alt || currentCard.front}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => setImageError(true)}
                  className="max-h-40 w-full object-contain p-2"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAttribution((prev) => !prev);
                  }}
                  className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-xs transition hover:bg-black/80 flex items-center gap-1"
                >
                  <Info size={10} />
                  <span>Attribution</span>
                </button>

                {showAttribution && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 flex flex-col justify-center rounded-xl bg-black/90 p-3 text-xs text-white"
                  >
                    <p className="font-semibold">{currentCard.image.sourceName}</p>
                    <p className="text-[11px] text-zinc-300 line-clamp-2 my-1">
                      {currentCard.image.attribution || currentCard.image.alt}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <a
                        href={currentCard.image.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 underline text-[11px] flex items-center gap-1"
                      >
                        Source <ExternalLink size={10} />
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowAttribution(false)}
                        className="text-zinc-400 hover:text-white text-[11px]"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scientific subtitle & tap hint */}
            <div className="mt-auto text-center pt-1">
              {currentCard.scientificName && (
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {currentCard.scientificName}
                </p>
              )}
              <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-zinc-400">
                <RotateCw size={11} />
                <span>Click card or press Space to flip</span>
              </div>
            </div>
          </div>

          {/* ── BACK FACE ── */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <Sparkles size={12} />
                  Answer &amp; Explanation
                </span>
                <button
                  type="button"
                  onClick={handleFlip}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600"
                >
                  <RotateCw size={11} />
                  <span>Show Prompt</span>
                </button>
              </div>

              {/* Answer Title */}
              <h4 className="mt-2.5 text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {currentCard.back}
              </h4>

              {/* Deep Explanation */}
              {currentCard.explanation && (
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {currentCard.explanation}
                </p>
              )}

              {/* Example / Mnemonic */}
              {currentCard.example && (
                <div className="mt-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 p-2.5 text-xs text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/40">
                  <span className="font-semibold mr-1">💡 Memory Aid:</span>
                  <span>{currentCard.example}</span>
                </div>
              )}
            </div>

            {/* Recall Rating Controls */}
            <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
              <p className="text-[11px] font-medium text-center text-zinc-500 mb-2">
                Rate your recall
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRate('again')}
                  className={`rounded-lg py-1.5 text-center transition ${
                    cardRating === 'again'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}
                >
                  <p className="text-[11px] font-bold">Again</p>
                  <p className="text-[9px] opacity-75">Forgot</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('hard')}
                  className={`rounded-lg py-1.5 text-center transition ${
                    cardRating === 'hard'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  <p className="text-[11px] font-bold">Hard</p>
                  <p className="text-[9px] opacity-75">Struggled</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('good')}
                  className={`rounded-lg py-1.5 text-center transition ${
                    cardRating === 'good'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300'
                  }`}
                >
                  <p className="text-[11px] font-bold">Good</p>
                  <p className="text-[9px] opacity-75">Remembered</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('easy')}
                  className={`rounded-lg py-1.5 text-center transition ${
                    cardRating === 'easy'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  <p className="text-[11px] font-bold">Easy</p>
                  <p className="text-[9px] opacity-75">Mastered</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShuffle}
            title="Shuffle"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
          >
            <Shuffle size={14} />
          </button>
          <button
            type="button"
            onClick={handleRestart}
            title="Restart"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={handleFlip}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition active:scale-95"
          >
            {isFlipped ? 'Show Prompt' : 'Reveal Answer'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
