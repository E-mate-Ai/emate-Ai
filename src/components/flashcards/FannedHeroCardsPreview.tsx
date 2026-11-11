'use client';

import React, { useState } from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function FannedHeroCardsPreview({
  onSelectDeck,
}: {
  onSelectDeck?: (topic: string) => void;
}) {
  const [brainAnswerChecked, setBrainAnswerChecked] = useState(false);
  const [eyeAnswerChecked, setEyeAnswerChecked] = useState(false);
  const [mitoAnswerChecked, setMitoAnswerChecked] = useState(false);

  return (
    <div className="relative w-full py-4 sm:py-8 flex items-center justify-center select-none overflow-visible">

      {/* ── 3D Orbital Rings (Matching Reference Image) ── */}
      <svg
        className="pointer-events-none absolute w-[125%] max-w-[620px] h-[320px] z-10 opacity-70 dark:opacity-40"
        viewBox="0 0 600 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="300"
          cy="160"
          rx="270"
          ry="75"
          transform="rotate(-14 300 160)"
          stroke="url(#ringGradient1)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <ellipse
          cx="300"
          cy="160"
          rx="250"
          ry="65"
          transform="rotate(12 300 160)"
          stroke="url(#ringGradient2)"
          strokeWidth="1.8"
        />
        <defs>
          <linearGradient id="ringGradient1" x1="50" y1="90" x2="550" y2="230" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a855f7" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="1" stopColor="#60a5fa" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="ringGradient2" x1="60" y1="210" x2="540" y2="110" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" stopOpacity="0.1" />
            <stop offset="0.5" stopColor="#818cf8" stopOpacity="0.75" />
            <stop offset="1" stopColor="#c084fc" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── 3 Fanned Cards Container (Scales gracefully on mobile) ── */}
      <div className="relative flex items-center justify-center w-full max-w-[560px] h-[340px] sm:h-[390px] scale-[0.82] xs:scale-[0.92] sm:scale-100 origin-center">

        {/* ════ CARD 1: EYE (Left, Tilted -9deg) ════ */}
        <div
          onClick={() => onSelectDeck?.('Human Eye Anatomy')}
          className="absolute left-1 sm:left-4 w-[190px] sm:w-[220px] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 p-3.5 sm:p-4 shadow-xl -rotate-9 -translate-y-2 z-0 hover:z-30 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          {/* Top header */}
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px]">
              👁️
            </div>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Eye
            </span>
            <div className="w-4" />
          </div>

          {/* Diagram Illustration */}
          <div className="relative h-28 sm:h-32 w-full flex items-center justify-center">
            {/* Eye anatomical SVG */}
            <svg viewBox="0 0 160 130" className="w-full h-full">
              {/* Outer Sclera */}
              <circle cx="85" cy="65" r="46" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" opacity="0.65" />
              {/* Cornea bulge */}
              <path d="M 52 40 A 42 42 0 0 0 52 90 A 46 46 0 0 1 52 40 Z" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
              {/* Lens */}
              <ellipse cx="66" cy="65" rx="7" ry="20" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />
              {/* Retina lines */}
              <path d="M 85 24 Q 120 40 120 65 Q 120 90 85 106" stroke="#ef4444" strokeWidth="2.5" fill="none" />
              {/* Optic nerve */}
              <path d="M 125 60 L 150 56 L 150 74 L 125 70 Z" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.8" />
              {/* Pointer lines */}
              <line x1="52" y1="46" x2="30" y2="34" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="88" y1="26" x2="115" y2="16" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="125" y1="65" x2="148" y2="65" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 2" />
            </svg>

            {/* Label capsules */}
            <span className="absolute top-1 left-1 rounded-full bg-rose-600 text-white text-[8px] font-bold px-2 py-0.5 shadow-xs">
              Cornea
            </span>
            <span className="absolute top-1 right-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[8px] font-medium px-2 py-0.5 border border-zinc-200 dark:border-zinc-700">
              Retina
            </span>
            <span className="absolute bottom-3 right-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[8px] font-medium px-2 py-0.5 border border-zinc-200 dark:border-zinc-700">
              Optic Nerve
            </span>
          </div>

          {/* Question */}
          <p className="mt-2 text-[11px] font-medium leading-tight text-zinc-800 dark:text-zinc-200 line-clamp-2">
            What is the name of the highlighted Eye part in the picture?
          </p>

          {/* Bottom Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEyeAnswerChecked((v) => !v);
            }}
            className="mt-3 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 py-1.5 text-center text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 transition"
          >
            {eyeAnswerChecked ? '✓ Cornea (Refraction)' : 'Check The Answer'}
          </button>
        </div>

        {/* ════ CARD 2: BRAIN (Center, Upfront, Scale 1.05) ════ */}
        <div
          onClick={() => onSelectDeck?.('Human Brain Anatomy')}
          className="absolute w-[210px] sm:w-[245px] rounded-2xl bg-white dark:bg-zinc-900 border-2 border-blue-400/80 dark:border-blue-500/80 p-4 sm:p-5 shadow-2xl z-20 scale-105 hover:scale-110 transition-all duration-300 cursor-pointer"
        >
          {/* Top header */}
          <div className="flex items-center justify-between mb-2">
            <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-xs">
              🧠
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-wide">
              Brain
            </span>
            <span className="rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-bold px-2 py-0.5">
              High Yield
            </span>
          </div>

          {/* Diagram Illustration (Colorful Brain Lobes matching reference image) */}
          <div className="relative h-32 sm:h-36 w-full flex items-center justify-center">
            <svg viewBox="0 0 170 140" className="w-full h-full drop-shadow-xs">
              {/* Frontal Lobe (Amber / Yellow) */}
              <path
                d="M 45 68 C 30 55 40 28 65 24 C 80 22 92 30 92 48 C 92 68 65 72 45 68 Z"
                fill="#f59e0b"
                stroke="#b45309"
                strokeWidth="1.5"
              />
              {/* Parietal Lobe (Sky Blue) */}
              <path
                d="M 92 26 C 112 24 135 34 136 54 C 136 68 115 72 92 68 C 92 48 92 34 92 26 Z"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="1.5"
              />
              {/* Occipital Lobe (Emerald Green) */}
              <path
                d="M 136 54 C 146 64 148 82 138 94 C 128 92 120 80 120 70 C 128 62 134 58 136 54 Z"
                fill="#10b981"
                stroke="#047857"
                strokeWidth="1.5"
              />
              {/* Temporal Lobe (Hot Magenta / Pink) - Highlighted! */}
              <path
                d="M 52 70 C 72 70 108 68 116 80 C 116 98 88 104 60 98 C 45 92 48 76 52 70 Z"
                fill="#ec4899"
                stroke="#be185d"
                strokeWidth="2"
              />
              {/* Cerebellum (Dark Crimson / Brown) */}
              <path
                d="M 112 92 C 128 92 138 102 130 114 C 118 122 102 118 96 108 C 96 98 104 94 112 92 Z"
                fill="#881337"
                stroke="#4c0519"
                strokeWidth="1.5"
              />
              {/* Brainstem (Orange) */}
              <path
                d="M 88 102 C 92 102 96 112 92 126 C 88 128 82 128 80 126 C 82 112 84 102 88 102 Z"
                fill="#f97316"
                stroke="#c2410c"
                strokeWidth="1.5"
              />

              {/* Pointer lines */}
              <line x1="50" y1="28" x2="25" y2="20" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="125" y1="32" x2="148" y2="22" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="78" y1="96" x2="78" y2="120" stroke="#be185d" strokeWidth="1.8" />
            </svg>

            {/* Label slots */}
            <span className="absolute top-1 left-0 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[8px] font-medium px-2 py-0.5 border border-zinc-200 dark:border-zinc-700">
              Frontal
            </span>
            <span className="absolute top-1 right-0 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[8px] font-medium px-2 py-0.5 border border-zinc-200 dark:border-zinc-700">
              Parietal
            </span>
            {/* The Highlighted Magenta Capsule (Matching Reference Image) */}
            <span className="absolute bottom-1 left-12 rounded-full bg-pink-600 text-white text-[9px] font-bold px-2.5 py-0.5 shadow-sm ring-2 ring-pink-300 dark:ring-pink-900">
              Temporal Lobe
            </span>
          </div>

          {/* Question (Centered & Balanced) */}
          <p className="mt-2 text-center text-xs font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
            What is the name of the highlighted brain part in the pictures?
          </p>

          {/* Bottom Interactive Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setBrainAnswerChecked((v) => !v);
            }}
            className="mt-3 w-full rounded-xl border border-blue-500/80 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 py-2 text-center text-xs font-bold text-blue-700 dark:text-blue-300 transition shadow-xs cursor-pointer active:scale-98"
          >
            {brainAnswerChecked ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckBadgeIcon className="h-3.5 w-3.5" /> Temporal Lobe (Auditory)
              </span>
            ) : (
              'Check The Answer'
            )}
          </button>
        </div>

        {/* ════ CARD 3: MITOCHONDRIA (Right, Tilted +9deg) ════ */}
        <div
          onClick={() => onSelectDeck?.('Cell Biology & Organelles')}
          className="absolute right-1 sm:right-4 w-[190px] sm:w-[220px] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 p-3.5 sm:p-4 shadow-xl rotate-9 -translate-y-2 z-0 hover:z-30 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          {/* Top header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Mitochondria
            </span>
            <div className="h-5 w-5 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-[10px]">
              ⚡
            </div>
          </div>

          {/* Diagram Illustration */}
          <div className="relative h-28 sm:h-32 w-full flex items-center justify-center">
            {/* Mitochondria anatomical SVG */}
            <svg viewBox="0 0 160 120" className="w-full h-full">
              {/* Outer Membrane */}
              <ellipse cx="80" cy="60" rx="60" ry="32" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="2.5" />
              {/* Inner Cristae Folds */}
              <path
                d="M 35 60 C 45 42 55 42 60 60 C 65 75 75 75 80 60 C 85 45 95 45 100 60 C 105 75 115 75 125 60"
                stroke="#e11d48"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 45 54 C 52 46 62 46 68 54 C 74 62 84 62 90 54 C 96 46 106 46 112 54"
                stroke="#fda4af"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Pointer lines */}
              <line x1="60" y1="40" x2="80" y2="20" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="80" y1="62" x2="110" y2="88" stroke="#be185d" strokeWidth="1.6" />
            </svg>

            {/* Label capsules */}
            <span className="absolute top-1 right-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[8px] font-medium px-2 py-0.5 border border-zinc-200 dark:border-zinc-700">
              Outer Membrane
            </span>
            <span className="absolute bottom-2 right-2 rounded-full bg-rose-600 text-white text-[8px] font-bold px-2 py-0.5 shadow-xs">
              Cristae Folds
            </span>
          </div>

          {/* Question */}
          <p className="mt-2 text-[11px] font-medium leading-tight text-zinc-800 dark:text-zinc-200 line-clamp-2">
            What is the name of the highlighted organelle part in the picture?
          </p>

          {/* Bottom Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMitoAnswerChecked((v) => !v);
            }}
            className="mt-3 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 py-1.5 text-center text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 transition"
          >
            {mitoAnswerChecked ? '✓ Cristae (ATP Synthesis)' : 'Check The Answer'}
          </button>
        </div>

      </div>

    </div>
  );
}

