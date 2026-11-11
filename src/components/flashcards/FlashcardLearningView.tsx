'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  FlashcardDeck,
  Flashcard,
  RecallRating,
  DeckProgress,
} from '@/lib/flashcards/types';
import {
  getDeckProgress,
  recordCardRating,
  toggleBookmarkCard,
  updateCardImage,
} from '@/lib/flashcards/storage';
import type { EducationalImage } from '@/lib/flashcards/types';
import EditorialCard from './EditorialCard';

// Premium Heroicons
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BookmarkIcon,
  TrophyIcon,
  RectangleStackIcon,
  ClockIcon,
  EyeIcon,
  PencilSquareIcon,
  EllipsisHorizontalIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkIconSolid,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';

interface FlashcardLearningViewProps {
  deck: FlashcardDeck;
  onBack: () => void;
  onEditTopic?: () => void;
  isDark?: boolean;
}

export default function FlashcardLearningView({
  deck,
  onBack,
  onEditTopic,
  isDark = false,
}: FlashcardLearningViewProps) {
  const [cards, setCards] = useState<Flashcard[]>(deck.cards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState<DeckProgress>(() => getDeckProgress(deck.id));
  const [filterMode, setFilterMode] = useState<'all' | 'weak' | 'bookmarked'>('all');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Sync progress and ensure scroll to top
  useEffect(() => {
    setProgress(getDeckProgress(deck.id));
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTop = 0;
    }
  }, [deck.id]);

  // Filtered cards list
  const activeCards = useMemo(() => {
    if (filterMode === 'weak') {
      const weakIds = Object.entries(progress.cardRatings)
        .filter(([_, r]) => r.rating === 'again' || r.rating === 'hard')
        .map(([id]) => id);
      const filtered = cards.filter((c) => weakIds.includes(c.id));
      return filtered.length > 0 ? filtered : cards;
    }
    if (filterMode === 'bookmarked') {
      const filtered = cards.filter((c) => progress.bookmarkedCardIds.includes(c.id));
      return filtered.length > 0 ? filtered : cards;
    }
    return cards;
  }, [cards, filterMode, progress]);

  // Clamp current index when cards filter changes
  useEffect(() => {
    if (currentIndex >= activeCards.length) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  }, [activeCards.length, currentIndex]);

  const currentCard = activeCards[currentIndex];
  const cardRating = currentCard ? progress.cardRatings[currentCard.id]?.rating : undefined;
  const isBookmarked = currentCard ? progress.bookmarkedCardIds.includes(currentCard.id) : false;

  // Rating counts
  const stats = useMemo(() => {
    const ratings = Object.values(progress.cardRatings).map((r) => r.rating);
    const again = ratings.filter((r) => r === 'again').length;
    const hard = ratings.filter((r) => r === 'hard').length;
    const good = ratings.filter((r) => r === 'good').length;
    const easy = ratings.filter((r) => r === 'easy').length;
    const totalStudied = Object.keys(progress.cardRatings).length;
    const mastered = good + easy;
    const weakCount = again + hard;
    return { again, hard, good, easy, totalStudied, mastered, weakCount };
  }, [progress]);

  const estimatedMin = Math.ceil((deck.cardCount || 6) * 0.6);

  const handleNext = useCallback(() => {
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, activeCards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRateRecall = useCallback(
    (rating: RecallRating) => {
      if (!currentCard) return;
      const updated = recordCardRating(deck, currentCard.id, rating);
      setProgress(updated);

      // Auto-advance to next card after brief delay
      setTimeout(() => {
        if (currentIndex < activeCards.length - 1) {
          handleNext();
        }
      }, 350);
    },
    [currentCard, deck, currentIndex, activeCards.length, handleNext]
  );

  const handleToggleBookmark = useCallback(() => {
    if (!currentCard) return;
    toggleBookmarkCard(deck.id, currentCard.id);
    setProgress(getDeckProgress(deck.id));
  }, [deck.id, currentCard]);

  const handleUpdateCardImage = useCallback(
    (newImage: EducationalImage) => {
      if (!currentCard) return;
      const updatedDeck = updateCardImage(deck.id, currentCard.id, newImage);
      if (updatedDeck) {
        setCards(updatedDeck.cards);
      }
    },
    [deck.id, currentCard]
  );

  const handleShuffle = useCallback(() => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowOptionsMenu(false);
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowOptionsMenu(false);
  }, []);

  // Keyboard navigation
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
      } else if (isFlipped) {
        if (e.key === '1') handleRateRecall('again');
        if (e.key === '2') handleRateRecall('hard');
        if (e.key === '3') handleRateRecall('good');
        if (e.key === '4') handleRateRecall('easy');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev, handleFlip, handleRateRecall, isFlipped]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  const isCompleted = currentIndex === activeCards.length - 1 && cardRating !== undefined;

  return (
    <div
      className={`mx-auto w-full max-w-4xl px-2 sm:px-4 py-2 transition-colors flex flex-col ${
        isDark ? 'text-zinc-100' : 'text-zinc-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── A. Header Navigation & Deck Overview ─── */}
      <div className="w-full flex flex-col gap-2.5 mb-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Study Session</span>
        </div>

        {/* Title + Subtitle + Action buttons row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {deck.title}
              </h1>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                Visual Active Recall
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl font-normal">
              {deck.topic || 'Master this subject with spaced-repetition active recall questions and verified figures.'}
            </p>

            {/* Metadata row */}
            <div className="flex items-center gap-4 mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <RectangleStackIcon className="h-4 w-4 text-zinc-400 stroke-[1.7]" />
                <span>{deck.cardCount || cards.length} cards</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4 text-zinc-400 stroke-[1.7]" />
                <span>{estimatedMin} min</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <EyeIcon className="h-4 w-4 text-zinc-400 stroke-[1.7]" />
                <span>Active recall</span>
              </span>
            </div>
          </div>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2 shrink-0 relative">
            {onEditTopic && (
              <button
                type="button"
                onClick={onEditTopic}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <PencilSquareIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Edit Topic</span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptionsMenu((p) => !p)}
                title="More deck options"
                className="p-2 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-2xs transition cursor-pointer"
              >
                <EllipsisHorizontalIcon className="h-4 w-4" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-xl backdrop-blur-md p-1.5 min-w-[170px] text-xs">
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-2"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Shuffle Deck</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-2"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Restart Practice</span>
                  </button>
                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('all');
                      setShowOptionsMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-[11px]"
                  >
                    All Cards ({cards.length})
                  </button>
                  {stats.weakCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMode('weak');
                        setShowOptionsMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-[11px]"
                    >
                      Weak Cards ({stats.weakCount})
                    </button>
                  )}
                  {progress.bookmarkedCardIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMode('bookmarked');
                        setShowOptionsMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition text-[11px]"
                    >
                      Bookmarked ({progress.bookmarkedCardIds.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── B. Study Workspace Panel with Floating 3D Orbital Rings (Matching References) ─── */}
      <div className="relative w-full rounded-[32px] sm:rounded-[36px] border border-zinc-200/90 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 p-6 sm:p-9 shadow-sm backdrop-blur-xs flex flex-col items-center overflow-hidden">

        {/* 3D Orbital Rings in the background behind the card (Matching Screenshot Atmosphere) */}
        <svg
          className="pointer-events-none absolute w-[120%] max-w-[660px] h-[360px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-40 dark:opacity-20"
          viewBox="0 0 600 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse
            cx="300"
            cy="160"
            rx="280"
            ry="80"
            transform="rotate(-12 300 160)"
            stroke="url(#studyRing1)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <ellipse
            cx="300"
            cy="160"
            rx="260"
            ry="70"
            transform="rotate(14 300 160)"
            stroke="url(#studyRing2)"
            strokeWidth="1.8"
          />
          <defs>
            <linearGradient id="studyRing1" x1="40" y1="80" x2="560" y2="240" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="0.5" stopColor="#60a5fa" stopOpacity="0.8" />
              <stop offset="1" stopColor="#a855f7" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="studyRing2" x1="60" y1="220" x2="540" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818cf8" stopOpacity="0.2" />
              <stop offset="0.5" stopColor="#38bdf8" stopOpacity="0.75" />
              <stop offset="1" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ambient radial blur behind card */}
        <div className="pointer-events-none absolute w-[420px] h-[320px] rounded-full bg-blue-100/40 dark:bg-blue-900/15 blur-3xl z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        {/* Top Navigation Bar: Previous, Counter, Next */}
        <div
          className="w-full flex items-center justify-between gap-3 mb-6 relative z-10"
          style={{ width: 'min(100%, 460px)' }}
        >
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5 stroke-[2]" />
            <span>Previous</span>
          </button>

          {/* Progress Tracker Pill */}
          <div className="flex-1 flex flex-col items-center justify-center px-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1">
              {currentIndex + 1} of {activeCards.length}
            </span>
            <div className="w-full max-w-[140px] h-1.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / activeCards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === activeCards.length - 1}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRightIcon className="h-3.5 w-3.5 stroke-[2]" />
          </button>
        </div>

        {/* The Centered Flashcard (Matching media_1794388104362_8f669d17.jpg) */}
        {currentCard ? (
          <div className="w-full flex flex-col items-center relative z-10">
            <EditorialCard
              card={currentCard}
              cardNumber={currentIndex + 1}
              totalCards={activeCards.length}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              onRateRecall={handleRateRecall}
              currentRating={cardRating}
              isBookmarked={isBookmarked}
              onToggleBookmark={handleToggleBookmark}
              onUpdateCardImage={handleUpdateCardImage}
              isDark={isDark}
              deckSubject={deck.subject}
            />

            {/* Hint */}
            <p className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium text-center">
              Swipe or use keyboard arrows to navigate
            </p>

            {/* Bottom Floating Action Bar */}
            <div className="mt-3.5 flex items-center justify-center gap-2 p-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-sm backdrop-blur-md">
              <button
                type="button"
                onClick={handleFlip}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95 cursor-pointer"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                <span>Flip Card</span>
              </button>

              <button
                type="button"
                onClick={handleFlip}
                className="inline-flex items-center gap-1.5 px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-xs transition active:scale-95 cursor-pointer"
              >
                <EyeIcon className="h-3.5 w-3.5" />
                <span>{isFlipped ? 'Show Question' : 'Check Answer'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleBookmark}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95 cursor-pointer"
              >
                {isBookmarked ? (
                  <BookmarkIconSolid className="h-4 w-4 text-amber-500" />
                ) : (
                  <BookmarkIcon className="h-4 w-4" />
                )}
                <span>Bookmark</span>
              </button>
            </div>

            {/* Keyboard shortcut tips */}
            <div className="mt-2.5 text-center text-[10px] text-zinc-400">
              <span>Keys: </span>
              <kbd className="rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 font-mono text-[9px]">Space</kbd> flip •{' '}
              <kbd className="rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 font-mono text-[9px]">← / →</kbd> nav •{' '}
              <kbd className="rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 font-mono text-[9px]">1-4</kbd> rate recall
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-500">No cards in this filter.</p>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 underline cursor-pointer"
            >
              Show All Cards
            </button>
          </div>
        )}
      </div>

      {/* ─── Completion Modal ─── */}
      {isCompleted && (
        <div
          className={`mx-auto mt-6 max-w-[460px] rounded-3xl p-6 sm:p-7 text-center border shadow-xs ${
            isDark
              ? 'bg-[#151b28] border-zinc-800 text-zinc-100'
              : 'bg-white border-zinc-200 text-zinc-900'
          }`}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <TrophyIcon className="h-6 w-6 stroke-[1.8]" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">
            Deck Review Complete!
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            You reviewed all {activeCards.length} cards in this session.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500">Mastered (Good/Easy)</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.mastered} / {deck.cards.length}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500">Needs Review (Again/Hard)</span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {stats.weakCount}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {stats.weakCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilterMode('weak');
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                <ExclamationCircleIcon className="h-4 w-4" />
                <span>Review Weak Concepts ({stats.weakCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              <span>Practice Again</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <span>Back to Overview</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}