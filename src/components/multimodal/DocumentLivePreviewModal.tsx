'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Presentation,
  FileText,
  Copy,
  Check,
  Loader2,
  Sparkles,
  BookOpen,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToDocx, exportToPptx, downloadFile } from '@/lib/documentExport';
import type { GeneratedDocument } from './DocumentGenerationCard';

interface DocumentLivePreviewModalProps {
  doc: GeneratedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

interface ParsedSlide {
  title: string;
  bullets: string[];
  notes?: string;
}

function parseSlides(markdown: string): ParsedSlide[] {
  const rawSections = markdown.split(/---SLIDE:[^-]*---/).filter((s) => s.trim().length > 0);

  if (rawSections.length > 0) {
    return rawSections.map((sec, idx) => {
      const lines = sec.trim().split('\n');
      const titleLine = lines.find((l) => l.trim().startsWith('## ') || l.trim().startsWith('# '));
      const title = titleLine ? titleLine.replace(/^#{1,2}\s+/, '').trim() : `Slide ${idx + 1}`;

      const notesLine = lines.find((l) => l.includes('[Speaker notes:') || l.includes('Speaker notes:'));
      const notes = notesLine
        ? notesLine.replace(/\[?Speaker notes:?\s*/i, '').replace(/\]$/, '').trim()
        : undefined;

      const bullets = lines
        .filter((l) => {
          const t = l.trim();
          if (t.startsWith('#')) return false;
          if (t.includes('Speaker notes:')) return false;
          return (
            t.startsWith('- ') ||
            t.startsWith('* ') ||
            t.startsWith('• ') ||
            /^\d+\.\s+/.test(t) ||
            /^\*\*.+\*\*/.test(t)
          );
        })
        .map((l) => l.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim());

      return {
        title,
        bullets: bullets.length > 0 ? bullets : [sec.replace(/^#{1,6}\s+.*$/gm, '').trim().slice(0, 200)],
        notes,
      };
    });
  }

  // Fallback split by ##
  const parts = markdown.split(/(?=^##\s+)/m).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((part, idx) => {
      const lines = part.trim().split('\n');
      const title = lines[0].replace(/^##\s+/, '').trim();
      const bullets = lines
        .slice(1)
        .filter((l) => l.trim().length > 0)
        .map((l) => l.replace(/^[-*•]\s+/, '').trim());
      return {
        title: title || `Slide ${idx + 1}`,
        bullets: bullets.length > 0 ? bullets : ['Key point overview'],
      };
    });
  }

  return [{ title: 'Overview', bullets: [markdown.slice(0, 300)] }];
}

export default function DocumentLivePreviewModal({
  doc,
  isOpen,
  onClose,
  theme = 'dark',
}: DocumentLivePreviewModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const isPptx = doc?.format === 'pptx';
  const slides = isPptx && doc?.content ? parseSlides(doc.content) : [];

  // Keyboard navigation for presentation slides
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !isPptx) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    },
    [isOpen, isPptx, slides.length, isFullscreen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset slide index on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || !doc) return null;

  const currentSlide = slides[currentSlideIndex];
  const safeTitle = (doc.title || 'document').replace(/[^a-z0-9_-]/gi, '_');

  const handleDownload = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      if (isPptx) {
        toast.info('Generating PowerPoint (.pptx) file…');
        const blob = await exportToPptx(doc.title, doc.content);
        downloadFile(blob, `${safeTitle}.pptx`);
        toast.success(`Downloaded ${safeTitle}.pptx`);
      } else {
        toast.info('Generating Word (.docx) file…');
        const blob = await exportToDocx(doc.title, doc.content);
        downloadFile(blob, `${safeTitle}.docx`);
        toast.success(`Downloaded ${safeTitle}.docx`);
      }
    } catch (err: any) {
      toast.error(`Download failed: ${err?.message || 'Error exporting'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.content);
    setCopied(true);
    toast.success('Document copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Container */}
      <div
        className={`relative flex flex-col w-full rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-5xl h-[88vh] max-h-[900px]'
        } ${isDark ? 'bg-[#0f1117] border-white/10 text-zinc-100' : 'bg-[#fafafa] border-zinc-200 text-zinc-900'}`}
      >
        {/* ── Top Header Bar ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 dark:border-white/10 bg-black/10">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                isPptx
                  ? isDark
                    ? 'bg-[#3b2316] border-[#5e321e] text-[#f59e0b]'
                    : 'bg-amber-100 border-amber-300 text-amber-700'
                  : isDark
                    ? 'bg-[#1e2338] border-[#2f395c] text-[#60a5fa]'
                    : 'bg-blue-100 border-blue-200 text-blue-700'
              }`}
            >
              {isPptx ? <Presentation size={18} /> : <FileText size={18} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Live Preview
                </span>
                <p className="text-sm font-semibold truncate">{doc.title}</p>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isPptx ? `Presentation · ${slides.length} slides` : 'Word Document · Structured Markdown'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-zinc-300"
              title="Copy text"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors cursor-pointer shadow-md"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Download {isPptx ? '.pptx' : '.docx'}</span>
            </button>

            {isPptx && (
              <button
                type="button"
                onClick={() => setIsFullscreen((v) => !v)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Main Preview Content ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isPptx ? (
            /* ── Presentation 16:9 Canvas Viewer ── */
            <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 overflow-hidden bg-black/40">
              {/* Slide Screen (16:9 Aspect Ratio) */}
              <div className="flex-1 flex items-center justify-center min-h-0">
                <div
                  className="relative w-full max-w-4xl aspect-[16/9] rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between overflow-hidden border border-white/10"
                  style={{
                    background: currentSlideIndex === 0
                      ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                      : 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                  }}
                >
                  {/* Slide Header */}
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {currentSlideIndex === 0 ? 'Title Slide' : `Slide ${currentSlideIndex + 1}`}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {currentSlideIndex + 1} of {slides.length}
                      </span>
                    </div>

                    <h2
                      className={`font-bold tracking-tight text-white ${
                        currentSlideIndex === 0 ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'
                      }`}
                    >
                      {currentSlide?.title}
                    </h2>
                  </div>

                  {/* Slide Bullets */}
                  <div className="my-auto py-4 space-y-3">
                    {currentSlide?.bullets.map((bullet, bi) => {
                      const cleanBullet = bullet.replace(/\*\*(.*?)\*\*/g, '$1');
                      return (
                        <div key={bi} className="flex items-start gap-3">
                          <span className="flex h-2 w-2 rounded-full bg-amber-400 mt-2 shrink-0 shadow-xs shadow-amber-400/50" />
                          <p className="text-sm sm:text-base leading-relaxed text-zinc-200 font-medium">
                            {cleanBullet}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Slide Footer / Speaker Notes */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-400">e-Mate AI Studio</span>
                    {currentSlide?.notes && (
                      <span className="truncate max-w-md italic text-amber-300/80">
                        💡 Notes: {currentSlide.notes}
                      </span>
                    )}
                    <span>{currentSlideIndex + 1} / {slides.length}</span>
                  </div>
                </div>
              </div>

              {/* ── Slide Navigation Bar ── */}
              <div className="mt-4 flex items-center justify-between max-w-4xl mx-auto w-full px-2">
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={currentSlideIndex === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                {/* Thumbnail Dots */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs px-2 no-scrollbar">
                  {slides.map((_, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setCurrentSlideIndex(sIdx)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        currentSlideIndex === sIdx
                          ? 'w-7 bg-amber-400'
                          : 'w-2.5 bg-white/20 hover:bg-white/40'
                      }`}
                      title={`Go to slide ${sIdx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => Math.min(prev + 1, slides.length - 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* ── Document Reader A4 View ── */
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-zinc-950/40">
              <div
                className={`w-full max-w-3xl rounded-2xl p-6 sm:p-12 shadow-2xl border transition-colors ${
                  isDark
                    ? 'bg-[#18181b] border-white/10 text-zinc-200'
                    : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200'
                }`}
                style={{ fontFamily: "'Calibri', 'Inter', sans-serif" }}
              >
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  {doc.content.split('\n\n').map((block, bIdx) => {
                    const trimmed = block.trim();
                    if (!trimmed) return null;

                    if (trimmed.startsWith('# ')) {
                      return (
                        <h1
                          key={bIdx}
                          className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400 border-b pb-2 mb-4"
                        >
                          {trimmed.replace(/^#\s+/, '')}
                        </h1>
                      );
                    }
                    if (trimmed.startsWith('## ')) {
                      return (
                        <h2
                          key={bIdx}
                          className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 mt-6 mb-3"
                        >
                          {trimmed.replace(/^##\s+/, '')}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith('### ')) {
                      return (
                        <h3
                          key={bIdx}
                          className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mt-4 mb-2"
                        >
                          {trimmed.replace(/^###\s+/, '')}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                      const items = trimmed.split('\n').filter(Boolean);
                      return (
                        <ul key={bIdx} className="space-y-1.5 list-disc pl-5">
                          {items.map((it, itIdx) => (
                            <li key={itIdx} className="text-sm leading-relaxed">
                              {it.replace(/^[-*]\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    return (
                      <p key={bIdx} className="text-sm sm:text-base leading-relaxed text-zinc-300">
                        {trimmed.replace(/\*\*(.*?)\*\*/g, '$1')}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
