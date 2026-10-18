'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import type { FlashcardDeck } from '@/lib/flashcards/types';
import { getLocalDecks, STARTER_DECKS, getDeckProgress } from '@/lib/flashcards/storage';
import { useAppTheme } from '@/hooks/useAppTheme';
import FlashcardLearningView from '@/components/flashcards/FlashcardLearningView';
import FlashcardGeneratorPanel from '@/components/flashcards/FlashcardGeneratorPanel';
import FlashcardLibraryView from '@/components/flashcards/FlashcardLibraryView';
import PublicFooter from '@/components/PublicFooter';
import {
  Sparkles,
  BookOpen,
  Brain,
  CheckCircle2,
  ArrowRight,
  Search,
  Play,
  Eye,
  Clock,
  ChevronDown,
  BarChart2,
  Star,
  Layers,
  GraduationCap,
} from 'lucide-react';

/* ─── Physical Card Design Tokens (Preserved for Study Card identity) ─── */
const PAPER = '#F5EBD3';
const TERRACOTTA = '#BD4438';
const DUSTY_ROSE = '#D77C79';
const DARK_INK = '#49362E';
const CANVAS = '#FAF8F3';

/* Fine graph-paper grid SVG for physical card previews */
const GRID_LIGHT = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23E4D7B8' stroke-width='0.7'/%3E%3C/svg%3E")`;
const GRID_DARK = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%233a3010' stroke-width='0.7' opacity='0.6'/%3E%3C/svg%3E")`;

/* ─── Physical Flashcard — preview card component in hero fan ─── */
function PhysicalCard({
  card,
  style,
  onClick,
  isDark,
  accent,
  iscover,
  deckSubject,
}: {
  card?: { front: string; scientificName?: string; categoryPill?: string; back?: string; image?: { url: string; alt: string } };
  style: React.CSSProperties;
  onClick: () => void;
  isDark: boolean;
  accent: string;
  iscover?: boolean;
  deckSubject?: string;
}) {
  const [imgErr, setImgErr] = useState(false);

  const paper = isDark ? '#2a1f12' : PAPER;
  const grid = isDark ? GRID_DARK : GRID_LIGHT;
  const border = isDark ? `${accent}66` : accent;
  const subInk = isDark ? '#a89070' : '#7a5c4a';

  /* Multi-layered physical card drop-shadow */
  const shadow = isDark
    ? '0 2px 4px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5), 0 18px 48px rgba(0,0,0,0.35)'
    : '0 2px 4px rgba(80,40,20,0.18), 0 8px 24px rgba(80,40,20,0.13), 0 18px 48px rgba(80,40,20,0.09)';

  const base: React.CSSProperties = {
    ...style,
    background: paper,
    backgroundImage: grid,
    borderColor: border,
    boxShadow: shadow,
  };

  /* ── Cover / title card ── */
  if (iscover) {
    return (
      <div
        className="group absolute cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-3 hover:!z-50"
        style={base}
        onClick={onClick}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-5 text-center">
          <p className="text-[8px] font-bold uppercase tracking-[0.22em]" style={{ color: accent, opacity: 0.8 }}>
            Organize knowledge:
          </p>
          <div className="w-full rounded-xl px-3 py-2.5 shadow-xs" style={{ background: accent }}>
            <p className="text-[13px] font-black uppercase tracking-widest text-white leading-tight">
              {deckSubject || 'Study'}
            </p>
          </div>
          <div className="w-full rounded-xl px-2 py-1.5" style={{ background: `${accent}bb` }}>
            <p className="text-[10px] font-bold italic text-white">flash cards</p>
          </div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.18em] mt-1" style={{ color: accent, opacity: 0.5 }}>
            e-Mate AI
          </p>
        </div>
      </div>
    );
  }

  /* ── Content card ── */
  return (
    <div
      className="group absolute cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-4 hover:!z-50"
      style={base}
      onClick={onClick}
    >
      <div className="flex h-full w-full flex-col">
        {/* Header band */}
        <div
          className="flex items-center justify-center px-2.5 py-2 shrink-0"
          style={{ background: accent }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white text-center leading-snug line-clamp-1">
            {card?.categoryPill || card?.front?.slice(0, 22) || 'Concept'}
          </p>
        </div>

        {/* Illustration */}
        <div className="flex-1 flex items-center justify-center px-2.5 py-1 overflow-hidden min-h-[80px]">
          {card?.image && !imgErr ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={card.image.url}
              alt={card.image.alt || card.front}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgErr(true)}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
              style={{ filter: isDark ? 'brightness(0.85) saturate(0.9)' : 'sepia(0.16) contrast(1.06)' }}
            />
          ) : (
            <div className="opacity-20 flex items-center justify-center">
              <BookOpen size={26} style={{ color: accent }} />
            </div>
          )}
        </div>

        {/* Term label */}
        <div className="mx-2.5 mb-2 rounded-xl px-2 py-1 text-center shrink-0" style={{ background: accent }}>
          <p className="text-[9px] font-black text-white tracking-wide leading-tight line-clamp-1">
            {card?.scientificName || card?.front?.split(' ').slice(0, 4).join(' ') || ''}
          </p>
        </div>

        {/* Back text snippet */}
        <p
          className="px-3 pb-3 text-[7.5px] leading-relaxed line-clamp-3 font-medium"
          style={{ color: subInk }}
        >
          {card?.back || ''}
        </p>
      </div>
    </div>
  );
}

