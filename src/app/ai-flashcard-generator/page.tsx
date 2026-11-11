'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { FlashcardDeck, Flashcard } from '@/lib/flashcards/types';
import { getLocalDecks, STARTER_DECKS, getDeckProgress, saveLocalDeck } from '@/lib/flashcards/storage';
import { useAppTheme } from '@/hooks/useAppTheme';
import FlashcardLearningView from '@/components/flashcards/FlashcardLearningView';
import FlashcardGeneratorPanel from '@/components/flashcards/FlashcardGeneratorPanel';
import FlashcardLibraryView from '@/components/flashcards/FlashcardLibraryView';
import PublicFooter from '@/components/PublicFooter';
import PdfUploader from '@/components/PdfUploader';
import FannedHeroCardsPreview from '@/components/flashcards/FannedHeroCardsPreview';

// Premium Heroicons (replacing generic icons with refined vector geometry)
import {
  SparklesIcon,
  AcademicCapIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  RectangleStackIcon,
  EyeIcon,
  PlayIcon,
  CheckCircleIcon,
  PlusIcon,
  ChevronRightIcon,
  BoltIcon,
  MicrophoneIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  PlayIcon as PlayIconSolid,
  SparklesIcon as SparklesIconSolid,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';

/* ─── Subject filter options ─── */
const SUBJECT_FILTERS = [
  'All subjects',
  'Biology',
  'Computer Science',
  'Medicine',
  'Mathematics',
  'Physics',
];

const QUICK_DECKS = [
  { topic: 'Cell Biology & Mitosis Phase Diagrams', subject: 'Biology', count: 8 },
  { topic: 'Organic Chemistry Reaction Mechanisms', subject: 'Chemistry', count: 10 },
  { topic: 'Data Structures: Graphs & Hashmaps', subject: 'Computer Science', count: 8 },
  { topic: 'Human Brain Anatomy & Neurotransmitters', subject: 'Medicine', count: 10 },
];

/* ─── Bento Deck Card (Spacious, Uncongested & Elegant) ─── */
function BentoDeckCard({
  deck,
  onStudy,
  onPreview,
  isDark,
}: {
  deck: FlashcardDeck;
  onStudy: () => void;
  onPreview: () => void;
  isDark: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const thumbnail = deck.thumbnailUrl || deck.cards?.[0]?.image?.url;
  const progress = getDeckProgress(deck.id);
  const ratedCount = Object.keys(progress.cardRatings || {}).length;
  const totalCards = deck.cardCount || deck.cards?.length || 8;
  const progressPct = Math.round((ratedCount / totalCards) * 100);

  // Subject pill color mapping
  const subjectPillColor = (subj?: string) => {
    const s = (subj || '').toLowerCase();
    if (s.includes('bio') || s.includes('botan'))
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80';
    if (s.includes('med') || s.includes('anat'))
      return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80';
    if (s.includes('comput') || s.includes('code'))
      return 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/80';
    if (s.includes('phys') || s.includes('math'))
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/80';
    return 'bg-zinc-100 text-zinc-700 border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
  };

  return (
    <div
      onClick={onStudy}
      className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-400/80 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Top Header: Subject pill + Difficulty label (Clean & non-clipping) */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${subjectPillColor(deck.subject)}`}>
            {deck.subject}
          </span>
          <span className="text-xs font-medium text-zinc-400 capitalize">
            {deck.difficulty}
          </span>
        </div>

        {/* Spacious Thumbnail Frame */}
        <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-3 mb-4 flex items-center justify-center border border-zinc-100 dark:border-zinc-800/80">
          {thumbnail && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumbnail}
              alt={deck.title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-blue-500/80 dark:text-blue-400">
              <BookOpenIcon className="h-9 w-9 stroke-[1.5]" />
              <span className="text-xs font-medium text-zinc-400">Active Recall Deck</span>
            </div>
          )}

          {progressPct > 0 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-0.5 shadow-sm">
              {progressPct}% Mastered
            </span>
          )}
        </div>

        {/* Title & Topic: 2 full lines of breathing room (never truncated awkwardly) */}
        <h3 className="text-base sm:text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug min-h-[44px]">
          {deck.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2 font-normal">
          {deck.topic || 'Visual high-yield flashcard deck for active recall and exam preparation.'}
        </p>
      </div>

      {/* Footer controls: Spacious & balanced */}
      <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
            <RectangleStackIcon className="h-4 w-4 text-zinc-400 stroke-[1.6]" />
            {totalCards} cards
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-400">
            <ClockIcon className="h-4 w-4 stroke-[1.6]" />
            {Math.ceil(totalCards * 0.7)}m
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStudy();
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <PlayIconSolid className="h-3 w-3" />
          <span>Study</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Main Flashcard Generator Page ─────────────────────────────────── */
export default function AIFlashcardGeneratorPage() {
  const { isDark } = useAppTheme();
  const [decks, setDecks] = useState<FlashcardDeck[]>(STARTER_DECKS);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'learn' | 'create' | 'library' | 'pdf'>('home');

  // PDF upload state
  const [pdfText, setPdfText] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfCardCount, setPdfCardCount] = useState(10);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Search & Filters
  const [quickTopic, setQuickTopic] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All subjects');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const refreshDecks = () => setDecks(getLocalDecks());

  useEffect(() => {
    refreshDecks();
    const handler = () => refreshDecks();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const featuredDeck = decks[0] || STARTER_DECKS[0];

  const filteredDecks = decks.filter((deck) => {
    if (subjectFilter === 'All subjects') return true;
    return deck.subject?.toLowerCase() === subjectFilter.toLowerCase();
  });

  const handleStartLearning = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setCurrentView('learn');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopic.trim()) return;
    setCurrentView('create');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleQuickDeck = (topic: string, subject: string, count: number) => {
    setQuickTopic(topic);
    setCurrentView('create');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleGenerateFromPdf = async () => {
    if (!pdfText.trim()) return;
    setPdfGenerating(true);
    setPdfError(null);
    try {
      const payload = {
        topic: pdfFileName || 'PDF Document',
        count: pdfCardCount,
        difficulty: 'intermediate',
        learningMode: 'conceptual',
        studyMaterial: pdfText,
      };
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Generation failed (HTTP ${res.status})`);
      }
      const { deck } = await res.json();
      if (!deck || !deck.cards || deck.cards.length === 0) {
        throw new Error('No flashcards were created. Please try again with more content.');
      }
      saveLocalDeck(deck);
      refreshDecks();
      setActiveDeck(deck);
      setCurrentView('learn');
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err: any) {
      setPdfError(err?.message || 'Failed to generate flashcards from PDF. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  };

  /* ── Render: learn mode ─ */
  if (currentView === 'learn' && activeDeck) {
    return (
      <AppLayout>
        <main className="min-h-[calc(100dvh-64px)] w-full bg-gradient-to-b from-sky-100/70 via-blue-50/40 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-zinc-950 transition-colors duration-300 flex flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 py-6">
            <FlashcardLearningView
              deck={activeDeck}
              onBack={() => setCurrentView('home')}
              onEditTopic={() => {
                setQuickTopic(activeDeck.topic || activeDeck.title);
                setCurrentView('create');
              }}
              isDark={isDark}
            />
          </div>
        </main>
      </AppLayout>
    );
  }

  /* ── Render: create mode ─ */
  if (currentView === 'create') {
    return (
      <AppLayout>
        <main className="min-h-[calc(100vh-64px)] w-full bg-gradient-to-b from-sky-100/70 via-blue-50/40 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-zinc-950 transition-colors duration-300">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="inline-flex items-center gap-2 mb-6 text-xs font-semibold rounded-full px-4 py-2 transition border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs hover:bg-zinc-50 cursor-pointer active:scale-95"
            >
              ← Back to Overview
            </button>
            <FlashcardGeneratorPanel
              onDeckGenerated={(newDeck) => {
                setActiveDeck(newDeck);
                setCurrentView('learn');
                refreshDecks();
                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              isDark={isDark}
              initialTopic={quickTopic}
              onBack={() => setCurrentView('home')}
              onUploadPdf={() => setCurrentView('pdf')}
            />
          </div>
        </main>
      </AppLayout>
    );
  }

  /* ── Render: pdf mode ─ */
  if (currentView === 'pdf') {
    return (
      <AppLayout>
        <main className="min-h-[calc(100vh-64px)] w-full bg-gradient-to-b from-sky-100/70 via-blue-50/40 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-zinc-950 transition-colors duration-300">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="inline-flex items-center gap-2 mb-6 text-xs font-semibold rounded-full px-4 py-2 transition border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs hover:bg-zinc-50 cursor-pointer active:scale-95"
            >
              ← Back to Overview
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 mb-2.5">
                <DocumentTextIcon className="h-4 w-4 text-blue-600 stroke-[1.7]" />
                PDF Document to Flashcards
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Transform PDF into Visual Flashcards
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-[54ch] font-normal leading-relaxed">
                Upload lecture notes, syllabus chapters, or research papers. Our AI extracts core concepts and pairs them with high-yield recall questions.
              </p>
            </div>

            {/* PDF Uploader Card */}
            <div className="rounded-3xl border border-white/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 shadow-xl shadow-blue-500/5 overflow-hidden p-6 sm:p-8">
              {!pdfText ? (
                <PdfUploader
                  onExtracted={(text: string, fileName: string) => {
                    setPdfText(text);
                    setPdfFileName(fileName.replace(/\.pdf$/i, ''));
                    setPdfError(null);
                  }}
                  onError={(message: string) => setPdfError(message)}
                  className="w-full"
                />
              ) : (
                <div className="space-y-6">
                  {/* Success badge */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/70">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0 stroke-[1.8]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 truncate">
                        {pdfFileName || 'PDF'} extracted successfully
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 font-normal">
                        {pdfText.length.toLocaleString()} characters ready for flashcard synthesis
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPdfText(''); setPdfFileName(''); setPdfError(null); }}
                      className="shrink-0 text-xs font-semibold text-emerald-800 dark:text-emerald-200 underline cursor-pointer"
                    >
                      Change File
                    </button>
                  </div>

                  {/* Card count slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        Number of Flashcards
                      </label>
                      <span className="rounded-lg bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                        {pdfCardCount} cards
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={5}
                      value={pdfCardCount}
                      onChange={(e) => setPdfCardCount(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {pdfError && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 shrink-0 stroke-[1.7]" />
                      <p className="text-xs text-red-700 dark:text-red-300">{pdfError}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateFromPdf}
                    disabled={pdfGenerating}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {pdfGenerating ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        <span>Synthesizing flashcards with AI…</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 stroke-[1.8]" />
                        <span>Generate {pdfCardCount} Flashcards from PDF</span>
                        <ArrowRightIcon className="h-4 w-4 stroke-[1.8]" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  /* ── Render: library mode ─ */
  if (currentView === 'library') {
    return (
      <AppLayout>
        <main className="min-h-[calc(100vh-64px)] w-full bg-gradient-to-b from-sky-100/70 via-blue-50/40 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-zinc-950 transition-colors duration-300">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="inline-flex items-center gap-2 mb-6 text-xs font-semibold rounded-full px-4 py-2 transition border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs hover:bg-zinc-50 cursor-pointer active:scale-95"
            >
              ← Back to Overview
            </button>
            <FlashcardLibraryView
              decks={decks}
              onSelectDeck={handleStartLearning}
              onCreateNew={() => setCurrentView('create')}
              onRefreshDecks={refreshDecks}
              isDark={isDark}
            />
          </div>
        </main>
      </AppLayout>
    );
  }

  /* ── Render: Home with the Reference Stacker Hero Page ─ */
  return (
    <AppLayout>
      <main className="min-h-[calc(100vh-64px)] w-full bg-gradient-to-b from-sky-100/80 via-blue-50/30 to-slate-50/80 dark:from-slate-950 dark:via-blue-950/20 dark:to-zinc-950 transition-colors duration-300">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">

          {/* ══════════════ 1. FLASHCARD HERO SECTION (EXACT REFERENCE DESIGN) ══════════════ */}
          <section className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#0284c7] p-6 sm:p-10 lg:p-12 shadow-2xl shadow-blue-500/20">

            {/* Subtle atmospheric glow lights */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-700/30 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

              {/* Left Column: Hero Copy & Value Props */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                  <SparklesIcon className="h-3.5 w-3.5 text-amber-300" />
                  <span>Smarter Active Recall</span>
                </div>

                {/* Hero Headline: Exam Preparation in Record Time! */}
                <h1 className="text-3xl sm:text-5xl lg:text-[50px] font-bold tracking-tight text-white leading-[1.12]">
                  Exam Preparation <br className="hidden sm:inline" />
                  <span className="text-sky-200">in Record Time!</span>
                </h1>

                {/* Clear, easy-to-understand value props */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-start gap-3 rounded-2xl bg-white/10 border border-white/15 p-3.5 backdrop-blur-xs">
                    <span className="text-2xl shrink-0 mt-0.5">🤖</span>
                    <p className="text-xs sm:text-sm font-normal text-white/95 leading-relaxed">
                      <strong className="font-semibold text-white">Our AI transforms</strong> your study material into exam questions with solutions.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-white/10 border border-white/15 p-3.5 backdrop-blur-xs">
                    <span className="text-2xl shrink-0 mt-0.5">🏆</span>
                    <p className="text-xs sm:text-sm font-normal text-white/95 leading-relaxed">
                      <strong className="font-semibold text-white">Master them</strong> by simply following your personalized learning plan.
                    </p>
                  </div>
                </div>

                {/* Pill CTA buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('create');
                      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-white text-zinc-900 font-semibold px-6 py-3 text-xs sm:text-sm hover:bg-zinc-100 transition shadow-lg active:scale-95 cursor-pointer"
                  >
                    <span>Create Flashcards Now</span>
                    <ArrowRightIcon className="h-4 w-4 stroke-[2]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('pdf');
                      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-3 text-xs sm:text-sm backdrop-blur-sm transition active:scale-95 cursor-pointer"
                  >
                    <DocumentTextIcon className="h-4 w-4 stroke-[1.8]" />
                    <span>Upload PDF / Notes</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 3D Fanned Visual Flashcards Preview with Orbital Rings */}
              <div className="lg:col-span-6 flex items-center justify-center">
                <FannedHeroCardsPreview
                  onSelectDeck={(topic) => handleQuickDeck(topic, 'Biology', 10)}
                />
              </div>

            </div>

          </section>

          {/* ══════════════ 2. SEARCH & PDF QUICK ACTION BAR ══════════════ */}
          <div className="rounded-3xl border border-white/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 p-4 sm:p-5 shadow-xl shadow-blue-500/5">
            <div className="flex flex-col md:flex-row items-center gap-3">

              {/* Search input with pill styling */}
              <form onSubmit={handleHeroSubmit} className="flex-1 w-full flex items-center rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 px-3.5 py-2.5 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-900 transition">
                <MagnifyingGlassIcon className="h-4 w-4 text-zinc-400 shrink-0 stroke-[1.8]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={quickTopic}
                  onChange={(e) => setQuickTopic(e.target.value)}
                  placeholder="Enter any syllabus chapter or concept to generate flashcards…"
                  className="flex-1 bg-transparent px-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 font-normal"
                />
                <button
                  type="submit"
                  disabled={!quickTopic.trim()}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <SparklesIcon className="h-3.5 w-3.5 stroke-[1.8]" />
                  <span>Generate</span>
                </button>
              </form>

              {/* Or PDF button */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('pdf');
                    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/80 hover:bg-blue-50 hover:border-blue-300 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition cursor-pointer shadow-2xs"
                >
                  <DocumentTextIcon className="h-4 w-4 text-blue-600 stroke-[1.7]" />
                  <span>Upload PDF Lecture Notes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentView('library')}
                  className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/80 hover:bg-zinc-100 dark:bg-zinc-800/60 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition cursor-pointer shadow-2xs"
                >
                  <RectangleStackIcon className="h-4 w-4 text-zinc-400 stroke-[1.7]" />
                  <span>All ({decks.length})</span>
                </button>
              </div>

            </div>
          </div>

          {/* ══════════════ 3. CURATED DECKS (SPACIOUS 3-COLUMN BENTO GRID) ══════════════ */}
          <div>
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Explore Curated Study Decks
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                    Click any deck to start visual active recall practice with spaced repetition.
                  </p>
                </div>
                <span className="text-xs font-medium text-zinc-400 shrink-0">
                  Showing {filteredDecks.length} study decks
                </span>
              </div>

              {/* Subject Filter Pills (Dedicated clean row, no awkward wrapping) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {SUBJECT_FILTERS.map((sub) => {
                  const isActive = subjectFilter === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubjectFilter(sub)}
                      className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-xs'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Decks Grid: Generous 3-Column Layout (Spacious, Zero Overflow) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDecks.map((deck) => (
                <BentoDeckCard
                  key={deck.id}
                  deck={deck}
                  onStudy={() => handleStartLearning(deck)}
                  onPreview={() => handleStartLearning(deck)}
                  isDark={isDark}
                />
              ))}

              {/* Create Your Own Deck Card */}
              <div
                onClick={() => setCurrentView('create')}
                className="group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200/90 dark:border-zinc-800 hover:border-blue-500/60 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 bg-white/60 dark:bg-zinc-900/40 p-8 text-center transition-all cursor-pointer min-h-[360px]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 group-hover:scale-110 transition-transform mb-4 shadow-xs">
                  <PlusIcon className="h-7 w-7 stroke-[1.8]" />
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  Create Custom Deck
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[26ch] font-normal leading-relaxed mb-4">
                  AI-generated from your syllabus notes with verified educational diagrams
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3.5 py-1.5 text-xs font-semibold">
                  <SparklesIcon className="h-3.5 w-3.5" /> Start Generating
                </span>
              </div>
            </div>
          </div>

          {/* ══════════════ 4. RECALL SCIENCE WORKFLOW (4 STEPS) ══════════════ */}
          <div className="rounded-3xl border border-white/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 p-6 sm:p-8 shadow-xl shadow-blue-500/5">
            <div className="text-center max-w-xl mx-auto mb-6">
              <span className="rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-3 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                Cognitive Science
              </span>
              <h3 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                How Visual Active Recall Works
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                A 4-step evidence-based loop calibrated to peak your memory on test day.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Inspect Concept', desc: 'Study the verified scientific diagram before flipping.', color: 'text-blue-600', icon: EyeIcon },
                { step: '2', title: 'Active Recall', desc: 'Attempt to derive the answer from memory without hints.', color: 'text-indigo-600', icon: AcademicCapIcon },
                { step: '3', title: 'Self-Grade', desc: 'Rate your recall as Again, Hard, Good, or Easy.', color: 'text-amber-500', icon: BoltIcon },
                { step: '4', title: 'Spaced Repetition', desc: 'Weak cards resurface at optimal forgetting intervals.', color: 'text-emerald-600', icon: ShieldCheckIcon },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.step}
                    className="rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-800/40 p-4 text-center"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 shadow-2xs mb-2.5">
                      <Icon className={`h-5 w-5 ${s.color} stroke-[1.7]`} />
                    </div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.step}. {s.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-normal">
                      {s.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <PublicFooter />
      </main>
    </AppLayout>
  );
}
