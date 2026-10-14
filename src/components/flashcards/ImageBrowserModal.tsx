'use client';

import React, { useState, useEffect } from 'react';
import type { EducationalImage } from '@/lib/flashcards/types';
import { generateEducationalDiagramSVG } from '@/lib/flashcards/imageService';
import {
  Search,
  X,
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Compass,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ImageBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: EducationalImage) => void;
  initialQuery?: string;
  topic?: string;
  conceptName?: string;
  currentImageUrl?: string;
  isDark?: boolean;
}

export default function ImageBrowserModal({
  isOpen,
  onClose,
  onSelectImage,
  initialQuery = '',
  topic = 'General Science',
  conceptName = '',
  currentImageUrl,
  isDark = false,
}: ImageBrowserModalProps) {
  const [query, setQuery] = useState(initialQuery || conceptName || topic);
  const [images, setImages] = useState<EducationalImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<EducationalImage | null>(null);

  // Quick suggestions based on concept and topic
  const suggestions = [
    conceptName || initialQuery || topic,
    `${conceptName || initialQuery} diagram`,
    `${conceptName || initialQuery} labeled`,
    `${conceptName || initialQuery} anatomy`,
    topic,
  ].filter(Boolean).filter((val, idx, arr) => arr.indexOf(val) === idx);

  const fetchImages = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/flashcards/image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchTerm.trim(),
          topic,
          conceptName,
          mode: 'browse',
          limit: 12,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to search Wikimedia Commons');
      }

      const data = await res.json();
      const fetched: EducationalImage[] = data.images || [];

      // Always include the AI educational diagram SVG as an option
      const diagramSVG = generateEducationalDiagramSVG(conceptName || searchTerm, topic);
      setImages([...fetched, diagramSVG]);
    } catch (err: any) {
      console.warn('[ImageBrowserModal] Search error:', err);
      setError('Could not reach Wikimedia Commons. Using educational diagram fallback.');
      const diagramSVG = generateEducationalDiagramSVG(conceptName || searchTerm, topic);
      setImages([diagramSVG]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const startingQuery = initialQuery || conceptName || topic;
      setQuery(startingQuery);
      fetchImages(startingQuery);
    }
  }, [isOpen, initialQuery, conceptName, topic]);

  if (!isOpen) return null;

  const handleApply = (img: EducationalImage) => {
    onSelectImage(img);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col w-full max-w-4xl max-h-[88vh] rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#151b28] border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold tracking-tight">
                Browse Educational Images
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Search verified open-access figures, botanical plates &amp; diagrams from Wikimedia Commons
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar & Suggestions */}
        <div className="px-6 py-3.5 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchImages(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search scientific diagrams, anatomy, botany, or concepts..."
                className="w-full rounded-full border border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-950 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs disabled:opacity-50 transition cursor-pointer active:scale-95"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              <span>Search</span>
            </button>
          </form>

          {/* Quick chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-zinc-400">
            <span className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400">Suggestions:</span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(s);
                  fetchImages(s);
                }}
                className="shrink-0 rounded-full border border-zinc-200/80 dark:border-zinc-700/70 bg-white dark:bg-zinc-900 px-2.5 py-0.5 text-zinc-600 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Image Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[320px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400 mb-3" />
              <p className="text-sm font-semibold">Browsing Wikimedia Commons...</p>
              <p className="text-xs text-zinc-400 mt-1">Retrieving verified educational illustrations</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-2xl p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
              <ImageIcon size={36} className="mb-2 opacity-50" />
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                No verified educational images found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs mt-1">Try a simpler scientific name or broader topic.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, idx) => {
                const isSelected = selectedImage?.url === img.url || currentImageUrl === img.url;
                const isSVGDiagram = img.url.startsWith('data:image/svg');

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`group relative flex flex-col rounded-2xl border cursor-pointer overflow-hidden transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt || 'Educational visual'}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Selected badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      )}

                      {/* Special AI badge for diagram */}
                      {isSVGDiagram && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-blue-600/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                          <Sparkles size={10} />
                          <span>e-Mate Schematic</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <div>
                        <p className="text-xs font-semibold line-clamp-1 text-zinc-900 dark:text-zinc-100">
                          {img.alt || 'Educational figure'}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {img.attribution || img.sourceName}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-sm">
                          {img.license ? img.license.split('/')[0].slice(0, 16) : 'Verified License'}
                        </span>

                        <div className="flex items-center gap-2">
                          {img.sourceUrl && !isSVGDiagram && (
                            <a
                              href={img.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                              title="View Commons page"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApply(img);
                            }}
                            className="rounded-full bg-blue-600 hover:bg-blue-700 px-3 py-1 text-[11px] font-semibold text-white shadow-xs transition cursor-pointer active:scale-95"
                          >
                            Use Image
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4 border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedImage ? `Selected: ${selectedImage.alt.slice(0, 45)}...` : 'Click an image to select it for this flashcard'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedImage}
              onClick={() => selectedImage && handleApply(selectedImage)}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-40 transition cursor-pointer active:scale-95"
            >
              <Check size={14} />
              <span>Apply to Flashcard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
