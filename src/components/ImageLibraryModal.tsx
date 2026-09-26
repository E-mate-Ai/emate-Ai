'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Copy,
  Check,
  Trash2,
  Maximize2,
  Sparkles,
  Search,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

export interface SavedLibraryImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  subject?: string;
}

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export default function ImageLibraryModal({
  isOpen,
  onClose,
  theme = 'dark',
}: ImageLibraryModalProps) {
  const [images, setImages] = useState<SavedLibraryImage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [activeLightboxImage, setActiveLightboxImage] = useState<SavedLibraryImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isDark = theme === 'dark';

  // Load images from localStorage
  const loadImages = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('nk-image-library');
      if (stored) {
        setImages(JSON.parse(stored));
      } else {
        setImages([]);
      }
    } catch {
      setImages([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen]);

  // Listen for image updates in real time
  useEffect(() => {
    const handleUpdate = () => loadImages();
    window.addEventListener('nk-image-library-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('nk-image-library-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Keyboard navigation (Escape key)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeLightboxImage) {
          setActiveLightboxImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeLightboxImage, onClose]);

  // Unique subjects for filter pills
  const subjects = useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => {
      if (img.subject) set.add(img.subject);
    });
    return Array.from(set);
  }, [images]);

  // Filtered images
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const matchesSearch =
        !searchQuery ||
        img.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject =
        selectedSubject === 'all' || img.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [images, searchQuery, selectedSubject]);

  const handleCopyPrompt = (img: SavedLibraryImage) => {
    navigator.clipboard.writeText(img.prompt);
    setCopiedId(img.id);
    toast.success('Prompt copied to clipboard');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDownload = (img: SavedLibraryImage) => {
    if (!img.url) return;
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `e-mate-visual-${img.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Downloading visual note');
  };

  const handleDelete = (id: string) => {
    try {
      const updated = images.filter((i) => i.id !== id);
      setImages(updated);
      localStorage.setItem('nk-image-library', JSON.stringify(updated));
      window.dispatchEvent(new Event('nk-image-library-updated'));
      toast.success('Image removed from library');
    } catch {
      toast.error('Failed to remove image');
    }
  };

  const handleClearAll = () => {
    if (!window.confirm('Are you sure you want to remove all saved images from your library?')) return;
    setImages([]);
    localStorage.removeItem('nk-image-library');
    window.dispatchEvent(new Event('nk-image-library-updated'));
    toast.success('Library cleared');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl h-[88vh] max-h-[850px] rounded-xl flex flex-col overflow-hidden shadow-lg border transition-all animate-in zoom-in-95 duration-200 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-5 border-b shrink-0 ${
            isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Visual Library
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                    isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {images.length} {images.length === 1 ? 'visual' : 'visuals'}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                All generated diagrams, charts, and visual notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {images.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
                    : 'text-zinc-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
              }`}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Subject Filters Bar */}
        <div
          className={`px-6 py-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-100 bg-white'
          }`}
        >
          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search prompts or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8.5 pr-8 py-2 text-xs rounded-lg border text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                isDark ? 'bg-zinc-800/80 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Subject Filter Pills */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  selectedSubject === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                      ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All
              </button>
              {subjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedSubject === sub
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark
                        ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
                        : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body: Image Grid or Empty State */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {filteredImages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-sm ${
                  isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                <Sparkles size={28} />
              </div>
              <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {images.length === 0 ? 'No visual notes in library yet' : 'No matching visuals found'}
              </h3>
              <p className={`text-sm max-w-sm leading-relaxed mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {images.length === 0
                  ? 'Generate study visuals, diagrams, and formulas in the chat using the /image command or the Visual Generator toggle.'
                  : 'Try clearing your search query or subject filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className={`group relative flex flex-col rounded-xl overflow-hidden border transition-all duration-200 hover:shadow-lg ${
                    isDark
                      ? 'bg-zinc-800/50 border-zinc-800 hover:border-indigo-500/50'
                      : 'bg-white border-zinc-200 hover:border-indigo-500/50'
                  }`}
                >
                  {/* Image Display Area */}
                  <div
                    className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-900 cursor-pointer overflow-hidden"
                    onClick={() => setActiveLightboxImage(img)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Overlay with Quick Action Buttons */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLightboxImage(img);
                        }}
                        className="p-2.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-md hover:scale-105 cursor-pointer"
                        title="View Fullscreen"
                      >
                        <Maximize2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(img);
                        }}
                        className="p-2.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-md hover:scale-105 cursor-pointer"
                        title="Download Image"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPrompt(img);
                        }}
                        className="p-2.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-md hover:scale-105 cursor-pointer"
                        title="Copy Prompt"
                      >
                        {copiedId === img.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      </button>
                    </div>

                    {/* Subject badge if present */}
                    {img.subject && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-md bg-black/70 text-white backdrop-blur-md">
                        {img.subject}
                      </span>
                    )}
                  </div>

                  {/* Metadata and prompt footer */}
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <p
                      className={`text-xs line-clamp-2 leading-relaxed mb-3 font-medium cursor-pointer transition-colors ${
                        isDark
                          ? 'text-zinc-200 hover:text-indigo-400'
                          : 'text-zinc-800 hover:text-indigo-600'
                      }`}
                      onClick={() => handleCopyPrompt(img)}
                      title={img.prompt}
                    >
                      {img.prompt}
                    </p>

                    <div
                      className={`flex items-center justify-between pt-3 border-t text-xs ${
                        isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-100 text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>
                          {new Date(img.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(img.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDark
                            ? 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Fullscreen Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="absolute top-5 right-5 flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(activeLightboxImage);
              }}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Download image"
            >
              <Download size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxImage(null);
              }}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div
            className="max-w-4xl max-h-[85vh] flex flex-col items-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeLightboxImage.url}
              alt={activeLightboxImage.prompt}
              className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
            />
            <p className="mt-4 text-sm text-zinc-300 text-center max-w-xl line-clamp-2 px-4 font-medium">
              {activeLightboxImage.prompt}
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
