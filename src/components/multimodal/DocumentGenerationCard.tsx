'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Presentation,
  ChevronDown,
  Loader2,
  FileCode,
  Eye,
  Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToDocx, exportToPptx, downloadFile } from '@/lib/documentExport';
import DocumentLivePreviewModal from './DocumentLivePreviewModal';
import {
  createPresentationCoverSvg,
  createDocumentCoverSvg,
  getPresentationSlideCount,
} from '@/lib/presentationCover';

export type DocumentFormat = 'docx' | 'pptx' | 'markdown';

export interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  format: DocumentFormat;
  wordCount?: number;
  status: 'generating' | 'done' | 'error';
  errorMessage?: string;
}

interface DocumentGenerationCardProps {
  doc: GeneratedDocument;
  theme?: 'light' | 'dark';
  onOpenArtifact?: (artifactId: string) => void;
}

export default function DocumentGenerationCard({
  doc,
  theme = 'dark',
  onOpenArtifact,
}: DocumentGenerationCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);
  const isDark = theme === 'dark';

  const isPresentation = doc.format === 'pptx';
  const formatLabel = isPresentation
    ? 'Presentation · PPTX'
    : doc.format === 'markdown'
      ? 'Document · MD'
      : 'Document · DOCX';

  // ── Generating State ────────────────────────────────────────────────────────
  if (doc.status === 'generating') {
    return (
      <div
        className={`my-3 flex items-center gap-3.5 rounded-2xl px-4 py-3.5 max-w-lg border transition-all ${
          isDark
            ? 'bg-zinc-900/80 border-amber-500/20 text-zinc-200'
            : 'bg-amber-50/70 border-amber-200/80 text-zinc-800'
        }`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
            isPresentation
              ? isDark
                ? 'bg-[#3b2316] border-[#5e321e] text-[#f59e0b]'
                : 'bg-amber-100 border-amber-300 text-amber-700'
              : isDark
                ? 'bg-blue-950/60 border-blue-800/40 text-blue-400'
                : 'bg-blue-100 border-blue-200 text-blue-700'
          }`}
        >
          <Loader2 size={20} className="animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold truncate">
              Generating {isPresentation ? 'presentation' : 'document'}…
            </p>
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
            {doc.title || 'Structuring content, key insights and notes…'}
          </p>
        </div>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────
  if (doc.status === 'error') {
    return (
      <div
        className={`my-3 rounded-2xl px-4 py-3.5 max-w-lg border ${
          isDark ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
          <span>Failed to generate document</span>
        </div>
        <p className="text-[11px] text-red-300/80 mt-1">
          {doc.errorMessage || 'An error occurred while compiling document content.'}
        </p>
      </div>
    );
  }

  // ── Download Handlers ───────────────────────────────────────────────────────
  const handleDownloadPrimary = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isExporting) return;
    setIsExporting(true);
    setMenuOpen(false);

    const safeTitle = (doc.title || 'document').replace(/[^a-z0-9_-]/gi, '_');

    try {
      if (isPresentation) {
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
      toast.error(`Export failed: ${err?.message || 'Could not export'}`);
      const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8' });
      downloadFile(blob, `${safeTitle}.md`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const safeTitle = (doc.title || 'document').replace(/[^a-z0-9_-]/gi, '_');
    const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8' });
    downloadFile(blob, `${safeTitle}.md`);
    setMenuOpen(false);
    toast.success(`Downloaded ${safeTitle}.md`);
  };

  const handleCopyContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(doc.content);
    setCopied(true);
    toast.success('Document text copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
    setMenuOpen(false);
  };

  const slideCount = isPresentation ? getPresentationSlideCount(doc.content) : 0;
  const wordCount = doc.wordCount || (doc.content ? doc.content.split(/\s+/).filter(Boolean).length : 850);
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 420));

  const coverSvg = isPresentation
    ? createPresentationCoverSvg(doc.title, doc.content, { slideCount })
    : createDocumentCoverSvg(doc.title, doc.content, { wordCount, estimatedPages });

  const coverImage = `url("data:image/svg+xml,${encodeURIComponent(coverSvg)}")`;

  const handleOpenPreview = () => {
    if (onOpenArtifact) {
      onOpenArtifact(doc.id);
    } else {
      setLivePreviewOpen(true);
    }
  };

  return (
    <>
      <article
        className={`my-3 w-full max-w-[580px] overflow-hidden rounded-[22px] p-2 transition-colors ${
          isDark ? 'bg-[#202022] text-white' : 'bg-[#f1f1f2] text-zinc-900'
        }`}
      >
        {/* Cover Preview Canvas (Both PPTX & DOCX) */}
        <button
          type="button"
          onClick={handleOpenPreview}
          aria-label={`Preview ${doc.title}`}
          className="relative block aspect-[16/9] w-full overflow-hidden rounded-[15px] bg-[#111827] text-left shadow-inner cursor-pointer group"
          style={{ backgroundImage: coverImage, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <span className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none group-hover:from-black/35 transition-colors" />
          {isPresentation ? (
            slideCount > 1 && (
              <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md border border-white/10">
                {slideCount} slides
              </span>
            )
          ) : (
            <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md border border-white/10">
              {estimatedPages} {estimatedPages === 1 ? 'page' : 'pages'}
            </span>
          )}
        </button>

        {/* Office File Row (Matching PPTX & DOCX Design) */}
        <div className="flex items-center gap-3 px-4 pb-3 pt-4">
          {/* Office Icon Badge */}
          {isPresentation ? (
            <div
              aria-hidden="true"
              className="relative flex h-14 w-12 shrink-0 items-end overflow-hidden rounded-[10px] bg-gradient-to-br from-[#ff7779] to-[#f0444b] shadow-sm"
            >
              <span className="absolute right-0 top-0 h-4 w-4 rounded-bl-md bg-[#ffb0b0]" />
              <span className="mb-1 ml-0.5 rounded-r-md bg-[#c9152b] px-1.5 py-1 text-[13px] font-bold leading-none text-white">
                P
              </span>
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="relative flex h-14 w-12 shrink-0 items-end overflow-hidden rounded-[10px] bg-gradient-to-br from-[#4b88e8] to-[#185abd] shadow-sm"
            >
              <span className="absolute right-0 top-0 h-4 w-4 rounded-bl-md bg-[#9bc0f5]" />
              <span className="mb-1 ml-0.5 rounded-r-md bg-[#103f91] px-1.5 py-1 text-[13px] font-bold leading-none text-white">
                W
              </span>
            </div>
          )}

          {/* Title & Format Label */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-medium leading-6" title={doc.title}>
              {doc.title || (isPresentation ? 'Untitled presentation' : 'Untitled document')}
            </p>
            <p className={`mt-0.5 text-[15px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isPresentation ? 'PPTX' : 'DOCX'}
            </p>
          </div>

          {/* Download Action Button */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleDownloadPrimary()}
              disabled={isExporting}
              className={`rounded-full p-2.5 transition-colors disabled:opacity-50 cursor-pointer ${
                isDark ? 'text-zinc-300 hover:bg-white/10' : 'text-zinc-600 hover:bg-black/5'
              }`}
              title={isPresentation ? 'Download PowerPoint (.pptx)' : 'Download Word Document (.docx)'}
              aria-label={isPresentation ? 'Download PowerPoint (.pptx)' : 'Download Word Document (.docx)'}
            >
              {isExporting ? (
                <Loader2 size={16} className={`animate-spin ${isPresentation ? 'text-amber-500' : 'text-blue-400'}`} />
              ) : (
                <Download size={16} />
              )}
            </button>
          </div>
        </div>
      </article>

      {/* Live Preview Modal (Desktop Fullscreen) */}
      {!onOpenArtifact && (
        <DocumentLivePreviewModal
          doc={doc}
          isOpen={livePreviewOpen}
          onClose={() => setLivePreviewOpen(false)}
          theme={theme}
        />
      )}
    </>
  );
}

