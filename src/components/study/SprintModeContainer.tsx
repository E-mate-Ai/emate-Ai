'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import type { MCQQuestion } from '@/lib/agents/types';
import { cn } from '@/lib/utils';

/* ── Types ─────────────────────────────────────────────────────── */

export interface SprintFlashcard {
  id: string;
  front: string; // Concept / Term
  back: string; // Definition / Answer
  tag?: string;
}

interface SprintModeContainerProps {
  questions?: MCQQuestion[];
  flashcards?: SprintFlashcard[];
  onComplete?: (results: SprintResults) => void;
}

export interface SprintResults {
  mcqCorrect: number;
  mcqTotal: number;
  flashcardsReviewed: number;
  flashcardsTotal: number;
  totalCompleted: number;
  totalItems: number;
}

type SprintItem =
  | { kind: 'mcq'; index: number }
  | { kind: 'flashcard'; index: number };

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

const OPTION_COLORS = [
  { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
];

/* ── Sub-components ────────────────────────────────────────────── */

function ProgressBar({
  current,
  total,
  isDark,
}: {
  current: number;
  total: number;
  isDark: boolean;
}) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          Sprint Progress
        </span>
        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
          {current}/{total} completed
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #1f51ff, #6366f1)',
          }}
        />
      </div>
    </div>
  );
}