/* ─── Featured Deck Hero Panel ─────────────────────────────────── */
function FeaturedDeckPanel({
  deck,
  onStartLearning,
  onPreview,
  isDark,
}: {
  deck: FlashcardDeck;
  onStartLearning: () => void;
  onPreview: () => void;
  isDark: boolean;
}) {
  const cards = deck.cards || [];
  const contentCards = cards.slice(0, 3);
  const estimatedMin = Math.ceil((deck.cardCount || 8) * 0.6);

  /* Botanical/terracotta palette for the actual physical study cards */
  const accents = [TERRACOTTA, DUSTY_ROSE, '#2471a3', '#16a34a'];

  const CARD_W = 142;
  const CARD_H = 216;

  // Layered physical card fanning configuration (4 cards: Cover + 3 content cards)
  const fanConfig = [
    { rot: -11, x: 14, y: 26, z: 10 },
    { rot: -4, x: 92, y: 16, z: 11 },
    { rot: 3, x: 168, y: 12, z: 12 },
    { rot: 10, x: 244, y: 22, z: 13 },
  ];

  const canvasBg = isDark ? '#14100c' : CANVAS;

  const isBotanical = /plant|botan|herb|flora|pharmacognos|medicinal/i.test(
    (deck.subject || '') + ' ' + (deck.title || '') + ' ' + (deck.topic || '')
  );

  const descriptionText =
    deck.topic
      ? `Explore core concepts of ${deck.title} with active recall, ${
          isBotanical ? 'verified botanical diagrams' : 'visual conceptual diagrams'
        }, and spaced repetition.`
      : 'Master every concept with illustrated cards, active recall, and science-backed review.';

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/80 shadow-xs backdrop-blur-sm transition-all">
      <div className="flex flex-col lg:flex-row items-stretch" style={{ minHeight: 290 }}>
        {/* ── LEFT: Native e-Mate AI Panel ── */}
        <div className="flex flex-col justify-center px-6 py-5 sm:px-8 sm:py-6 lg:w-[46%] xl:w-[44%] shrink-0">
          {/* Subject + difficulty badges matching e-Mate AI design system */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              <Layers size={11} />
              {deck.subject}
            </span>
            <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
              {deck.difficulty}
            </span>
          </div>

          {/* Heading — Modern clean sans-serif matching AI Topic Chat */}
          <h2 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans mb-2.5 leading-snug">
            {deck.title}
          </h2>

          {/* Supporting Description */}
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 mb-3.5 max-w-[48ch]">
            {descriptionText}
          </p>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
            {[
              { icon: <Layers size={13} />, label: `${deck.cardCount} cards` },
              { icon: <Clock size={13} />, label: `${estimatedMin} min` },
              { icon: <Eye size={13} />, label: 'Visual learning' },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                {icon} {label}
              </span>
            ))}
          </div>

          {/* CTAs matching AI Topic Chat Button Variants */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Action — e-Mate Blue */}
            <button
              type="button"
              onClick={onStartLearning}
              id="hero-start-learning"
              className="inline-flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Play size={13} fill="currentColor" />
              <span>Start Learning</span>
            </button>

            {/* Secondary Action — Subtle Outlined Neutral */}
            <button
              type="button"
              onClick={onPreview}
              id="hero-preview-deck"
              className="inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Eye size={13} />
              <span>Preview Deck</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT: Physical card stack canvas ── */}
        <div
          className="relative flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden border-t lg:border-t-0 lg:border-l border-zinc-200/60 dark:border-zinc-800/60"
          style={{
            background: canvasBg,
            minHeight: 250,
            boxShadow: isDark
              ? 'inset 0 0 60px rgba(0,0,0,0.5)'
              : 'inset 0 0 60px rgba(80,40,20,0.05)',
          }}
        >
          <div
            className="relative"
            style={{
              width: 400,
              height: 254,
              maxWidth: '100%',
            }}
          >
            {/* Cover Card */}
            <PhysicalCard
              iscover
              isDark={isDark}
              accent={accents[0]}
              deckSubject={deck.subject}
              onClick={onStartLearning}
              style={{
                position: 'absolute',
                width: CARD_W,
                height: CARD_H,
                left: fanConfig[0].x,
                top: fanConfig[0].y,
                transform: `rotate(${fanConfig[0].rot}deg)`,
                zIndex: fanConfig[0].z,
              }}
            />

            {/* Content Cards */}
            {contentCards.map((c, i) => (
              <PhysicalCard
                key={c.id || i}
                card={c}
                isDark={isDark}
                accent={accents[(i + 1) % accents.length]}
                deckSubject={deck.subject}
                onClick={onStartLearning}
                style={{
                  position: 'absolute',
                  width: CARD_W,
                  height: CARD_H,
                  left: fanConfig[i + 1].x,
                  top: fanConfig[i + 1].y,
                  transform: `rotate(${fanConfig[i + 1].rot}deg)`,
                  zIndex: fanConfig[i + 1].z,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Subject filter options ─── */
const SUBJECT_FILTERS = ['All subjects', 'Biology', 'Computer Science', 'Medicine', 'Mathematics', 'Physics'];

/* ─── Deck grid card ────────────────────────────────────────────── */
function DeckGridCard({
  deck,
  onClick,
  isDark,
}: {
  deck: FlashcardDeck;
  onClick: () => void;
  isDark: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const thumbnail = deck.thumbnailUrl || deck.cards?.[0]?.image?.url;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 shadow-2xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail */}
      <div
        className={`relative h-[140px] w-full overflow-hidden flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800/60 ${
          isDark ? 'bg-zinc-950/40' : 'bg-gradient-to-br from-zinc-50 to-zinc-100/60'
        }`}
      >
        {thumbnail && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnail}
            alt={deck.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`flex flex-col items-center gap-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            <BookOpen size={28} />
            <span className="text-[10px] font-medium">Visual study deck</span>
          </div>
        )}

        {/* Subject badge */}
        <span className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
          {deck.subject}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-bold leading-snug line-clamp-2 mb-1 text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {deck.title}
        </h3>
        <p className="text-[11px] line-clamp-2 leading-relaxed flex-1 text-zinc-500 dark:text-zinc-400">
          {deck.topic}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-medium">
            <span className="inline-flex items-center gap-1">
              <Layers size={11} />
              {deck.cardCount} cards
            </span>
            <span className="inline-flex items-center gap-1 capitalize">
              <GraduationCap size={11} />
              {deck.difficulty}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
            Study deck <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function AIFlashcardGeneratorPage() {
  const { isDark } = useAppTheme();
  const [decks, setDecks] = useState<FlashcardDeck[]>(STARTER_DECKS);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'learn' | 'create' | 'library'>('home');
  const [quickTopic, setQuickTopic] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All subjects');
  const [difficultyFilter, setDifficultyFilter] = useState('Any level');
  const [cardsFilter, setCardsFilter] = useState('10 cards');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showDiffDropdown, setShowDiffDropdown] = useState(false);
  const [showCardsDropdown, setShowCardsDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const refreshDecks = () => setDecks(getLocalDecks());

  useEffect(() => {
    refreshDecks();
    const handler = () => refreshDecks();
    window.addEventListener('emate-flashcards-changed', handler);

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowSubjectDropdown(false);
        setShowDiffDropdown(false);
        setShowCardsDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSubjectDropdown(false);
        setShowDiffDropdown(false);
        setShowCardsDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('emate-flashcards-changed', handler);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const featuredDeck = decks[0] || STARTER_DECKS[0];

  const filteredDecks = decks.filter((d) => {
    if (subjectFilter !== 'All subjects' && d.subject !== subjectFilter) return false;
    return true;
  });

  const handleStartLearning = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setCurrentView('learn');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleDeckCreated = (deck: FlashcardDeck) => {
    refreshDecks();
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

  /* ── Render: learn mode ─ */
  if (currentView === 'learn' && activeDeck) {
    return (
      <AppLayout>
        <main
          className="min-h-[calc(100dvh-64px)] w-full transition-colors duration-300 flex flex-col overflow-y-auto"
          style={{
            background: isDark ? '#080809' : '#f9f9fb',
            color: isDark ? '#ffffff' : '#000000',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 py-4">
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
        <main
          className="min-h-[calc(100vh-64px)] w-full transition-colors duration-300"
          style={{
            background: isDark ? '#080809' : '#f9f9fb',
            color: isDark ? '#ffffff' : '#000000',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="inline-flex items-center gap-2 mb-6 text-xs font-semibold rounded-full px-4 py-2 transition border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs cursor-pointer active:scale-95"
            >
              ← Back to Overview
            </button>
            <FlashcardGeneratorPanel
              onDeckGenerated={handleDeckCreated}
              isDark={isDark}
              initialTopic={quickTopic}
            />
          </div>
        </main>
      </AppLayout>
    );
  }

  /* ── Render: library mode ─ */
  if (currentView === 'library') {
    return (
      <AppLayout>
        <main
          className="min-h-[calc(100vh-64px)] w-full transition-colors duration-300"
          style={{
            background: isDark ? '#080809' : '#f9f9fb',
            color: isDark ? '#ffffff' : '#000000',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="inline-flex items-center gap-2 mb-6 text-xs font-semibold rounded-full px-4 py-2 transition border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs cursor-pointer active:scale-95"
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

  /* ── Render: home ─ */
  return (
    <AppLayout>
      <main
        className="min-h-[calc(100vh-64px)] w-full transition-colors duration-300"
        style={{
          background: isDark ? '#080809' : '#f9f9fb',
          color: isDark ? '#ffffff' : '#000000',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="mx-auto w-full max-w-screen-2xl px-6 py-4 sm:py-6 lg:px-10 xl:px-14 space-y-6">
          {/* ══════════════ HERO ══════════════ */}
          <section className="text-center pt-0 pb-0">
            {/* 30px top spacer */}
            <div className="h-[30px]" />

            {/* Headline — tighter, one-liner on wide screens */}
            <h1 className="text-2xl sm:text-[32px] md:text-[36px] lg:text-[40px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1] mb-2 lg:whitespace-nowrap">
              Learn visually.{' '}
              <span className="text-blue-600 dark:text-blue-500">Remember longer.</span>
            </h1>

            {/* Supporting description */}
            <p className="mx-auto max-w-xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 mb-4">
              Turn any topic into visual flashcards. Learn, recall, and master concepts with AI-powered study cards.
            </p>

            {/* Topic Input with native e-Mate study composer styling */}
            <form onSubmit={handleHeroSubmit} className="mx-auto max-w-3xl">
              <div
                className="flex items-center rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-2xs transition-all overflow-hidden focus-within:shadow-md focus-within:border-blue-500/60 dark:focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/15 p-1.5 sm:p-2"
                style={{ minHeight: 52 }}
              >
                <div className="flex items-center pl-3.5 shrink-0 text-zinc-400 dark:text-zinc-500">
                  <Search size={16} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={quickTopic}
                  onChange={(e) => setQuickTopic(e.target.value)}
                  placeholder="What are you studying today?"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!quickTopic.trim()}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Create flashcards</span>
                  <ArrowRight size={13} className="ml-0.5" />
                </button>
              </div>

              {/* Configuration Controls — native e-Mate dropdown pills */}
              <div className="flex items-center gap-2 mt-3 justify-center flex-wrap">
                {/* Subject dropdown */}
                <div className="relative dropdown-container">
                  <button
                    type="button"
                    id="hero-filter-subject"
                    onClick={() => {
                      setShowSubjectDropdown((p) => !p);
                      setShowDiffDropdown(false);
                      setShowCardsDropdown(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs transition-all cursor-pointer"
                  >
                    <BookOpen size={12} className="text-zinc-400" />
                    <span>Subject:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{subjectFilter}</span>
                    <ChevronDown size={11} className="text-zinc-400" />
                  </button>
                  {showSubjectDropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-xl backdrop-blur-md p-1.5 min-w-[160px] text-xs">
                      {SUBJECT_FILTERS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSubjectFilter(opt);
                            setShowSubjectDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-between ${
                            subjectFilter === opt
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span>{opt}</span>
                          {subjectFilter === opt && <CheckCircle2 size={12} className="text-blue-600 dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Difficulty dropdown */}
                <div className="relative dropdown-container">
                  <button
                    type="button"
                    id="hero-filter-difficulty"
                    onClick={() => {
                      setShowDiffDropdown((p) => !p);
                      setShowSubjectDropdown(false);
                      setShowCardsDropdown(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs transition-all cursor-pointer"
                  >
                    <BarChart2 size={12} className="text-zinc-400" />
                    <span>Difficulty:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{difficultyFilter}</span>
                    <ChevronDown size={11} className="text-zinc-400" />
                  </button>
                  {showDiffDropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-xl backdrop-blur-md p-1.5 min-w-[145px] text-xs">
                      {['Any level', 'Beginner', 'Intermediate', 'Advanced'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setDifficultyFilter(opt);
                            setShowDiffDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-between ${
                            difficultyFilter === opt
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span>{opt}</span>
                          {difficultyFilter === opt && <CheckCircle2 size={12} className="text-blue-600 dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cards count dropdown */}
                <div className="relative dropdown-container">
                  <button
                    type="button"
                    id="hero-filter-cards"
                    onClick={() => {
                      setShowCardsDropdown((p) => !p);
                      setShowSubjectDropdown(false);
                      setShowDiffDropdown(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs transition-all cursor-pointer"
                  >
                    <Layers size={12} className="text-zinc-400" />
                    <span>Cards:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{cardsFilter}</span>
                    <ChevronDown size={11} className="text-zinc-400" />
                  </button>
                  {showCardsDropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-xl backdrop-blur-md p-1.5 min-w-[135px] text-xs">
                      {['5 cards', '10 cards', '15 cards', '20 cards'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setCardsFilter(opt);
                            setShowCardsDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-between ${
                            cardsFilter === opt
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span>{opt}</span>
                          {cardsFilter === opt && <CheckCircle2 size={12} className="text-blue-600 dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </section>

          {/* ══════════════ FEATURED DECK ══════════════ */}
          <section>
            <FeaturedDeckPanel
              deck={featuredDeck}
              onStartLearning={() => handleStartLearning(featuredDeck)}
              onPreview={() => handleStartLearning(featuredDeck)}
              isDark={isDark}
            />
          </section>

          {/* ══════════════ EXPLORE DECKS ══════════════ */}
          <section>
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Explore study decks
                </h2>
                <p className="text-xs mt-0.5 text-zinc-500 dark:text-zinc-400">
                  Browse pre-made decks or create your own. Find the right topic for your goals.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentView('library')}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <span>View all ({decks.length})</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Subject filter pills — consistent with e-Mate selection styles */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {SUBJECT_FILTERS.map((sub) => {
                const isActive = subjectFilter === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubjectFilter(sub)}
                    className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs'
                        : 'bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 font-medium'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>

            {/* Deck grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecks.slice(0, 6).map((deck) => (
                <DeckGridCard
                  key={deck.id}
                  deck={deck}
                  onClick={() => handleStartLearning(deck)}
                  isDark={isDark}
                />
              ))}

              {/* Create your own CTA card */}
              <div
                onClick={() => setCurrentView('create')}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 bg-zinc-50/50 dark:bg-zinc-900/30 cursor-pointer transition-all min-h-[220px] p-6 text-center group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 group-hover:scale-110 transition-transform">
                  <Sparkles size={20} />
                </div>
                <p className="text-sm font-bold mb-1 text-zinc-800 dark:text-zinc-200">
                  Create your own deck
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-[26ch] leading-relaxed">
                  AI-generated from any topic with verified educational visuals
                </p>
              </div>
            </div>
          </section>

          {/* ══════════════ HOW IT WORKS ══════════════ */}
          <section className="rounded-3xl p-8 sm:p-10 text-center border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 shadow-xs backdrop-blur-sm">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">
              Make every review count
            </h2>
            <p className="text-xs mb-8 text-zinc-500 dark:text-zinc-400">
              A simple science-backed loop that turns recall into mastery
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                {
                  num: '1',
                  icon: <BookOpen size={20} />,
                  title: 'Learn',
                  desc: 'See clear visual explanations',
                  color: '#2563eb',
                },
                {
                  num: '2',
                  icon: <Brain size={20} />,
                  title: 'Recall',
                  desc: 'Answer before revealing',
                  color: '#4f46e5',
                },
                {
                  num: '3',
                  icon: <Star size={20} />,
                  title: 'Rate',
                  desc: 'Mark Again, Hard, Good or Easy',
                  color: '#d97706',
                },
                {
                  num: '4',
                  icon: <CheckCircle2 size={20} />,
                  title: 'Master',
                  desc: 'Revisit your weakest concepts',
                  color: '#059669',
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex flex-col items-center p-5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl mb-3"
                    style={{ background: `${step.color}15`, color: step.color }}
                  >
                    {step.icon}
                  </div>
                  <p className="text-xs font-bold mb-0.5 text-zinc-900 dark:text-zinc-100">
                    {step.num}. {step.title}
                  </p>
                  <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentView('create')}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Generate my deck</span>
              <ArrowRight size={13} />
            </button>
          </section>
        </div>
        <PublicFooter />
      </main>
    </AppLayout>
  );
}
