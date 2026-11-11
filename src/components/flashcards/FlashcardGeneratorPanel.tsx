'use client';

import React, { useState } from 'react';
import type {
  FlashcardDeck,
  FlashcardDifficulty,
  FlashcardLearningMode,
  FlashcardGenerationRequest,
  EducationalImage,
} from '@/lib/flashcards/types';
import { saveLocalDeck } from '@/lib/flashcards/storage';
import ImageBrowserModal from './ImageBrowserModal';

// Premium Heroicons
import {
  SparklesIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  PlayIcon as PlayIconSolid,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';

interface FlashcardGeneratorPanelProps {
  onDeckGenerated: (deck: FlashcardDeck) => void;
  isDark?: boolean;
  initialTopic?: string;
  onBack?: () => void;
  onUploadPdf?: () => void;
}

const QUICK_TOPICS = [
  { name: 'Human Nervous System', category: 'Biology' },
  { name: 'Cellular Mitosis & Stages', category: 'Biology' },
  { name: 'Data Structures: Trees & Graphs', category: 'CS' },
  { name: 'Operating System: Deadlocks', category: 'CS' },
  { name: 'Organic Reaction Mechanisms', category: 'Chemistry' },
  { name: 'Medicinal Plants & Botany', category: 'Medicine' },
];

const CARD_COUNT_OPTIONS = [
  { count: 5, label: '5 Cards', time: '~4m', desc: 'Quick review sprint' },
  { count: 8, label: '8 Cards', time: '~7m', desc: 'Standard chapter recall' },
  { count: 12, label: '12 Cards', time: '~10m', desc: 'Comprehensive mastery' },
  { count: 16, label: '16 Cards', time: '~15m', desc: 'Full exam cram' },
];

const DIFFICULTY_OPTIONS: { id: FlashcardDifficulty; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'Foundations & core definitions' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Standard syllabus problem sets' },
  { id: 'advanced', label: 'Advanced', desc: 'High-yield edge cases & synthesis' },
];

const MODE_OPTIONS: { id: FlashcardLearningMode; label: string; desc: string; icon: string }[] = [
  { id: 'visual_learning', label: 'Visual Diagrams', desc: 'Verified scientific & anatomical figures', icon: '🎨' },
  { id: 'conceptual', label: 'Conceptual', desc: 'Mechanisms, causes & derivations', icon: '💡' },
  { id: 'definitions', label: 'Definitions', desc: 'Formulas, laws & scientific terminology', icon: '📖' },
  { id: 'exam_revision', label: 'Exam Cram', desc: 'High-probability test questions', icon: '⚡' },
];

export default function FlashcardGeneratorPanel({
  onDeckGenerated,
  isDark = false,
  initialTopic = '',
  onBack,
  onUploadPdf,
}: FlashcardGeneratorPanelProps) {
  const [topic, setTopic] = useState(initialTopic);

  React.useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const [subject, setSubject] = useState('');
  const [count, setCount] = useState<number>(8);
  const [difficulty, setDifficulty] = useState<FlashcardDifficulty>('intermediate');
  const [mode, setMode] = useState<FlashcardLearningMode>('visual_learning');
  const [studyMaterial, setStudyMaterial] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [examDate, setExamDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Deck review state after generation
  const [generatedDeck, setGeneratedDeck] = useState<FlashcardDeck | null>(null);
  const [activeCardIndexForBrowser, setActiveCardIndexForBrowser] = useState<number | null>(null);

  const LOADING_STEPS = [
    'Synthesizing curriculum concepts & high-yield prompts…',
    'Querying verified educational archives for accurate figures…',
    'Aligning diagrams with spaced repetition intervals…',
    'Finalizing deck with interactive self-test solutions…',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setLoadingStep(0);
    setGeneratedDeck(null);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2200);

    try {
      const payload: FlashcardGenerationRequest = {
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        count,
        difficulty,
        learningMode: mode,
        studyMaterial: studyMaterial.trim() || undefined,
        examDate: examDate || undefined,
      };

      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Generation failed (HTTP ${res.status})`);
      }

      const { deck } = await res.json();
      if (!deck || !deck.cards || deck.cards.length === 0) {
        throw new Error('No flashcards were created. Please try a more specific topic.');
      }

      // Save locally & display review mode
      saveLocalDeck(deck);
      setGeneratedDeck(deck);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('[FlashcardGeneratorPanel] Error:', err);
      setError(err?.message || 'Failed to generate flashcard deck. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCardImage = (newImage: EducationalImage) => {
    if (!generatedDeck || activeCardIndexForBrowser === null) return;

    const updatedCards = [...generatedDeck.cards];
    updatedCards[activeCardIndexForBrowser] = {
      ...updatedCards[activeCardIndexForBrowser],
      image: newImage,
    };

    const updatedDeck: FlashcardDeck = {
      ...generatedDeck,
      cards: updatedCards,
      thumbnailUrl: activeCardIndexForBrowser === 0 ? newImage.url : generatedDeck.thumbnailUrl,
      updatedAt: new Date().toISOString(),
    };

    setGeneratedDeck(updatedDeck);
    saveLocalDeck(updatedDeck);
  };

  const activeCardForBrowser =
    generatedDeck && activeCardIndexForBrowser !== null
      ? generatedDeck.cards[activeCardIndexForBrowser]
      : null;

  // ─── If deck was just generated, show the Interactive Image & Card Review View ───
  if (generatedDeck) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-3xl p-6 sm:p-8 md:p-10 border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 shadow-xl shadow-blue-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-100 dark:border-zinc-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <CheckBadgeIcon className="h-4 w-4 text-emerald-600" />
              <span>Study Deck Ready</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {generatedDeck.title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">
              {generatedDeck.cards.length} cards generated. Review figures or swap illustrations before practicing.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onDeckGenerated(generatedDeck)}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
          >
            <PlayIconSolid className="h-4 w-4" />
            <span>Start Practice</span>
            <ArrowRightIcon className="h-3.5 w-3.5 stroke-[2]" />
          </button>
        </div>

        {/* Cards Review Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6 max-h-[520px] overflow-y-auto p-1">
          {generatedDeck.cards.map((card, idx) => (
            <div
              key={card.id || idx}
              className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-medium">
                  <span>Card {idx + 1}</span>
                  <span className="capitalize">{card.categoryPill || 'Concept'}</span>
                </div>

                {/* Image Frame */}
                <div className="relative h-32 w-full rounded-xl overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center group mb-2.5">
                  {card.image?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={card.image.url}
                      alt={card.image.alt || card.front}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 p-2 text-center">
                      <PhotoIcon className="h-6 w-6 opacity-40 mb-1" />
                      <span className="text-[10px]">Educational figure</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveCardIndexForBrowser(idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition-opacity backdrop-blur-2xs cursor-pointer"
                  >
                    <span>Browse Figure</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-semibold line-clamp-2 text-zinc-900 dark:text-zinc-100">
                  {card.scientificName || card.front}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 font-normal">
                  {card.back}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Verified Visual</span>
                <button
                  type="button"
                  onClick={() => setActiveCardIndexForBrowser(idx)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Change Figure
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for browsing/swapping images */}
        {activeCardForBrowser && (
          <ImageBrowserModal
            isOpen={activeCardIndexForBrowser !== null}
            onClose={() => setActiveCardIndexForBrowser(null)}
            initialQuery={
              activeCardForBrowser.imageQuery ||
              activeCardForBrowser.scientificName ||
              activeCardForBrowser.front
            }
            conceptName={activeCardForBrowser.scientificName || activeCardForBrowser.front}
            topic={generatedDeck.topic}
            currentImageUrl={activeCardForBrowser.image?.url}
            isDark={isDark}
            onSelectImage={handleUpdateCardImage}
          />
        )}
      </div>
    );
  }

  // ─── Main Deck Creation Experience (Faithfully Matching Target Screenshot Reference) ───
  return (
    <div className="mx-auto w-full max-w-4xl space-y-7">

      {/* ════ TOP HERO CARD: Obsidian Dark with 3D Luminous Blue Ribbon (Faithfully matching Reference) ════ */}
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] bg-[#07090E] p-8 sm:p-12 text-white shadow-2xl border border-zinc-800/80">

        {/* Deep ambient radial glow backdrops */}
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-blue-600/35 blur-[100px]" />
        <div className="pointer-events-none absolute top-4 right-1/4 h-64 w-64 rounded-full bg-sky-500/25 blur-[85px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-indigo-600/25 blur-[90px]" />

        {/* Fluid 3D glowing electric blue neon ribbon wave (multi-pass Bézier curve) */}
        <svg
          className="pointer-events-none absolute right-0 bottom-0 top-0 w-full sm:w-[500px] lg:w-[540px] h-full opacity-85 mix-blend-screen"
          viewBox="0 0 540 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="neonBlueGlowGrad" x1="40" y1="400" x2="500" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#2563eb" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="neonCyanGlowGrad" x1="120" y1="380" x2="480" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="45%" stopColor="#60a5fa" />
              <stop offset="75%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <filter id="ribbonSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Deep diffused ambient blur stroke */}
          <path
            d="M 60 400 C 140 320 220 260 280 180 C 340 100 420 80 490 140 C 540 180 500 290 390 320 C 300 350 200 280 240 180 C 270 110 370 70 480 90"
            stroke="url(#neonBlueGlowGrad)"
            strokeWidth="56"
            strokeLinecap="round"
            className="opacity-45 blur-md"
          />

          {/* Main 3D ribbon body */}
          <path
            d="M 60 400 C 140 320 220 260 280 180 C 340 100 420 80 490 140 C 540 180 500 290 390 320 C 300 350 200 280 240 180 C 270 110 370 70 480 90"
            stroke="url(#neonCyanGlowGrad)"
            strokeWidth="38"
            strokeLinecap="round"
            filter="url(#ribbonSoftGlow)"
          />

          {/* Sharp silky specular crest sheen */}
          <path
            d="M 70 390 C 145 315 225 255 285 178 C 345 102 422 84 485 138 C 530 174 495 278 395 308 C 310 338 215 272 248 178 C 278 112 372 74 478 92"
            stroke="#ffffff"
            strokeWidth="4.5"
            strokeLinecap="round"
            className="opacity-80"
          />
        </svg>

        <div className="relative z-10 max-w-xl">
          {/* Top Pill Badge (Directly matching "Contact" pill in reference) */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md mb-6">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] shadow-xs">
              ✦
            </span>
            <span>Study Deck Architect</span>
          </div>

          {/* Editorial Display Heading in Classic Serif (Matching Reference Headline) */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-normal tracking-tight text-white leading-[1.16]">
            Don&apos;t just memorize. <br />
            Connect with concepts today.
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-[15px] font-normal leading-relaxed text-zinc-300/85">
            Whether you&apos;re preparing for high-yield university exams, USMLE, licensing tests, or mastering complex topics, e-Mate transforms your curriculum into active-recall cards with verified diagrams.
          </p>

          {/* Action Pills inside Hero */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#deck-specifications"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-6 py-2.5 text-xs sm:text-sm font-medium text-white backdrop-blur-md transition active:scale-95 cursor-pointer shadow-sm"
            >
              <span>Build Flashcards</span>
              <span className="text-xs">↓</span>
            </a>

            {onUploadPdf && (
              <button
                type="button"
                onClick={onUploadPdf}
                className="inline-flex items-center gap-2 rounded-full bg-white text-zinc-950 px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-zinc-100 transition shadow-md active:scale-95 cursor-pointer"
              >
                <span>Upload PDF Notes</span>
                <ArrowRightIcon className="h-3.5 w-3.5 stroke-[2]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════ BOTTOM FORM CONTAINER: Pristine, Minimalist, Elegant (Matching Reference "Get in touch") ════ */}
      <div
        id="deck-specifications"
        className="rounded-[32px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 sm:p-12 shadow-sm"
      >
        {/* Section Heading in Editorial Serif (Matching "Get in touch") */}
        <div className="mb-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-zinc-900 dark:text-zinc-100">
            Deck specifications
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">
            Enter your study topic and configure your active recall preferences below.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-7">

          {/* 1. Study Topic or Chapter (Minimalist Clean Field matching screenshot) */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Study topic or chapter title <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Cellular Mitosis & Stages, Linked Lists, Organic Reactions..."
              required
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-400 transition font-normal shadow-2xs"
            />

            {/* Quick Suggestions below */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-zinc-400 mr-1">Popular:</span>
              {QUICK_TOPICS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setTopic(item.name)}
                  disabled={loading}
                  className="rounded-full px-3 py-1 text-xs font-normal transition hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-800 dark:hover:text-blue-300 bg-zinc-50 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Two-Column Row: Academic Subject & Target Exam Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Academic subject (optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology, Computer Science, Pharmacology..."
                disabled={loading}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-400 transition font-normal shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Target exam date (optional)
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-400 transition font-normal shadow-2xs"
              />
            </div>
          </div>

          {/* 3. Deck Size (Segmented Cards) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Number of flashcards
              </label>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {count} Cards Selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CARD_COUNT_OPTIONS.map((opt) => {
                const isSelected = count === opt.count;
                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setCount(opt.count)}
                    disabled={loading}
                    className={`rounded-2xl p-3.5 text-left transition border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 dark:bg-blue-950/50 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500'
                        : 'bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100/70 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">{opt.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-normal leading-tight">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Learning Recall Focus */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2.5">
              Learning recall focus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODE_OPTIONS.map((opt) => {
                const isSelected = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMode(opt.id)}
                    disabled={loading}
                    className={`rounded-2xl p-3.5 text-left transition border cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 dark:bg-blue-950/50 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500'
                        : 'bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100/70 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-xl mt-0.5">{opt.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{opt.label}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-normal leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Preparation Level */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2.5">
              Preparation difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = difficulty === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDifficulty(opt.id)}
                    disabled={loading}
                    className={`rounded-2xl p-3 text-left transition border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 dark:bg-blue-950/50 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500'
                        : 'bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100/70 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{opt.label}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-normal leading-tight">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Collapsible Syllabus Excerpt */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              <span>{showAdvanced ? 'Hide syllabus excerpt' : '+ Paste custom syllabus excerpt or notes (optional)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 p-4 border border-zinc-200/80 dark:border-zinc-700/80">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Syllabus or Textbook Excerpt
                </label>
                <textarea
                  value={studyMaterial}
                  onChange={(e) => setStudyMaterial(e.target.value)}
                  placeholder="Paste lecture notes or specific problem sets to ground the flashcards in your syllabus…"
                  rows={3}
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 font-normal"
                />
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-4 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to synthesize deck</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button (Matching Modern Black Pill / Button in Reference) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-sm font-semibold text-white bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Visual Flashcard Deck…</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 stroke-[2]" />
                  <span>Generate Flashcard Deck</span>
                  <ArrowRightIcon className="h-4 w-4 stroke-[2]" />
                </>
              )}
            </button>

            {loading && (
              <div className="mt-3.5 text-center">
                <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 text-xs font-medium text-blue-700 dark:text-blue-300 animate-pulse">
                  <span>{LOADING_STEPS[loadingStep]}</span>
                </span>
              </div>
            )}
          </div>

        </form>
      </div>

    </div>
  );
}