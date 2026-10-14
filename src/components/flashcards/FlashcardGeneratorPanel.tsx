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
import {
  Sparkles,
  Layers,
  Brain,
  SlidersHorizontal,
  FileText,
  Calendar,
  Loader2,
  AlertCircle,
  BookOpen,
  Compass,
  CheckCircle2,
  Play,
  RotateCcw,
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react';

interface FlashcardGeneratorPanelProps {
  onDeckGenerated: (deck: FlashcardDeck) => void;
  isDark?: boolean;
  initialTopic?: string;
}

const QUICK_TOPICS = [
  'Artificial Intelligence: NLP',
  'Human Nervous System',
  'Data Structures: Linked Lists',
  'Operating System: Deadlocks',
  'Database Normalization',
  'Medicinal Plants & Botany',
];

const DIFFICULTY_OPTIONS: { id: FlashcardDifficulty; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'Core fundamentals' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Curriculum standard' },
  { id: 'advanced', label: 'Advanced', desc: 'Deep synthesis & tricky exam cases' },
];

const MODE_OPTIONS: { id: FlashcardLearningMode; label: string; desc: string }[] = [
  { id: 'visual_learning', label: 'Visual Learning', desc: 'Diagrams & scientific figures' },
  { id: 'conceptual', label: 'Conceptual', desc: 'Mechanisms & principles' },
  { id: 'definitions', label: 'Definitions', desc: 'Terminology & precision' },
  { id: 'exam_revision', label: 'Exam Cram', desc: 'High-yield test prompts' },
  { id: 'mnemonics', label: 'Mnemonics', desc: 'Memory hooks & acronyms' },
];

export default function FlashcardGeneratorPanel({
  onDeckGenerated,
  isDark = false,
  initialTopic = '',
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
    'Synthesizing curriculum concepts & high-yield prompts...',
    'Querying Wikimedia Commons for verified diagrams & figures...',
    'Browsing medical, botanical & technical archives for each card...',
    'Attaching open educational licenses and metadata...',
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
      <div
        className={`mx-auto w-full max-w-4xl rounded-3xl p-6 sm:p-8 md:p-10 border shadow-xs transition-all ${
          isDark
            ? 'bg-[#151b28] border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-100 dark:border-zinc-800/80 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <CheckCircle2 size={13} />
              <span>Deck Generated · Visuals Ready</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {generatedDeck.title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              {generatedDeck.cards.length} cards generated. Review or customize illustrations from Wikimedia Commons before studying.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setGeneratedDeck(null);
                setTopic('');
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition active:scale-95"
            >
              <RotateCcw size={13} />
              <span>Create Another</span>
            </button>
            <button
              type="button"
              onClick={() => onDeckGenerated(generatedDeck)}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-95 bg-blue-600"
            >
              <Play size={13} fill="currentColor" />
              <span>Start Studying</span>
            </button>
          </div>
        </div>

        {/* Card Grid with Image Previews & Browse Image Action */}
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {generatedDeck.cards.map((card, idx) => (
            <div
              key={card.id || idx}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition hover:shadow-sm ${
                isDark
                  ? 'border-zinc-800 bg-zinc-900/60'
                  : 'border-zinc-200/80 bg-zinc-50/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/60 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                    {card.categoryPill || 'Card'}
                  </span>
                </div>

                {/* Image Frame with Browse Overlay */}
                <div className="relative h-32 w-full rounded-xl overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group mb-2.5">
                  {card.image?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
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
                            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200"><rect width="300" height="200" fill="#0f172a"/><circle cx="150" cy="90" r="35" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/><text x="150" y="95" font-family="sans-serif" font-size="11" fill="#60a5fa" text-anchor="middle" font-weight="bold">${(card.scientificName || 'e-Mate').slice(0, 14)}</text><text x="150" y="150" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Educational Concept</text></svg>`
                          )}`;
                        }
                      }}
                      className="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 p-2 text-center">
                      <ImageIcon size={22} className="opacity-50 mb-1" />
                      <span className="text-[10px]">No image</span>
                    </div>
                  )}

                  {/* Browse Image Button on Card */}
                  <button
                    type="button"
                    onClick={() => setActiveCardIndexForBrowser(idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition-opacity backdrop-blur-2xs cursor-pointer"
                  >
                    <Compass size={14} />
                    <span>Browse Image</span>
                  </button>
                </div>

                {/* Card Question / Scientific Name */}
                <p className="text-xs sm:text-sm font-semibold line-clamp-2 text-zinc-900 dark:text-zinc-100">
                  {card.scientificName || card.front}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                  {card.back}
                </p>
              </div>

              {/* Individual Browse Trigger Button below */}
              <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 line-clamp-1">
                  {card.image?.sourceName || 'e-Mate System'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCardIndexForBrowser(idx)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Compass size={11} />
                  <span>Change Image</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-400 text-center sm:text-left">
            Tip: You can also swap images at any time during interactive study using card controls.
          </p>
          <button
            type="button"
            onClick={() => onDeckGenerated(generatedDeck)}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-95 bg-blue-600"
          >
            <Play size={15} fill="currentColor" />
            <span>Practice Deck Now</span>
            <ArrowRight size={14} />
          </button>
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

  return (
    <div
      className="mx-auto w-full max-w-3xl rounded-3xl p-6 sm:p-8 md:p-10 border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 shadow-xs backdrop-blur-sm transition-all"
    >
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
          <Sparkles size={13} />
          <span>AI Deck Creator</span>
        </div>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Generate a Personalized Visual Deck
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Enter any academic subject or topic. e-Mate AI will query Wikimedia Commons and attach verified educational diagrams &amp; figures.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Topic Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-zinc-500 dark:text-zinc-400">
            Study Topic or Subject <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Natural Language Processing, Linked Lists, Human Nervous System..."
            required
            disabled={loading}
            className="w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-2xs"
          />

          {/* Quick topic pills */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 font-medium">Popular:</span>
            {QUICK_TOPICS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTopic(item)}
                disabled={loading}
                className="rounded-full px-3 py-1 text-xs font-medium transition hover:bg-zinc-200 dark:hover:bg-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60 cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Card Count Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-zinc-500 dark:text-zinc-400">
            Number of Cards: <span className="font-bold text-blue-600 dark:text-blue-400">{count} cards</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[5, 8, 12, 16].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCount(num)}
                disabled={loading}
                className={`rounded-xl py-2 px-3 text-xs font-semibold transition border cursor-pointer ${
                  count === num
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {num} Cards
              </button>
            ))}
          </div>
        </div>

        {/* Learning Mode Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-zinc-500 dark:text-zinc-400">
            Learning Focus
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                disabled={loading}
                className={`rounded-2xl p-3 text-left transition border cursor-pointer ${
                  mode === opt.id
                    ? 'bg-blue-50/70 border-blue-600 dark:bg-blue-950/40 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{opt.label}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-zinc-500 dark:text-zinc-400">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDifficulty(opt.id)}
                disabled={loading}
                className={`rounded-2xl p-3 text-left transition border cursor-pointer ${
                  difficulty === opt.id
                    ? 'bg-blue-50/70 border-blue-600 dark:bg-blue-950/40 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{opt.label}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Accordion: Study Material & Exam Date */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <SlidersHorizontal size={13} />
            <span>{showAdvanced ? 'Hide Additional Context' : '+ Add Syllabus Notes or Exam Schedule'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 rounded-2xl bg-zinc-50/60 dark:bg-zinc-900/40 p-4 border border-zinc-200/80 dark:border-zinc-800/80">
              <div>
                <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <FileText size={12} />
                  <span>Paste Syllabus or Class Notes (optional)</span>
                </label>
                <textarea
                  value={studyMaterial}
                  onChange={(e) => setStudyMaterial(e.target.value)}
                  placeholder="Paste lecture notes, formulas, or textbook sections here to personalize the generated cards..."
                  rows={3}
                  disabled={loading}
                  className="w-full rounded-xl border p-2.5 text-xs border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>Target Exam / Test Date (optional)</span>
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  disabled={loading}
                  className="rounded-xl border px-3 py-1.5 text-xs border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-3.5 flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="font-semibold">Generation Error</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button & Animated Loading State */}
        <div>
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 px-6 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Browsing Wikimedia Commons &amp; Building Deck...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Create Flashcards Deck</span>
              </>
            )}
          </button>

          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 text-xs font-medium text-blue-700 dark:text-blue-300 animate-pulse">
                <Compass size={14} className="text-blue-600 dark:text-blue-400 animate-spin" />
                <span>{LOADING_STEPS[loadingStep]}</span>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
