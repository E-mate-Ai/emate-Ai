'use client';

import React, { useState, useMemo } from 'react';
import type { FlashcardDeck } from '@/lib/flashcards/types';
import { getDeckProgress, deleteLocalDeck } from '@/lib/flashcards/storage';
import {
  Search,
  BookOpen,
  Play,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface FlashcardLibraryViewProps {
  decks: FlashcardDeck[];
  onSelectDeck: (deck: FlashcardDeck) => void;
  onCreateNew: () => void;
  onRefreshDecks: () => void;
  isDark?: boolean;
}

export default function FlashcardLibraryView({
  decks,
  onSelectDeck,
  onCreateNew,
  onRefreshDecks,
  isDark = false,
}: FlashcardLibraryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Extract distinct subjects
  const subjects = useMemo(() => {
    const list = Array.from(new Set(decks.map((d) => d.subject || 'General')));
    return ['all', ...list];
  }, [decks]);

  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const matchSearch =
        deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deck.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deck.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSubject =
        selectedSubject === 'all' || deck.subject === selectedSubject;
      return matchSearch && matchSubject;
    });
  }, [decks, searchTerm, selectedSubject]);

  const handleDelete = (deckId: string) => {
    if (confirm('Are you sure you want to delete this study deck?')) {
      deleteLocalDeck(deckId);
      onRefreshDecks();
    }
  };

  return (
    <div
      className={`mx-auto w-full max-w-6xl px-4 py-4 sm:py-6 transition-colors ${
        isDark ? 'text-zinc-100' : 'text-zinc-900'
      }`}
    >
      {/* ─── Search & Filter Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Your Visual Library
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {decks.length} {decks.length === 1 ? 'deck' : 'decks'} saved for active recall review
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search decks..."
              className="w-full rounded-full border pl-8 pr-4 py-2 text-xs transition border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/60 shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={14} />
            <span>Create Deck</span>
          </button>
        </div>
      </div>

      {/* ─── Subject Filter Pills ─── */}
      {subjects.length > 2 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                  : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* ─── Decks Grid ─── */}
      {filteredDecks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map((deck) => {
            const progress = getDeckProgress(deck.id);
            const total = deck.cards?.length || 0;
            const studied = Object.keys(progress.cardRatings).length;
            const percent = total > 0 ? Math.round((studied / total) * 100) : 0;
            const thumbnail = deck.thumbnailUrl || deck.cards?.[0]?.image?.url;

            return (
              <div
                key={deck.id}
                onClick={() => onSelectDeck(deck)}
                className="group relative flex flex-col justify-between rounded-3xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 shadow-xs backdrop-blur-sm hover:border-blue-500/40 cursor-pointer"
              >
                <div>
                  {/* Top Thumbnail or Visual Motif */}
                  <div className="relative mb-3.5 h-36 w-full overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                    {thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumbnail}
                        alt={deck.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.failed) {
                            target.dataset.failed = 'true';
                            target.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250"><rect width="400" height="250" fill="#0f172a"/><circle cx="200" cy="110" r="45" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/><text x="200" y="115" font-family="sans-serif" font-size="12" fill="#60a5fa" text-anchor="middle" font-weight="bold">${(deck.subject || 'e-Mate').slice(0, 16)}</text><text x="200" y="180" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">${(deck.title || 'Flashcards').slice(0, 24)}</text></svg>`
                            )}`;
                          }
                        }}
                        className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-400">
                        <BookOpen size={32} />
                      </div>
                    )}

                    {/* Subject Pill overlay */}
                    <span className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                      {deck.subject}
                    </span>

                    {/* Card Count Pill */}
                    <span className="absolute bottom-2.5 right-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                      {deck.cardCount || deck.cards.length} Cards
                    </span>
                  </div>

                  {/* Deck Title */}
                  <h3 className="text-sm sm:text-base font-semibold leading-snug line-clamp-1 text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {deck.title}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {deck.topic}
                  </p>
                </div>

                {/* Bottom Row: Progress & Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-zinc-400 font-medium">
                      {studied} / {total} Reviewed
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {percent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDeck(deck);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition shadow-xs hover:bg-blue-700 active:scale-95 bg-blue-600 cursor-pointer"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Study</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(deck.id);
                      }}
                      title="Delete deck"
                      className="p-1.5 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-3xl border-dashed border-zinc-200 dark:border-zinc-800 p-8">
          <BookOpen size={40} className="mx-auto text-zinc-400 mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No study decks found
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {searchTerm
              ? `No decks matched "${searchTerm}". Try a different search.`
              : 'You have not created any custom decks yet.'}
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition-all shadow-xs active:scale-95 bg-blue-600 hover:bg-blue-700 cursor-pointer"
          >
            <Plus size={14} />
            <span>Generate Your First Deck</span>
          </button>
        </div>
      )}
    </div>
  );
}