function MCQCard({
  question,
  index,
  total,
  answered,
  selectedAnswer,
  onSelect,
  isDark,
}: {
  question: MCQQuestion;
  index: number;
  total: number;
  answered: boolean;
  selectedAnswer: number | null;
  onSelect: (answerIdx: number) => void;
  isDark: boolean;
}) {
  const isCorrect = answered && selectedAnswer === question.correctAnswer;
  const isWrong = answered && selectedAnswer !== null && selectedAnswer !== question.correctAnswer;

  return (
    <div className="flex flex-col h-full">
      {/* Question number + topic */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0"
          style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: isDark ? '#a1a1aa' : '#71717a',
          }}
        >
          {index + 1}
        </span>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{
            background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
            color: '#818cf8',
          }}
        >
          {question.topicTag}
        </span>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-600 ml-auto">
          {index + 1}/{total}
        </span>
      </div>

      {/* Question text */}
      <p className="text-[15px] leading-relaxed font-medium text-zinc-900 dark:text-zinc-100 mb-5">
        {question.question}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-2.5 mb-5">
        {question.options.map((opt, i) => {
          const isSelected = selectedAnswer === i;
          const isThisCorrect = i === question.correctAnswer;
          const showCorrect = answered && isThisCorrect;
          const showWrong = answered && isSelected && !isThisCorrect;

          return (
            <button
              key={i}
              onClick={() => !answered && onSelect(i)}
              disabled={answered}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 border',
                answered
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]',
                showCorrect && 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                showWrong && 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950/30',
                !answered && isSelected && 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-400/30',
                !answered && !isSelected && 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
                !answered && !isSelected && isDark && 'bg-white/[0.03]',
                !answered && !isSelected && !isDark && 'bg-white',
              )}
            >
              {/* Radio pill label */}
              <span
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold shrink-0 transition-colors duration-200',
                  showCorrect && 'bg-emerald-500 text-white',
                  showWrong && 'bg-red-500 text-white',
                  !answered && isSelected && 'bg-blue-500 text-white',
                  !answered && !isSelected && (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'),
                  answered && !showCorrect && !showWrong && (isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'),
                )}
              >
                {showCorrect ? <CheckCircle2 size={14} /> : showWrong ? <XCircle size={14} /> : OPTION_LABELS[i]}
              </span>

              <span
                className={cn(
                  'flex-1 text-sm leading-snug',
                  showCorrect && 'text-emerald-700 dark:text-emerald-300',
                  showWrong && 'text-red-700 dark:text-red-300',
                  !answered && isSelected && 'text-blue-700 dark:text-blue-300',
                  !answered && !isSelected && 'text-zinc-700 dark:text-zinc-300',
                  answered && !showCorrect && !showWrong && 'text-zinc-400 dark:text-zinc-500',
                )}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation callout */}
      {answered && (
        <div
          className={cn(
            'rounded-xl p-4 text-sm leading-relaxed border transition-all duration-300',
            isCorrect
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
          )}
        >
          <div className="flex items-start gap-2.5">
            {isCorrect ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <div>
              <span className="font-semibold">
                {isCorrect ? 'Correct!' : 'Not quite — here\'s why:'}
              </span>
              <p className="mt-1 opacity-90">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlashcardCard({
  flashcard,
  index,
  total,
  flipped,
  onFlip,
  isDark,
}: {
  flashcard: SprintFlashcard;
  index: number;
  total: number;
  flipped: boolean;
  onFlip: () => void;
  isDark: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Flashcard header */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0"
          style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: isDark ? '#a1a1aa' : '#71717a',
          }}
        >
          {index + 1}
        </span>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{
            background: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.08)',
            color: '#a855f7',
          }}
        >
          {flashcard.tag || 'Flashcard'}
        </span>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-600 ml-auto">
          {index + 1}/{total}
        </span>
      </div>

      {/* 3D flip container */}
      <div className="flex-1 flex items-center justify-center" style={{ perspective: '1200px' }}>
        <button
          onClick={onFlip}
          className="relative w-full cursor-pointer group"
          style={{ transformStyle: 'preserve-3d', minHeight: '220px' }}
        >
          {/* Front face */}
          <div
            className={cn(
              'absolute inset-0 w-full rounded-2xl p-6 flex flex-col items-center justify-center text-center border transition-colors duration-200',
              isDark
                ? 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800'
                : 'bg-gradient-to-br from-white to-zinc-50 border-zinc-200',
            )}
            style={{
              backfaceVisibility: 'hidden',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Sparkles
              size={20}
              className="mb-3 text-indigo-400 dark:text-indigo-500 opacity-60"
            />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
              Concept
            </p>
            <p className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
              {flashcard.front}
            </p>
            <p className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <RotateCcw size={11} />
              Tap to reveal answer
            </p>
          </div>

          {/* Back face */}
          <div
            className={cn(
              'absolute inset-0 w-full rounded-2xl p-6 flex flex-col items-center justify-center text-center border transition-colors duration-200',
              'bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40',
              'border-indigo-200 dark:border-indigo-800',
            )}
            style={{
              backfaceVisibility: 'hidden',
              transform: flipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 dark:text-indigo-500 mb-3">
              Definition
            </p>
            <p className="text-base leading-relaxed font-medium text-indigo-900 dark:text-indigo-100">
              {flashcard.back}
            </p>
            <p className="mt-4 text-[11px] text-indigo-400 dark:text-indigo-500 flex items-center gap-1">
              <RotateCcw size={11} />
              Tap to see concept
            </p>
          </div>
        </button>
      </div>

      {/* Flip toggle button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={onFlip}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: isDark ? '#a1a1aa' : '#71717a',
          }}
        >
          <RotateCcw size={12} />
          Flip Card
        </button>
      </div>
    </div>
  );
}

function SprintComplete({
  results,
  isDark,
  onRestart,
}: {
  results: SprintResults;
  isDark: boolean;
  onRestart: () => void;
}) {
  const scorePct =
    results.mcqTotal > 0
      ? Math.round((results.mcqCorrect / results.mcqTotal) * 100)
      : null;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))'
            : 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
        }}
      >
        <Trophy size={28} className="text-indigo-500" />
      </div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        Sprint Complete!
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        You reviewed all {results.totalItems} items
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
        {scorePct !== null && (
          <div
            className="rounded-xl p-3 text-center border"
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
            }}
          >
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {scorePct}%
            </p>
            <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
              MCQ Score
            </p>
          </div>
        )}
        <div
          className="rounded-xl p-3 text-center border"
          style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          }}
        >
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {results.totalCompleted}
          </p>
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
            Items Done
          </p>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
        style={{ background: 'linear-gradient(135deg, #1f51ff, #6366f1)' }}
      >
        <RotateCcw size={14} />
        Sprint Again
      </button>
    </div>
  );
}

/* ── Main Container ────────────────────────────────────────────── */

export default function SprintModeContainer({
  questions = [],
  flashcards = [],
  onComplete,
}: SprintModeContainerProps) {
  const [isDark, setIsDark] = useState(true);

  // MCQ state
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [mcqRevealed, setMcqRevealed] = useState<Set<string>>(new Set());

  // Flashcard state
  const [flashcardFlipped, setFlashcardFlipped] = useState<Set<string>>(new Set());
  const [flashcardReviewed, setFlashcardReviewed] = useState<Set<string>>(new Set());

  // Current item index
  const [currentItemIdx, setCurrentItemIdx] = useState(0);

  // Build the ordered sprint deck
  const sprintDeck: SprintItem[] = useMemo(() => {
    const deck: SprintItem[] = [];
    questions.forEach((_, i) => deck.push({ kind: 'mcq', index: i }));
    flashcards.forEach((_, i) => deck.push({ kind: 'flashcard', index: i }));
    return deck;
  }, [questions, flashcards]);

  const totalItems = sprintDeck.length;

  const completedCount = useMemo(() => {
    let count = 0;
    questions.forEach((q) => { if (mcqRevealed.has(q.id)) count++; });
    flashcards.forEach((fc) => { if (flashcardReviewed.has(fc.id)) count++; });
    return count;
  }, [mcqRevealed, flashcardReviewed, questions, flashcards]);

  const isComplete = totalItems > 0 && completedCount === totalItems;

  // Theme
  useEffect(() => {
    const read = () => setIsDark(localStorage.getItem('nk-theme') !== 'light');
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  // Fire onComplete
  useEffect(() => {
    if (isComplete && onComplete) {
      const results: SprintResults = {
        mcqCorrect: questions.filter(
          (q) => mcqRevealed.has(q.id) && mcqAnswers[q.id] === q.correctAnswer,
        ).length,
        mcqTotal: questions.length,
        flashcardsReviewed: flashcards.filter((fc) => flashcardReviewed.has(fc.id)).length,
        flashcardsTotal: flashcards.length,
        totalCompleted: completedCount,
        totalItems,
      };
      onComplete(results);
    }
  }, [isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── MCQ Handlers ───────────────────────────────────────────────

  const handleMcqSelect = useCallback(
    (questionId: string, answerIdx: number) => {
      if (mcqRevealed.has(questionId)) return;
      setMcqAnswers((prev) => ({ ...prev, [questionId]: answerIdx }));
      setMcqRevealed((prev) => new Set(prev).add(questionId));
    },
    [mcqRevealed],
  );

  // ── Flashcard Handlers ─────────────────────────────────────────

  const handleFlashcardFlip = useCallback(
    (cardId: string) => {
      setFlashcardFlipped((prev) => {
        const next = new Set(prev);
        if (next.has(cardId)) next.delete(cardId);
        else next.add(cardId);
        return next;
      });
      setFlashcardReviewed((prev) => new Set(prev).add(cardId));
    },
    [],
  );

  // ── Navigation ─────────────────────────────────────────────────

  const goNext = useCallback(() => {
    setCurrentItemIdx((prev) => Math.min(prev + 1, totalItems - 1));
  }, [totalItems]);

  const goPrev = useCallback(() => {
    setCurrentItemIdx((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleRestart = useCallback(() => {
    setMcqAnswers({});
    setMcqRevealed(new Set());
    setFlashcardFlipped(new Set());
    setFlashcardReviewed(new Set());
    setCurrentItemIdx(0);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  // Current item
  const currentItem = sprintDeck[currentItemIdx] ?? null;

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden border"
      style={{
        background: isDark ? '#000000' : '#ffffff',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
      }}
    >
      {/* ── Top bar: progress + nav ─────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <ProgressBar
          current={completedCount}
          total={totalItems}
          isDark={isDark}
        />

        {/* Navigation arrows */}
        {totalItems > 1 && (
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={goPrev}
              disabled={currentItemIdx === 0}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all',
                currentItemIdx === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800',
              )}
              style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
            >
              <ChevronLeft size={13} />
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              {sprintDeck.map((item, i) => {
                const done =
                  (item.kind === 'mcq' && mcqRevealed.has(questions[item.index].id)) ||
                  (item.kind === 'flashcard' && flashcardReviewed.has(flashcards[item.index].id));
                return (
                  <div
                    key={i}
                    className={cn(
                      'rounded-full transition-all duration-200',
                      i === currentItemIdx ? 'w-5 h-1.5' : 'w-1.5 h-1.5',
                      done
                        ? 'bg-indigo-500'
                        : i === currentItemIdx
                          ? 'bg-indigo-400'
                          : isDark
                            ? 'bg-zinc-700'
                            : 'bg-zinc-300',
                    )}
                  />
                );
              })}
            </div>

            <button
              onClick={goNext}
              disabled={currentItemIdx === totalItems - 1}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all',
                currentItemIdx === totalItems - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800',
              )}
              style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Content area ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {isComplete ? (
          <SprintComplete
            results={{
              mcqCorrect: questions.filter(
                (q) => mcqRevealed.has(q.id) && mcqAnswers[q.id] === q.correctAnswer,
              ).length,
              mcqTotal: questions.length,
              flashcardsReviewed: flashcards.filter((fc) => flashcardReviewed.has(fc.id)).length,
              flashcardsTotal: flashcards.length,
              totalCompleted: completedCount,
              totalItems,
            }}
            isDark={isDark}
            onRestart={handleRestart}
          />
        ) : currentItem?.kind === 'mcq' ? (
          <MCQCard
            question={questions[currentItem.index]}
            index={currentItem.index}
            total={questions.length}
            answered={mcqRevealed.has(questions[currentItem.index].id)}
            selectedAnswer={mcqAnswers[questions[currentItem.index].id] ?? null}
            onSelect={(ans) => handleMcqSelect(questions[currentItem.index].id, ans)}
            isDark={isDark}
          />
        ) : currentItem?.kind === 'flashcard' ? (
          <FlashcardCard
            flashcard={flashcards[currentItem.index]}
            index={currentItem.index}
            total={flashcards.length}
            flipped={flashcardFlipped.has(flashcards[currentItem.index].id)}
            onFlip={() => handleFlashcardFlip(flashcards[currentItem.index].id)}
            isDark={isDark}
          />
        ) : null}
      </div>
    </div>
  );
}
