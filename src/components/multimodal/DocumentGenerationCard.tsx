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
}

export default function DocumentGenerationCard({
  doc,
  theme = 'dark',
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
            {doc.title || 'Structuring slides, key insights and notes…'}
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

  const slides = isPresentation
    ? doc.content.split(/---SLIDE:[^-]*---/).filter(Boolean)
    : [];

  return (
    <>
      <div
        onClick={() => setLivePreviewOpen(true)}
        className={`group my-3 w-full max-w-lg rounded-2xl border transition-all cursor-pointer ${
          isDark
            ? 'bg-[#18181b]/95 hover:bg-[#202024] border-white/10 hover:border-amber-500/30 shadow-xl shadow-black/30'
            : 'bg-white hover:bg-zinc-50 border-zinc-200/90 hover:border-amber-500/40 shadow-md shadow-zinc-200/50'
        }`}
      >
        {/* ── Main Claude-Style Artifact Header ── */}
        <div className="flex items-center justify-between p-3.5 gap-3">
          {/* Left Icon Badge */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 ${
              isPresentation
                ? isDark
                  ? 'bg-[#3b2316] border-[#5a2e19] text-[#e07a3c]'
                  : 'bg-amber-100 border-amber-300 text-amber-700'
                : isDark
                  ? 'bg-[#1e2338] border-[#2f395c] text-[#60a5fa]'
                  : 'bg-blue-100 border-blue-200 text-blue-700'
            }`}
          >
            {isPresentation ? (
              <Presentation size={20} strokeWidth={1.8} />
            ) : (
              <FileText size={20} strokeWidth={1.8} />
            )}
          </div>

          {/* Center Title & Subtitle */}
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold truncate transition-colors ${
                isDark ? 'text-zinc-100 group-hover:text-amber-400' : 'text-zinc-900 group-hover:text-amber-600'
              }`}
              title={doc.title}
            >
              {doc.title || (isPresentation ? 'Untitled Presentation' : 'Untitled Document')}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-[11px] font-medium ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                {formatLabel}
              </span>
              {isPresentation && slides.length > 0 && (
                <span className="text-[10px] text-zinc-500 font-mono">
                  · {slides.length} slides
                </span>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="relative shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Live Preview Button */}
            <button
              type="button"
              onClick={() => setLivePreviewOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
              title="Open full interactive live preview"
            >
              <Eye size={13} />
              <span className="hidden sm:inline">Preview</span>
            </button>

            {/* Split Download Button [ Download | ⌵ ] */}
            <div
              className={`inline-flex items-center rounded-xl overflow-hidden border shadow-sm ${
                isDark
                  ? 'bg-zinc-800/90 border-white/10 divide-x divide-white/10'
                  : 'bg-zinc-100 border-zinc-300 divide-x divide-zinc-200'
              }`}
            >
              <button
                type="button"
                onClick={handleDownloadPrimary}
                disabled={isExporting}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'text-zinc-200 hover:bg-white/10 hover:text-white'
                    : 'text-zinc-800 hover:bg-zinc-200 hover:text-black'
                }`}
              >
                {isExporting ? (
                  <Loader2 size={13} className="animate-spin text-amber-500" />
                ) : (
                  <Download size={13} />
                )}
                <span>Download</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={`px-1.5 sm:px-2 py-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'text-zinc-400 hover:bg-white/10 hover:text-white'
                    : 'text-zinc-600 hover:bg-zinc-200 hover:text-black'
                }`}
                title="More options"
              >
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className={`absolute right-0 top-full mt-1.5 w-48 rounded-xl border p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? 'bg-zinc-900 border-white/15 text-zinc-200'
                      : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setLivePreviewOpen(true);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-white/10 text-amber-400' : 'hover:bg-zinc-100 text-amber-600'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Open Live Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPrimary}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'
                    }`}
                  >
                    <Download size={13} className="text-zinc-400" />
                    <span>Download {isPresentation ? '.pptx' : '.docx'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'
                    }`}
                  >
                    <FileCode size={13} className="text-blue-400" />
                    <span>Download Markdown (.md)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'
                    }`}
                  >
                    {copied ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} className="text-zinc-400" />
                    )}
                    <span>{copied ? 'Copied!' : 'Copy raw content'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Click-to-preview hint bar */}
        <div
          className={`px-3.5 py-1.5 text-[10px] flex items-center justify-between border-t transition-colors ${
            isDark
              ? 'border-white/5 bg-white/[0.02] text-zinc-500 group-hover:text-zinc-300'
              : 'border-zinc-100 bg-zinc-50 text-zinc-400 group-hover:text-zinc-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Eye size={11} className="text-amber-500/80" />
            <span>Click to open interactive live slide deck</span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider">
            {isPresentation ? 'Interactive Deck' : 'Document View'}
          </span>
        </div>
      </div>

      {/* ── Interactive Live Preview Modal ── */}
      <DocumentLivePreviewModal
        doc={doc}
        isOpen={livePreviewOpen}
        onClose={() => setLivePreviewOpen(false)}
        theme={theme}
      />
    </>
  );
}
