'use client';

import React, { useState } from 'react';
import type { Flashcard, RecallRating, EducationalImage } from '@/lib/flashcards/types';
import ImageBrowserModal from './ImageBrowserModal';

// Premium Heroicons
import {
  ArrowPathIcon,
  BookmarkIcon,
  ArrowsPointingOutIcon,
  InformationCircleIcon,
  LightBulbIcon,
  CheckBadgeIcon,
  EyeIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
} from '@heroicons/react/24/solid';

export interface EditorialCardProps {
  card: Flashcard;
  cardNumber: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onRateRecall?: (rating: RecallRating) => void;
  currentRating?: RecallRating;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onUpdateCardImage?: (image: EducationalImage) => void;
  isDark?: boolean;
  deckSubject?: string;
}

// Helper to pick an intuitive subject emoji/icon
function getConceptEmoji(name: string, subject?: string): string {
  const s = `${name} ${subject || ''}`.toLowerCase();
  if (s.includes('brain') || s.includes('neuro') || s.includes('cerebr')) return '🧠';
  if (s.includes('eye') || s.includes('vision') || s.includes('retina') || s.includes('cornea')) return '👁️';
  if (s.includes('heart') || s.includes('cardio') || s.includes('vascular')) return '❤️';
  if (s.includes('mito') || s.includes('cell') || s.includes('dna') || s.includes('gene')) return '🔬';
  if (s.includes('plant') || s.includes('botan') || s.includes('leaf') || s.includes('flora')) return '🌿';
  if (s.includes('code') || s.includes('comput') || s.includes('tree') || s.includes('graph') || s.includes('algorithm')) return '💻';
  if (s.includes('atom') || s.includes('chem') || s.includes('reaction') || s.includes('acid')) return '🧪';
  if (s.includes('math') || s.includes('physic') || s.includes('calculus')) return '📐';
  return '💡';
}

