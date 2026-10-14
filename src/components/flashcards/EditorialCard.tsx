'use client';

import React, { useState } from 'react';
import type { Flashcard, RecallRating, EducationalImage } from '@/lib/flashcards/types';
import ImageBrowserModal from './ImageBrowserModal';
import {
  RotateCw,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Info,
  Maximize2,
  Compass,
  Lightbulb,
} from 'lucide-react';

/* ─── Subject Palette & Theming ─── */
interface SubjectStyle {
  accent: string;
  badge: string;
  questionPanelBg: string;
  questionPanelBorder: string;
}

function resolveSubjectStyle(subject?: string, categoryPill?: string): SubjectStyle {
  const s = `${subject || ''} ${categoryPill || ''}`.toLowerCase();

  if (s.includes('pharmac') || s.includes('medicinal') || s.includes('botan') || s.includes('plant') || s.includes('herb')) {
    return {
      accent: '#4E6B4E', // Forest Olive Sage
      badge: categoryPill?.toUpperCase() || 'BOTANY & PHARMACOLOGY',
      questionPanelBg: '#F0F5EE',
      questionPanelBorder: '#DCE8D8',
    };
  }
  if (s.includes('anat') || s.includes('human') || s.includes('physiol') || s.includes('med')) {
    return {
      accent: '#A84B42', // Terracotta
      badge: categoryPill?.toUpperCase() || 'HUMAN ANATOMY & MEDICINE',
      questionPanelBg: '#FAF1EF',
      questionPanelBorder: '#F2D7D4',
    };
  }
  if (s.includes('comput') || s.includes('code') || s.includes('tech') || s.includes('ai') || s.includes('nlp') || s.includes('algorithm')) {
    return {
      accent: '#2B577E', // Ocean Slate
      badge: categoryPill?.toUpperCase() || 'COMPUTER SCIENCE & AI',
      questionPanelBg: '#EEF4F9',
      questionPanelBorder: '#D7E4F0',
    };
  }
  if (s.includes('math') || s.includes('calculus') || s.includes('physics')) {
    return {
      accent: '#4B3F72', // Indigo Royal
      badge: categoryPill?.toUpperCase() || 'MATHEMATICS & PHYSICS',
      questionPanelBg: '#F2F0F7',
      questionPanelBorder: '#DDD7E8',
    };
  }

  return {
    accent: '#2563EB', // e-Mate Blue
    badge: (categoryPill || subject || 'ACTIVE RECALL').toUpperCase(),
    questionPanelBg: '#EFF6FF',
    questionPanelBorder: '#DBEAFE',
  };
}

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
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Subject Theme
  const theme = resolveSubjectStyle(deckSubject, card.categoryPill);
  const { accent, badge, questionPanelBg, questionPanelBorder } = theme;

  // Key concept display name
  const conceptName = card.scientificName || card.front.split('?')[0].split('.')[0].trim();

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
          className={`relative w-full transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] [transform-style:preserve-3d] motion-reduce:transition-none ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
          style={{
            minHeight: '440px',
            maxHeight: 'calc(100dvh - 230px)',
            boxSizing: 'border-box',
          }}
        >
          {/* ════════════ FRONT — Clean Modern Flashcard ════════════ */}
          <div
            className="rounded-[24px] overflow-hidden border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md [backface-visibility:hidden] flex flex-col justify-between w-full h-full box-border"
          >
            {/* 1. Header Strip: number badge, category label, bookmark button */}
            <div
              className="flex items-center justify-between px-4 py-2.5 text-white shrink-0"
              style={{ backgroundColor: accent }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-white/20 text-[11px] font-black text-white shadow-xs">
                  {cardNumber}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                  {badge}
                </span>
              </div>

              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark();
                  }}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark card'}
                  className="p-1 rounded-full transition hover:scale-110 active:scale-95 text-white/90 hover:text-white cursor-pointer"
                >
                  {isBookmarked ? (
                    <BookmarkCheck size={16} className="fill-amber-300 text-amber-300" />
                  ) : (
                    <Bookmark size={16} />
                  )}
                </button>
              )}
            </div>

            {/* 2. Main Card Body */}
            <div className="p-4 sm:p-5 flex flex-col items-center justify-between flex-1 gap-3">
              {/* Concept Title */}
              <h3 className="text-xl sm:text-[22px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 text-center leading-snug">
                {conceptName}
              </h3>

              {/* Image Area */}
              {card.image && !imageError ? (
                <div className="relative w-full max-w-[260px] h-[135px] sm:h-[150px] flex items-center justify-center rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 p-2 border border-zinc-100 dark:border-zinc-800 shadow-2xs group">
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
                  <div className="absolute top-1.5 right-1.5 flex gap-1 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLightbox(true);
                      }}
                      title="Zoom illustration"
                      className="flex h-5 w-5 items-center justify-center rounded-full text-white cursor-pointer shadow-md bg-black/60 hover:bg-black/80 transition hover:scale-110"
                    >
                      <Maximize2 size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAttribution((p) => !p);
                      }}
                      title="Source attribution"
                      className="flex h-5 w-5 items-center justify-center rounded-full text-white cursor-pointer shadow-md bg-black/60 hover:bg-black/80 transition hover:scale-110"
                    >
                      <Info size={9} />
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
                      <p className="text-[10px] text-emerald-400 font-medium">
                        License: {card.image.license}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <a
                          href={card.image.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-300 hover:underline"
                        >
                          Source <ExternalLink size={9} />
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
              ) : null}

              {/* Question Panel */}
              <div
                className="w-full rounded-2xl p-3.5 sm:p-4 text-center border transition-colors"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : questionPanelBg,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : questionPanelBorder,
                }}
              >
                <p className="text-xs sm:text-[13.5px] font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {card.front}
                </p>
              </div>

              {/* Reveal Button */}
              <button
                type="button"
                onClick={onFlip}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl text-xs font-semibold transition-all cursor-pointer bg-zinc-100/90 dark:bg-zinc-800 hover:bg-zinc-200/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs active:scale-98"
              >
                <Lightbulb size={13} className="text-amber-500" />
                <span>Tap to reveal answer</span>
              </button>
            </div>
          </div>

          {/* ════════════ BACK — Answer & Explanation ════════════ */}
          <div
            className="absolute inset-0 rounded-[24px] overflow-hidden border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-between w-full h-full box-border"
          >
            {/* Header Strip */}
            <div
              className="flex items-center justify-between px-4 py-2.5 text-white shrink-0"
              style={{ backgroundColor: accent }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-white/20 text-[11px] font-black text-white shadow-xs">
                  {cardNumber}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                  Answer & Recall
                </span>
              </div>

              <button
                type="button"
                onClick={onFlip}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white transition active:scale-95 cursor-pointer"
              >
                <RotateCw size={10} /> Flip
              </button>
            </div>

            {/* Answer Content Body */}
            <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-2.5 overflow-y-auto">
              {/* Direct Answer Highlight Panel */}
              <div className="w-full rounded-2xl p-3.5 text-center bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 shadow-2xs shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 block mb-1">
                  Direct Answer
                </span>
                <h4 className="text-sm sm:text-[15px] font-extrabold text-blue-950 dark:text-blue-100 leading-snug">
                  {card.back}
                </h4>
              </div>

              {/* In Simple Words */}
              {card.explanation && card.explanation !== card.back && (
                <div className="w-full rounded-xl px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/40 shrink-0">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">
                    In simple words
                  </span>
                  <p className="text-xs sm:text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {card.explanation}
                  </p>
                </div>
              )}

              {/* Example + Remember This */}
              {card.example && (
                <div className="w-full rounded-2xl p-3 flex gap-2 items-start bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-left shrink-0">
                  <Lightbulb size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-0.5">
                      Remember this
                    </span>
                    <p className="text-[11.5px] sm:text-xs leading-relaxed text-emerald-950 dark:text-emerald-100">
                      {card.example}
                    </p>
                  </div>
                </div>
              )}

              {/* Recall Rating Buttons */}
              {onRateRecall && (
                <div className="w-full pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      How well did you remember this?
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      Keys: 1 - 4
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {([
                      {
                        id: 'again' as RecallRating,
                        key: '1',
                        label: 'Again',
                        sub: 'Forgot',
                        color: '#DC2626',
                        bg: 'bg-rose-50 dark:bg-rose-950/40',
                        border: 'border-rose-200 dark:border-rose-900/60',
                        text: 'text-rose-700 dark:text-rose-300',
                      },
                      {
                        id: 'hard' as RecallRating,
                        key: '2',
                        label: 'Hard',
                        sub: 'Struggled',
                        color: '#D97706',
                        bg: 'bg-amber-50 dark:bg-amber-950/40',
                        border: 'border-amber-200 dark:border-amber-900/60',
                        text: 'text-amber-700 dark:text-amber-300',
                      },
                      {
                        id: 'good' as RecallRating,
                        key: '3',
                        label: 'Good',
                        sub: 'Recalled',
                        color: '#2563EB',
                        bg: 'bg-blue-50 dark:bg-blue-950/40',
                        border: 'border-blue-200 dark:border-blue-900/60',
                        text: 'text-blue-700 dark:text-blue-300',
                      },
                      {
                        id: 'easy' as RecallRating,
                        key: '4',
                        label: 'Easy',
                        sub: 'Mastered',
                        color: '#059669',
                        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
                        border: 'border-emerald-200 dark:border-emerald-900/60',
                        text: 'text-emerald-700 dark:text-emerald-300',
                      },
                    ] as const).map((btn) => {
                      const isActive = currentRating === btn.id;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => onRateRecall(btn.id)}
                          className={`flex flex-col items-center justify-center rounded-xl py-1.5 px-1 text-center transition-all cursor-pointer hover:scale-[1.03] active:scale-95 shadow-2xs border ${
                            isActive
                              ? 'text-white'
                              : `${btn.bg} ${btn.border} ${btn.text}`
                          }`}
                          style={{
                            backgroundColor: isActive ? btn.color : undefined,
                            borderColor: isActive ? btn.color : undefined,
                          }}
                        >
                          <span className="text-[10px] font-black leading-tight flex items-center gap-0.5">
                            {btn.label}
                            <span className="text-[8.5px] opacity-60 font-mono">({btn.key})</span>
                          </span>
                          <span className="text-[8.5px] opacity-75 leading-tight">{btn.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Full-Screen Image Lightbox ─── */}
      {showLightbox && card.image && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative max-w-2xl w-full flex flex-col rounded-3xl overflow-hidden shadow-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {card.image.alt || conceptName}
              </h4>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                Close ✕
              </button>
            </div>
            <div className="py-4 flex items-center justify-center max-h-[65vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image.url}
                alt={card.image.alt || card.front}
                className="max-h-full max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Image Browser Modal ─── */}
      {showImageBrowser && onUpdateCardImage && (
        <ImageBrowserModal
          isOpen={showImageBrowser}
          initialQuery={card.imageQuery || conceptName}
          conceptName={conceptName}
          onSelectImage={(img) => {
            onUpdateCardImage(img);
            setShowImageBrowser(false);
          }}
          onClose={() => setShowImageBrowser(false)}
          isDark={isDark}
        />
      )}
    </>
  );
}
