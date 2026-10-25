'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Play,
  Pause,
  Presentation,
  FileText,
  Copy,
  Check,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToDocx, exportToPptx, downloadFile } from '@/lib/documentExport';
import {
  createPresentationCoverSvg,
  omitModelTitleSlide,
  extractPresentationCoverData,
} from '@/lib/presentationCover';
import { parseMarkdownDocument, detectDocumentTemplate, type MarkdownBlock } from '@/lib/standardDocument';
import type { GeneratedDocument } from './DocumentGenerationCard';

interface DocumentLivePreviewModalProps {
  doc: GeneratedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  theme?: 'light' | 'dark';
  inline?: boolean;
}

interface ParsedSlide {
  title: string;
  bullets: string[];
  notes?: string;
  isCover?: boolean;
}

function parseSlides(markdown: string, presentationTitle: string): ParsedSlide[] {
  const presentationContent = omitModelTitleSlide(markdown);
  const rawSections = presentationContent.split(/---SLIDE:[^-]*---/).filter((s) => s.trim().length > 0);
  let contentSlides: ParsedSlide[];

  if (rawSections.length > 0) {
    contentSlides = rawSections.map((sec, idx) => {
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
  } else {
    // Fallback split by ##
    const parts = presentationContent.split(/(?=^##\s+)/m).filter(Boolean);
    if (parts.length > 1) {
      contentSlides = parts.map((part, idx) => {
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
    } else {
      contentSlides = [{ title: 'Overview', bullets: [presentationContent.slice(0, 300)] }];
    }
  }

  const coverData = extractPresentationCoverData(markdown, presentationTitle);
  return [
    {
      title: coverData.title,
      bullets: coverData.subtitle ? [coverData.subtitle] : [],
      notes: coverData.speakerNotes,
      isCover: true,
    },
    ...contentSlides,
  ];
}

// ── Height-aware pagination for true A4 page flow ─────────────────────────
function estimateBlockHeight(block: MarkdownBlock): number {
  switch (block.type) {
    case 'h1':
      return 62;
    case 'h2':
      return 48;
    case 'h3':
      return 36;
    case 'two-column-row':
      return 28;
    case 'contact-bar':
      return 32;
    case 'equation':
      return 65;
    case 'callout':
      return 75;
    case 'blockquote':
      return 65;
    case 'table':
      return 45 + (block.data.rows?.length || 1) * 38 + 24;
    case 'bullet-list':
      return (block.items?.length || 1) * 28 + 12;
    case 'ordered-list':
      return (block.items?.length || 1) * 28 + 12;
    case 'divider':
      return 26;
    case 'paragraph':
    default: {
      const len = (block as any).text?.length || 60;
      const lines = Math.ceil(len / 85);
      return Math.max(34, lines * 23 + 12);
    }
  }
}

function paginateDocumentBlocks(blocks: MarkdownBlock[]): MarkdownBlock[][] {
  if (!blocks || blocks.length === 0) return [[]];

  const pages: MarkdownBlock[][] = [];
  let currentPage: MarkdownBlock[] = [];
  let currentHeight = 0;

  // Page 1 header block consumes ~140px, so page 1 available content is ~700px
  // Pages 2+ have running header and full body area, so available content is ~860px
  let pageMaxHeight = 700;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockH = estimateBlockHeight(block);

    if (currentPage.length > 0 && currentHeight + blockH > pageMaxHeight) {
      // Prevent orphan heading at the very bottom of the page
      const lastBlock = currentPage[currentPage.length - 1];
      if (lastBlock.type === 'h1' || lastBlock.type === 'h2' || lastBlock.type === 'h3') {
        currentPage.pop();
        pages.push(currentPage);
        currentPage = [lastBlock, block];
        currentHeight = estimateBlockHeight(lastBlock) + blockH;
      } else {
        pages.push(currentPage);
        currentPage = [block];
        currentHeight = blockH;
      }
      pageMaxHeight = 860;
    } else {
      currentPage.push(block);
      currentHeight += blockH;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [[]];
}

function renderInlineContent(text: string, isDark: boolean): React.ReactNode {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-950'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className={`italic ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            isDark ? 'bg-zinc-800 text-blue-400' : 'bg-zinc-100 text-blue-600'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function DocumentLivePreviewModal({
  doc,
  isOpen,
  onClose,
  onMinimize,
  theme = 'dark',
  inline = false,
}: DocumentLivePreviewModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fitToView, setFitToView] = useState(true);
  const [docScale, setDocScale] = useState(100);
  const isDark = theme === 'dark';

  const isPptx = doc?.format === 'pptx';
  const slides = isPptx && doc?.content ? parseSlides(doc.content, doc.title) : [];

  const parsedDoc = useMemo(() => {
    if (isPptx || !doc?.content) return null;
    return parseMarkdownDocument(doc.content, doc.title);
  }, [isPptx, doc?.content, doc?.title]);

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
        onClose();
      }
    },
    [isOpen, isPptx, slides.length, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset slide index on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
      setIsPlaying(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isPlaying || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrentSlideIndex((index) => (index + 1 >= slides.length ? 0 : index + 1));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPlaying, slides.length]);

  if (!isOpen || !doc) return null;

  const currentSlide = slides[currentSlideIndex];
  const coverSvg = isPptx && doc
    ? createPresentationCoverSvg(doc.title || 'Presentation', doc.content, { slideCount: slides.length })
    : '';
  const coverImage = isPptx
    ? `url("data:image/svg+xml,${encodeURIComponent(coverSvg)}")`
    : undefined;
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
    <div className={inline
      ? 'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'
      : `fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 ${isPptx ? '' : 'p-3 sm:p-6'}`}>
      {/* Container */}
      <div
        className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden ${inline ? 'h-full w-full max-w-none' : isPptx ? 'h-full w-full max-w-none' : 'h-[88vh] max-h-[900px] w-full max-w-5xl rounded-3xl border shadow-2xl'} ${isDark ? 'bg-[#0f1117] text-zinc-100' : 'bg-[#fafafa] text-zinc-900'}`}
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
                {isPptx
                  ? `Presentation · ${slides.length} slides`
                  : parsedDoc
                    ? `${parsedDoc.metadata.docType} · ${paginateDocumentBlocks(parsedDoc.blocks).length} page${paginateDocumentBlocks(parsedDoc.blocks).length !== 1 ? 's' : ''}`
                    : 'Document · .docx'}
              </p>
            </div>
          </div>

          {/* Doc Zoom Controls — accessible 0-100 scale option */}
          {!isPptx && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 shrink-0" role="group" aria-label="Document page scale">
              <button
                type="button"
                aria-label="Decrease page size (-)"
                title="Zoom out"
                onClick={() => setDocScale((s) => Math.max(0, s - 10))}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={docScale <= 0}
              >
                <ZoomOut size={14} />
              </button>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={docScale}
                onChange={(e) => setDocScale(Number(e.target.value))}
                className="w-24 h-1 accent-amber-400 cursor-pointer"
                aria-label="Page scale (0-100)"
              />
              <button
                type="button"
                aria-label="Increase page size (+)"
                title="Zoom in"
                onClick={() => setDocScale((s) => Math.min(100, s + 10))}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={docScale >= 100}
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDocScale(100)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums transition-colors cursor-pointer ${
                  docScale !== 100
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Reset scale to 100%"
                aria-label="Reset scale to 100%"
              >
                {docScale}%
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isPptx && onMinimize && (
              <button
                type="button"
                onClick={onMinimize}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize to Files"
                aria-label="Minimize preview to Files"
              >
                <Minimize2 size={16} />
              </button>
            )}
            {!inline && <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-zinc-300"
              title="Copy text"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>}
            {isPptx && <button
              type="button"
              onClick={() => setFitToView((fit) => !fit)}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10"
              aria-label={fitToView ? 'Use actual slide size' : 'Fit slide to panel'}
              title={fitToView ? 'Fit' : '100%'}
            >{fitToView ? 'Fit' : '100%'}</button>}
            {isPptx && <button
              type="button"
              onClick={() => setIsPlaying((playing) => !playing)}
              className="rounded-xl border border-white/10 p-2 text-zinc-300 hover:bg-white/10"
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              title={isPlaying ? 'Pause' : 'Play'}
            >{isPlaying ? <Pause size={16} /> : <Play size={16} />}</button>}

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors cursor-pointer shadow-md"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Download {isPptx ? '.pptx' : '.docx'}</span>
            </button>

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
              <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 overflow-hidden bg-black/40">
              {/* Slide Screen (16:9 Aspect Ratio) */}
                <div className="flex-1 flex items-center justify-center min-h-0 overflow-auto">
                <div
                  className={`relative aspect-[16/9] overflow-hidden border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl flex flex-col justify-between ${fitToView ? 'w-full max-w-6xl' : 'w-[960px] max-w-none shrink-0'}`}
                  style={{
                    background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
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
                        currentSlideIndex === 0 ? 'text-2xl sm:text-4xl lg:text-5xl' : 'text-xl sm:text-3xl'
                      }`}
                    >
                      {currentSlide?.title}
                    </h2>

                    {currentSlideIndex === 0 && (
                      <div className="h-1 w-16 sm:w-20 rounded-full bg-amber-400 mt-3 sm:mt-4" />
                    )}
                  </div>

                  {/* Slide Bullets */}
                  <div className="my-auto py-4 space-y-3">
                    {currentSlideIndex === 0 && currentSlide?.bullets.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-base sm:text-xl text-zinc-300 font-normal leading-relaxed max-w-3xl">
                          {currentSlide.bullets[0].replace(/\*\*(.*?)\*\*/g, '$1')}
                        </p>
                        {currentSlide.bullets.slice(1).map((bullet, bi) => {
                          const cleanBullet = bullet.replace(/\*\*(.*?)\*\*/g, '$1');
                          return (
                            <div key={bi} className="flex items-start gap-3 pt-1">
                              <span className="flex h-2 w-2 rounded-full bg-amber-400 mt-2 shrink-0 shadow-xs shadow-amber-400/50" />
                              <p className="text-sm sm:text-base leading-relaxed text-zinc-200 font-medium">
                                {cleanBullet}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      currentSlide?.bullets.map((bullet, bi) => {
                        const cleanBullet = bullet.replace(/\*\*(.*?)\*\*/g, '$1');
                        return (
                          <div key={bi} className="flex items-start gap-3">
                            <span className="flex h-2 w-2 rounded-full bg-amber-400 mt-2 shrink-0 shadow-xs shadow-amber-400/50" />
                            <p className="text-sm sm:text-base leading-relaxed text-zinc-200 font-medium">
                              {cleanBullet}
                            </p>
                          </div>
                        );
                      })
                    )}
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
            /* ── Paginated Document Reader (Word Print-Layout style) ── */
            <div
              className={`flex-1 overflow-y-auto overflow-x-auto flex justify-center ${
                isDark ? 'bg-[#3f4245]' : 'bg-[#b8bcc0]'
              }`}
              style={{ padding: '28px 16px' }}
            >
              {parsedDoc && (() => {
                const pages = paginateDocumentBlocks(parsedDoc.blocks);

                // Template-derived page styles
                const isResume = parsedDoc.template === 'resume';
                const isInvoice = parsedDoc.template === 'invoice';
                const isAcademic = parsedDoc.template === 'academic';
                const isAssignment = parsedDoc.template === 'assignment';
                const isSerifDoc = !isInvoice;

                const pageBg = isInvoice ? '#f8faff' : '#ffffff';
                const pageFont = isInvoice
                  ? "'Calibri', 'Segoe UI', -apple-system, sans-serif"
                  : "'Georgia', 'Cambria', 'Times New Roman', serif";

                // Scale 0-100 adjusts page width between 500px and 816px (full A4 size)
                // Text remains standard readable size while page size adjusts smoothly
                const pageWidth = Math.round(500 + (docScale / 100) * (816 - 500));
                const pageMinHeight = Math.round(pageWidth * 1.414);
                const horizontalPadding = Math.round(44 + (docScale / 100) * (64 - 44));
                const verticalPadding = Math.round(48 + (docScale / 100) * (64 - 48));

                return (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '24px',
                      paddingBottom: '32px',
                    }}
                  >
                    {pages.map((pageBlocks, pageIdx) => (
                      <div
                        key={pageIdx}
                        style={{
                          width: `${pageWidth}px`,
                          minHeight: `${pageMinHeight}px`,
                          background: pageBg,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)',
                          borderRadius: '2px',
                          padding: `${verticalPadding}px ${horizontalPadding}px`,
                          fontFamily: pageFont,
                          fontSize: '13.5px',
                          display: 'flex',
                          flexDirection: 'column',
                          boxSizing: 'border-box',
                          position: 'relative',
                          transition: 'width 0.12s ease-out, min-height 0.12s ease-out',
                        }}
                      >
                        {/* Page Header (running title, shown on pages 2+) */}
                        {pageIdx > 0 && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '10.5px',
                            color: '#94a3b8',
                            fontFamily: "'Calibri', 'Segoe UI', sans-serif",
                            borderBottom: '1px solid #e2e8f0',
                            paddingBottom: '8px',
                            marginBottom: '20px',
                            flexShrink: 0,
                          }}>
                            <span style={{ fontStyle: 'italic', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {parsedDoc.title}
                            </span>
                            <span>e-Mate AI Studio</span>
                          </div>
                        )}

                        {/* Page Content */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* First page: Template-specific header */}
                          {pageIdx === 0 && (
                            <>
                              {isResume ? (
                                <header style={{ marginBottom: '20px', flexShrink: 0 }}>
                                  <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#000', margin: 0, lineHeight: 1.1 }}>
                                    {parsedDoc.title}
                                  </h1>
                                  {(() => {
                                    const cb = parsedDoc.blocks.find(b => b.type === 'contact-bar') as any;
                                    return cb ? (
                                      <p style={{ marginTop: '8px', fontSize: '11.5px', color: '#333', borderBottom: '1.5px solid #000', paddingBottom: '8px' }}>
                                        {cb.items.join('   |   ')}
                                      </p>
                                    ) : (
                                      <div style={{ borderBottom: '1.5px solid #000', marginTop: '10px', paddingBottom: '4px' }} />
                                    );
                                  })()}
                                </header>
                              ) : isAssignment ? (
                                <header style={{ marginBottom: '28px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '20px', flexShrink: 0 }}>
                                  <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>
                                    {parsedDoc.title}
                                  </h1>
                                  {parsedDoc.subtitle && (
                                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#334155', fontFamily: 'Georgia, serif' }}>
                                      {parsedDoc.subtitle}
                                    </p>
                                  )}
                                  {parsedDoc.authorInfo?.email && (
                                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                                      {parsedDoc.authorInfo.email}
                                    </p>
                                  )}
                                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                                    {parsedDoc.authorInfo?.institution || `e-Mate University — ${parsedDoc.metadata.date}`}
                                  </p>
                                </header>
                              ) : isInvoice ? (
                                <header style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '3px solid #003366', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                                  <div>
                                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#003366', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
                                      EMATE ENTERPRISES
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                                      contact@emate.ai  ·  (800) 555-0199
                                    </p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#003366', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0 }}>
                                      {parsedDoc.title}
                                    </h1>
                                    <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                                      {parsedDoc.metadata.date}
                                    </p>
                                  </div>
                                </header>
                              ) : isAcademic ? (
                                <header style={{ marginBottom: '26px', borderBottom: '1px solid #cbd5e1', paddingBottom: '18px', flexShrink: 0 }}>
                                  <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontFamily: 'Georgia, serif', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                    {parsedDoc.title}
                                  </h1>
                                  {parsedDoc.subtitle && (
                                    <p style={{ margin: '6px 0 0', fontSize: '14.5px', color: '#475569', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                                      {parsedDoc.subtitle}
                                    </p>
                                  )}
                                </header>
                              ) : (
                                /* Executive & General Reports — matching professional document standards */
                                <header style={{ marginBottom: '24px', paddingBottom: '14px', borderBottom: '2px solid #0f172a', flexShrink: 0 }}>
                                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.25, fontFamily: 'Georgia, serif' }}>
                                    {parsedDoc.title}
                                  </h1>
                                  {parsedDoc.subtitle && (
                                    <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#475569', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'Georgia, serif' }}>
                                      {renderInlineContent(parsedDoc.subtitle, false)}
                                    </p>
                                  )}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', paddingTop: '4px', fontFamily: "'Calibri', sans-serif" }}>
                                    <span style={{ fontWeight: 600, color: '#334155' }}>e-Mate AI Studio</span>
                                    <span>{parsedDoc.metadata.date}</span>
                                  </div>
                                </header>
                              )}
                            </>
                          )}

                          {/* Blocks for this page */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
                            {pageBlocks.map((block, blockIdx) => {
                              // Skip first h1 on page 0 (already rendered in header above)
                              if (pageIdx === 0 && block.type === 'h1' && (blockIdx === 0 || (blockIdx === 1 && pageBlocks[0].type === 'h1'))) return null;
                              // Skip contact-bar on page 0 — shown in resume header
                              if (pageIdx === 0 && isResume && block.type === 'contact-bar') return null;

                              // ── H1 (chapter / major title) ──────────────────
                              if (block.type === 'h1') {
                                return (
                                  <h1 key={blockIdx} style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '22px 0 6px', letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: isSerifDoc ? 'Georgia, serif' : 'inherit', borderBottom: isResume ? '2px solid #000' : '1px solid #e2e8f0', paddingBottom: '6px' }}>
                                    {block.text}
                                  </h1>
                                );
                              }

                              // ── H2 (section heading) ─────────────────────────
                              if (block.type === 'h2') {
                                if (isResume) {
                                  return (
                                    <h2 key={blockIdx} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#111', margin: '20px 0 6px', paddingBottom: '3px', borderBottom: '1.5px solid #111', fontFamily: 'Georgia, serif' }}>
                                      {block.text}
                                    </h2>
                                  );
                                }
                                return (
                                  <h2 key={blockIdx} style={{ fontSize: '16.5px', fontWeight: 700, color: isInvoice ? '#003366' : '#0f172a', margin: '20px 0 6px', paddingBottom: '4px', borderBottom: `1.5px solid ${isInvoice ? '#003366' : '#e2e8f0'}`, lineHeight: 1.3, fontFamily: isSerifDoc ? 'Georgia, serif' : 'inherit' }}>
                                    {block.text}
                                  </h2>
                                );
                              }

                              // ── H3 (subsection) ──────────────────────────────
                              if (block.type === 'h3') {
                                if (isResume) {
                                  return <h3 key={blockIdx} style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '10px 0 1px', fontFamily: 'Georgia, serif' }}>{block.text}</h3>;
                                }
                                return (
                                  <h3 key={blockIdx} style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: '14px 0 4px', fontFamily: isSerifDoc ? 'Georgia, serif' : 'inherit', letterSpacing: '-0.01em' }}>
                                    {block.text}
                                  </h3>
                                );
                              }

                              // ── Two-column row (job title | date, company | city) ──
                              if (block.type === 'two-column-row') {
                                return (
                                  <div key={blockIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', margin: '1px 0' }}>
                                    <span style={{ fontSize: '12px', fontWeight: block.isBold ? 700 : 400, fontStyle: block.isItalic ? 'italic' : 'normal', color: '#0f172a' }}>
                                      {block.left.replace(/^\*+|\*+$/g, '')}
                                    </span>
                                    <span style={{ fontSize: '11.5px', color: '#64748b', flexShrink: 0, fontStyle: block.isItalic ? 'italic' : 'normal', textAlign: 'right' }}>
                                      {block.right.replace(/^\*+|\*+$/g, '')}
                                    </span>
                                  </div>
                                );
                              }

                              // ── Contact bar (resume) ──────────────────────────
                              if (block.type === 'contact-bar') {
                                return (
                                  <p key={blockIdx} style={{ fontSize: '11.5px', color: '#475569', borderBottom: '1.5px solid #111', paddingBottom: '6px', margin: '2px 0 8px', letterSpacing: '0.01em' }}>
                                    {block.items.join('  |  ')}
                                  </p>
                                );
                              }

                              // ── Equation (assignment) ─────────────────────────
                              if (block.type === 'equation') {
                                return (
                                  <div key={blockIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 24px', padding: '10px 20px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ flex: 1, textAlign: 'center', fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: '14.5px', color: '#0f172a' }}>{block.formula}</span>
                                    {block.number && <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', flexShrink: 0 }}>({block.number})</span>}
                                  </div>
                                );
                              }

                              // ── Callout / note box ───────────────────────────
                              if (block.type === 'callout') {
                                return (
                                  <div key={blockIdx} style={{ display: 'flex', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderLeft: '4px solid #334155', borderRadius: '0 4px 4px 0', margin: '6px 0' }}>
                                    <span style={{ fontSize: '15px', flexShrink: 0, lineHeight: 1.4, color: '#334155' }}>{block.icon || 'ⓘ'}</span>
                                    <div>
                                      {block.calloutTitle && <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', margin: '0 0 2px', fontFamily: 'Calibri, sans-serif' }}>{block.calloutTitle}</p>}
                                      <p style={{ fontSize: '12.5px', color: '#334155', margin: 0, lineHeight: 1.55 }}>{renderInlineContent(block.text, false)}</p>
                                    </div>
                                  </div>
                                );
                              }

                              // ── Blockquote ───────────────────────────────────
                              if (block.type === 'blockquote') {
                                return (
                                  <blockquote key={blockIdx} style={{ borderLeft: '4px solid #0f172a', background: 'rgba(15,23,42,0.03)', margin: '8px 0', padding: '9px 14px', fontStyle: 'italic', color: '#334155', fontSize: '13px', lineHeight: 1.6 }}>
                                    {renderInlineContent(block.text, false)}
                                  </blockquote>
                                );
                              }

                              // ── Bullet list ──────────────────────────────────
                              if (block.type === 'bullet-list') {
                                return (
                                  <ul key={blockIdx} style={{ margin: '4px 0 8px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                                    {block.items.map((it, ii) => (
                                      <li key={ii} style={{ color: '#1e293b', fontSize: '13px', lineHeight: 1.6, fontFamily: isSerifDoc ? 'Georgia, serif' : 'inherit' }}>
                                        {renderInlineContent(it, false)}
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }

                              // ── Ordered list ─────────────────────────────────
                              if (block.type === 'ordered-list') {
                                return (
                                  <ol key={blockIdx} style={{ margin: '4px 0 8px', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {block.items.map((it, ii) => (
                                      <li key={ii} style={{ color: '#1e293b', fontSize: '13px', lineHeight: 1.6, fontFamily: isSerifDoc ? 'Georgia, serif' : 'inherit' }}>
                                        {renderInlineContent(it, false)}
                                      </li>
                                    ))}
                                  </ol>
                                );
                              }

                              // ── Table ────────────────────────────────────────
                              if (block.type === 'table') {
                                const { headers, rows } = block.data;
                                return (
                                  <div key={blockIdx} style={{ margin: '10px 0', overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'auto', border: '1px solid #cbd5e1' }}>
                                      <thead>
                                        <tr style={{ background: isInvoice ? '#003366' : '#f1f5f9', borderBottom: '2px solid #94a3b8' }}>
                                          {headers.map((h, hi) => (
                                            <th key={hi} style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'left', color: isInvoice ? '#fff' : '#0f172a', fontSize: '11px', textTransform: isInvoice ? 'uppercase' : 'none', letterSpacing: isInvoice ? '0.05em' : 'normal', borderRight: '1px solid #e2e8f0' }}>
                                              {renderInlineContent(h, false)}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {rows.map((row, ri) => (
                                          <tr key={ri} style={{ background: ri % 2 === 1 ? '#f8fafc' : '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                                            {row.map((cell, ci) => (
                                              <td key={ci} style={{ padding: '7px 12px', color: '#1e293b', fontSize: '12px', verticalAlign: 'top', borderRight: '1px solid #f1f5f9' }}>
                                                {renderInlineContent(cell, false)}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              }

                              // ── Divider ──────────────────────────────────────
                              if (block.type === 'divider') {
                                return <hr key={blockIdx} style={{ margin: '14px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />;
                              }

                              // ── Paragraph ────────────────────────────────────
                              return (
                                <p key={blockIdx} style={{ color: '#1e293b', margin: '0', lineHeight: 1.7, fontSize: '13px', fontFamily: pageFont, textAlign: isAcademic ? 'justify' : 'left' }}>
                                  {renderInlineContent(block.text, false)}
                                </p>
                              );
                            })}
                          </div>
                        </div>

                        {/* Page Footer — natural flex child at bottom, NEVER overlaps content */}
                        <div style={{
                          marginTop: 'auto',
                          paddingTop: '16px',
                          borderTop: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: isAssignment ? 'center' : 'space-between',
                          alignItems: 'center',
                          fontSize: '11px',
                          color: '#64748b',
                          fontFamily: "'Calibri', 'Segoe UI', sans-serif",
                          flexShrink: 0,
                        }}>
                          {!isAssignment && <span style={{ fontStyle: 'italic', maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parsedDoc.title}</span>}
                          <span style={{ fontWeight: 600, color: '#475569' }}>
                            {isAssignment ? (pageIdx + 1) : `Page ${pageIdx + 1} of ${pages.length}`}
                          </span>
                          {!isAssignment && <span>{parsedDoc.metadata.date}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