export default function EditorialCard({
  card,
  cardNumber,
  totalCards,
  isFlipped,
  onFlip,
  onRateRecall,
  currentRating,
  isBookmarked = false,
  onToggleBookmark,
  onUpdateCardImage,
  isDark = false,
  deckSubject,
}: EditorialCardProps) {
  const [showAttribution, setShowAttribution] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Concept name for the top center title
  const conceptTitle =
    card.scientificName ||
    card.categoryPill ||
    card.front.split('?')[0].split('.')[0].trim();

  const emoji = getConceptEmoji(conceptTitle, deckSubject);
  const isBrain = /brain|cerebr|lobe|neuro/i.test(`${conceptTitle} ${card.front}`);
  const isEye = /eye|cornea|retina|optic/i.test(`${conceptTitle} ${card.front}`);
  const isMito = /mitochond|cell|organelle|atp/i.test(`${conceptTitle} ${card.front}`);

  // Highlighted answer capsule text
  const targetLabel = card.back.split(/[,(.:]/)[0].trim() || 'Key Concept';

  return (
    <>
      <div
        className="relative mx-auto w-full select-none [perspective:1400px] flex items-center justify-center"
        style={{
          width: 'min(100%, 450px)',
          maxWidth: '450px',
          boxSizing: 'border-box',
        }}
      >
        {/* 3D Flippable Card Frame */}
        <div
          className={`relative w-full transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
          style={{
            minHeight: '470px',
            boxSizing: 'border-box',
          }}
        >
          {/* ════════════ FRONT — Clean White Aesthetic Card (Matching Reference Screenshot) ════════════ */}
          <div
            className="rounded-[32px] sm:rounded-[36px] overflow-hidden border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-blue-500/5 [backface-visibility:hidden] flex flex-col justify-between w-full h-full p-6 sm:p-7 box-border"
          >
            {/* 1. TOP HEADER: Round Emoji Avatar, Centered Title, High Yield Pill Badge */}
            <div className="flex items-center justify-between gap-2 shrink-0 pb-2">
              {/* Left: Round Avatar */}
              <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-950/70 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center text-xl shadow-2xs shrink-0">
                <span>{emoji}</span>
              </div>

              {/* Center: Title */}
              <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 text-center truncate max-w-[200px]">
                {conceptTitle}
              </h2>

              {/* Right: High Yield Pill Badge & Bookmark */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300 text-xs font-semibold px-3 py-1 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                  {card.categoryPill || 'High Yield'}
                </span>

                {onToggleBookmark && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark();
                    }}
                    title={isBookmarked ? 'Bookmarked' : 'Bookmark card'}
                    className="p-1 rounded-full text-zinc-400 hover:text-amber-500 transition cursor-pointer"
                  >
                    {isBookmarked ? (
                      <BookmarkIconSolid className="h-4 w-4 text-amber-500" />
                    ) : (
                      <BookmarkIcon className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 2. CENTER DIAGRAM / ILLUSTRATION FRAME */}
            <div className="relative my-3 flex-1 flex flex-col items-center justify-center min-h-[190px]">
              {/* If special anatomical concept or image is missing, render high-fidelity vector diagrams with labels */}
              {isBrain ? (
                <div className="relative h-40 sm:h-44 w-full flex items-center justify-center">
                  <svg viewBox="0 0 170 140" className="w-full h-full max-w-[240px]">
                    {/* Frontal lobe (Orange) */}
                    <path d="M 68 34 C 42 34 26 52 26 74 C 26 90 40 98 68 98 L 68 34 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2.5" />
                    {/* Parietal lobe (Cyan) */}
                    <path d="M 68 34 C 95 34 116 46 116 74 L 68 74 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="2.5" />
                    {/* Occipital lobe (Green) */}
                    <path d="M 116 74 C 128 86 128 102 116 114 L 98 98 Z" fill="#22c55e" stroke="#16a34a" strokeWidth="2.5" />
                    {/* Temporal lobe (Pink/Magenta - Target) */}
                    <path d="M 36 98 C 36 98 32 120 68 120 C 94 120 102 108 102 98 Z" fill="#ec4899" stroke="#be185d" strokeWidth="2.5" />
                    {/* Cerebellum (Burgundy) */}
                    <ellipse cx="94" cy="126" rx="22" ry="14" fill="#881337" stroke="#4c0519" strokeWidth="2.5" />
                    {/* Brainstem (Orange-red) */}
                    <path d="M 62 120 L 72 120 L 70 134 L 64 134 Z" fill="#ea580c" stroke="#c2410c" strokeWidth="2" />
                    {/* Dotted pointer lines */}
                    <line x1="26" y1="52" x2="8" y2="34" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
                    <line x1="105" y1="48" x2="140" y2="32" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
                    <line x1="68" y1="120" x2="68" y2="134" stroke="#e11d48" strokeWidth="2" />
                  </svg>

                  {/* Dotted pointer label capsules matching screenshot */}
                  <span className="absolute top-1 left-2 sm:left-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium px-2.5 py-0.5 border border-zinc-200/90 dark:border-zinc-700">
                    Frontal
                  </span>
                  <span className="absolute top-1 right-2 sm:right-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium px-2.5 py-0.5 border border-zinc-200/90 dark:border-zinc-700">
                    Parietal
                  </span>
                  {/* Highlighted Magenta Pill Capsule */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[#e11d48] text-white text-[11px] font-semibold px-4 py-1 shadow-sm ring-4 ring-pink-200/70 dark:ring-pink-900/60">
                    {targetLabel || 'Temporal Lobe'}
                  </span>
                </div>
              ) : isEye ? (
                <div className="relative h-40 sm:h-44 w-full flex items-center justify-center">
                  <svg viewBox="0 0 160 130" className="w-full h-full max-w-[240px]">
                    <circle cx="85" cy="65" r="46" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" opacity="0.65" />
                    <path d="M 52 40 A 42 42 0 0 0 52 90 A 46 46 0 0 1 52 40 Z" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
                    <ellipse cx="66" cy="65" rx="7" ry="20" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />
                    <path d="M 85 24 Q 120 40 120 65 Q 120 90 85 106" stroke="#ef4444" strokeWidth="2.5" fill="none" />
                    <path d="M 125 60 L 150 56 L 150 74 L 125 70 Z" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.8" />
                    <line x1="52" y1="46" x2="30" y2="34" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
                    <line x1="88" y1="26" x2="115" y2="16" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
                  </svg>
                  <span className="absolute top-1 left-2 rounded-full bg-[#e11d48] text-white text-[10px] font-semibold px-3 py-1 ring-4 ring-pink-200/70 dark:ring-pink-900/60">
                    Cornea
                  </span>
                  <span className="absolute top-1 right-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-medium px-2.5 py-0.5 border border-zinc-200 dark:border-zinc-700">
                    Retina
                  </span>
                </div>
              ) : card.image?.url && !imageError ? (
                /* Verified educational photo from Wikimedia with clean frame */
                <div className="relative w-full max-w-[280px] h-[160px] sm:h-[180px] flex items-center justify-center rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-100 dark:border-zinc-800 shadow-2xs group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image.url}
                    alt={card.image.alt || card.front}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={() => setImageError(true)}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  {/* Overlays for zoom and attribution */}
                  <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLightbox(true);
                      }}
                      title="Zoom illustration"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-white cursor-pointer shadow-md bg-black/60 hover:bg-black/80 transition hover:scale-110"
                    >
                      <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAttribution((p) => !p);
                      }}
                      title="Source attribution"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-white cursor-pointer shadow-md bg-black/60 hover:bg-black/80 transition hover:scale-110"
                    >
                      <InformationCircleIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Attribution Popover */}
                  {showAttribution && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 flex flex-col justify-center rounded-2xl bg-black/85 p-3 text-xs text-white backdrop-blur-xs z-20"
                    >
                      <p className="font-bold text-zinc-100">{card.image.sourceName}</p>
                      <p className="text-[10px] text-zinc-300 line-clamp-2 my-1">
                        {card.image.attribution || card.image.alt}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <a
                          href={card.image.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-300 hover:underline"
                        >
                          Source <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowAttribution(false)}
                          className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback stylized concept emblem */
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="h-16 w-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-3xl shadow-sm mb-2">
                    {emoji}
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">Visual Active Recall Prompt</span>
                </div>
              )}
            </div>

            {/* 3. QUESTION TEXT (Centered, Bold, Clear) */}
            <div className="my-2 text-center">
              <p className="text-base sm:text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-100">
                {card.front}
              </p>
            </div>

            {/* 4. "CHECK THE ANSWER" BUTTON (Directly Matching Reference) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onFlip}
                className="w-full rounded-full border-2 border-blue-600 dark:border-blue-500 bg-white hover:bg-blue-50 dark:bg-zinc-850 dark:hover:bg-zinc-800 py-3 sm:py-3.5 text-center text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                Check The Answer
              </button>
            </div>
          </div>

          {/* ════════════ BACK — Solution & Spaced Repetition Ratings ════════════ */}
          <div
            className="absolute inset-0 rounded-[32px] sm:rounded-[36px] overflow-hidden border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-blue-500/5 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-between w-full h-full p-6 sm:p-7 box-border"
          >
            {/* 1. Header Row */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <CheckBadgeIcon className="h-4 w-4 text-emerald-600" />
                <span>Verified Solution</span>
              </div>

              <button
                type="button"
                onClick={onFlip}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                <span>Show Question</span>
              </button>
            </div>

            {/* 2. Answer & Explanation Content */}
            <div className="flex-1 flex flex-col justify-center my-3 space-y-3 overflow-y-auto pr-1">
              {/* Direct Answer */}
              <div className="text-center p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block mb-1">
                  Correct Answer
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-blue-950 dark:text-blue-100 leading-snug">
                  {card.back}
                </h3>
              </div>

              {/* Detailed Explanation */}
              {card.explanation && card.explanation !== card.back && (
                <div className="rounded-2xl p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 text-xs sm:text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Mechanism & Explanation
                  </span>
                  <p>{card.explanation}</p>
                </div>
              )}

              {/* Example / Clinical or Practical Insight */}
              {card.example && (
                <div className="inline-flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <LightBulbIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p>
                    <span className="font-bold">Key Insight:</span> {card.example}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Spaced Repetition Self-Rating Buttons */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <span className="text-[11px] font-medium text-zinc-400 block text-center mb-2">
                How well did you know this?
              </span>

              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => onRateRecall?.('again')}
                  className="rounded-xl py-2 px-1 text-center font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition active:scale-95 cursor-pointer"
                >
                  Again (1)
                </button>
                <button
                  type="button"
                  onClick={() => onRateRecall?.('hard')}
                  className="rounded-xl py-2 px-1 text-center font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition active:scale-95 cursor-pointer"
                >
                  Hard (2)
                </button>
                <button
                  type="button"
                  onClick={() => onRateRecall?.('good')}
                  className="rounded-xl py-2 px-1 text-center font-bold text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition active:scale-95 cursor-pointer"
                >
                  Good (3)
                </button>
                <button
                  type="button"
                  onClick={() => onRateRecall?.('easy')}
                  className="rounded-xl py-2 px-1 text-center font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 cursor-pointer"
                >
                  Easy (4)
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && card.image?.url && (
        <div
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="max-w-2xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image.url}
              alt={card.image.alt || card.front}
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain bg-white dark:bg-zinc-950 p-3"
            />
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="mt-3 mx-auto block rounded-full bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Close Figure
            </button>
          </div>
        </div>
      )}
    </>
  );
}