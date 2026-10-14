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
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Award,
  Layers,
  Clock,
  Eye,
  Edit3,
  MoreHorizontal,
  RotateCw,
} from 'lucide-react';

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
      }, 300);
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

  const isBotanical = /plant|botan|herb|flora|pharmacognos|medicinal/i.test(
    (deck.subject || '') + ' ' + (deck.title || '') + ' ' + (deck.topic || '')
  );

  const deckDescription = isBotanical
    ? 'Explore key medicinal plants, their active compounds, uses and therapeutic benefits with detailed visual references and diagrams.'
    : `Explore core concepts of ${deck.topic || deck.title} through active recall, verified diagrams, and spaced repetition.`;

  return (
    <div
      className={`mx-auto w-full max-w-4xl px-2 sm:px-4 py-2 transition-colors flex flex-col ${
        isDark ? 'text-zinc-100' : 'text-zinc-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── A. Compact Deck Header Matching Screenshot ─── */}
      <div className="w-full flex flex-col gap-2 mb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>AI Flashcard Generator</span>
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">›</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Flashcards</span>
        </div>

        {/* Title + Subtitle + Action buttons row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                {deck.title}
              </h1>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                Visual
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
              {deckDescription}
            </p>

            {/* Metadata row */}
            <div className="flex items-center gap-4 mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Layers size={13} className="text-zinc-400" />
                <span>{deck.cardCount} cards</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-zinc-400" />
                <span>{estimatedMin} min</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye size={13} className="text-zinc-400" />
                <span>Visual learning</span>
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
                <Edit3 size={12} className="text-blue-600 dark:text-blue-400" />
                <span>Edit Topic</span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptionsMenu((p) => !p)}
                title="More deck options"
                className="p-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 shadow-2xs transition cursor-pointer"
              >
                <MoreHorizontal size={14} />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-xl backdrop-blur-md p-1.5 min-w-[160px] text-xs">
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-2"
                  >
                    <Shuffle size={13} className="text-zinc-400" />
                    <span>Shuffle Deck</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-2"
                  >
                    <RotateCcw size={13} className="text-zinc-400" />
                    <span>Restart Deck</span>
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
                    Filter: All Cards ({cards.length})
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
                      Filter: Weak Cards ({stats.weakCount})
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
                      Filter: Bookmarked ({progress.bookmarkedCardIds.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── B. Study Workspace Panel (Matches Reference Screenshot) ─── */}
      <div className="relative w-full rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 p-5 sm:p-7 shadow-xs backdrop-blur-xs flex flex-col items-center overflow-hidden">
        {/* Soft decorative radial glow behind the card */}
        <div className="pointer-events-none absolute w-[460px] h-[340px] rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-3xl -z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        {/* Top Navigation & Progress Bar */}
        <div
          className="w-full flex items-center justify-between gap-3 mb-6 relative z-10"
          style={{ width: 'min(100%, 460px)' }}
        >
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={13} />
            <span>Previous</span>
          </button>

          {/* Progress Indicator: bar + text */}
          <div className="flex-1 flex flex-col items-center justify-center px-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              {currentIndex + 1} of {activeCards.length}
            </span>
            <div className="w-full max-w-[140px] h-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / activeCards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === activeCards.length - 1}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* The Centered Flashcard */}
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
              Swipe or use the arrows to navigate
            </p>

            {/* Bottom Action Bar */}
            <div className="mt-3 flex items-center justify-center gap-2 p-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-sm backdrop-blur-md">
              <button
                type="button"
                onClick={handleFlip}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95 cursor-pointer"
              >
                <RotateCw size={12} />
                <span>Flip Card</span>
              </button>

              <button
                type="button"
                onClick={handleFlip}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Eye size={13} />
                <span>{isFlipped ? 'Show Question' : 'Show Answer'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleBookmark}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95 cursor-pointer"
              >
                {isBookmarked ? (
                  <BookmarkCheck size={13} className="text-amber-500 fill-amber-500" />
                ) : (
                  <Bookmark size={13} />
                )}
                <span>Bookmark</span>
              </button>
            </div>

            {/* Keyboard helper tips */}
            <div className="mt-2 text-center text-[10px] text-zinc-400">
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
            <Award size={24} />
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
                <AlertCircle size={14} />
                <span>Review Weak Concepts ({stats.weakCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
            >
              <RotateCcw size={14} />
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
