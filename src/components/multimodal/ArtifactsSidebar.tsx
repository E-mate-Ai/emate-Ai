'use client';

import React, { useState } from 'react';
import {
  X,
  Presentation,
  FileText,
  Download,
  Loader2,
  FileCode,
  Layers,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToDocx, exportToPptx, downloadFile } from '@/lib/documentExport';
import DocumentLivePreviewModal from './DocumentLivePreviewModal';
import type { GeneratedDocument } from './DocumentGenerationCard';

interface ArtifactsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  artifacts: GeneratedDocument[];
  onSelectArtifact?: (id: string) => void;
  theme?: 'light' | 'dark';
}

export default function ArtifactsSidebar({
  isOpen,
  onClose,
  artifacts,
  onSelectArtifact,
  theme = 'dark',
}: ArtifactsSidebarProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleDownload = async (doc: GeneratedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingId) return;
    setDownloadingId(doc.id);

    const safeTitle = (doc.title || 'document').replace(/[^a-z0-9_-]/gi, '_');

    try {
      if (doc.format === 'pptx') {
        toast.info('Downloading presentation (.pptx)…');
        const blob = await exportToPptx(doc.title, doc.content);
        downloadFile(blob, `${safeTitle}.pptx`);
        toast.success(`Downloaded ${safeTitle}.pptx`);
      } else {
        toast.info('Downloading document (.docx)…');
        const blob = await exportToDocx(doc.title, doc.content);
        downloadFile(blob, `${safeTitle}.docx`);
        toast.success(`Downloaded ${safeTitle}.docx`);
      }
    } catch (err: any) {
      toast.error('Export failed, downloading markdown fallback');
      const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8' });
      downloadFile(blob, `${safeTitle}.md`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <aside
        className={`fixed top-0 right-0 z-40 h-full w-80 sm:w-96 flex flex-col border-l shadow-2xl transition-all duration-300 animate-in slide-in-from-right ${
          isDark
            ? 'bg-[#121214] border-white/10 text-zinc-100'
            : 'bg-[#fafafa] border-zinc-200 text-zinc-900'
        }`}
        aria-label="Artifacts Panel"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-amber-500" />
            <h2 className="text-base font-semibold tracking-tight">Artifacts</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-mono">
              {artifacts.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close artifacts panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Artifacts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {artifacts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4 text-zinc-500">
              <Layers size={32} className="stroke-[1.5] mb-2 opacity-40" />
              <p className="text-sm font-medium">No artifacts yet</p>
              <p className="text-xs text-zinc-500 mt-1">
                Documents and presentations generated in this chat will appear here for live preview and one-click download.
              </p>
            </div>
          ) : (
            artifacts.map((doc) => {
              const isPptx = doc.format === 'pptx';
              const isDownloading = downloadingId === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setPreviewDoc(doc);
                    onSelectArtifact?.(doc.id);
                  }}
                  className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-zinc-900/60 hover:bg-zinc-900 border-white/10 hover:border-amber-500/30'
                      : 'bg-white hover:bg-zinc-50 border-zinc-200 shadow-xs hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    {/* Icon badge */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        isPptx
                          ? isDark
                            ? 'bg-[#3b2316] border-[#5a2e19] text-[#e07a3c]'
                            : 'bg-amber-100 border-amber-300 text-amber-700'
                          : isDark
                            ? 'bg-[#1e2338] border-[#2f395c] text-[#60a5fa]'
                            : 'bg-blue-100 border-blue-200 text-blue-700'
                      }`}
                    >
                      {isPptx ? (
                        <Presentation size={20} strokeWidth={1.8} />
                      ) : (
                        <FileText size={20} strokeWidth={1.8} />
                      )}
                    </div>

                    {/* Title & Type */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-amber-400 transition-colors">
                        {doc.title || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-zinc-400">
                          {isPptx ? 'Presentation · PPTX' : 'Document · DOCX'}
                        </span>
                        <span className="text-[10px] text-amber-500/80 font-medium">· Preview</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDoc(doc);
                      }}
                      title="Open Live Preview"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isDark
                          ? 'text-zinc-400 hover:text-amber-400 hover:bg-white/10'
                          : 'text-zinc-600 hover:text-amber-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDownload(doc, e)}
                      disabled={isDownloading}
                      title={`Download ${isPptx ? '.pptx' : '.docx'}`}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isDark
                          ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                          : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                      }`}
                    >
                      {isDownloading ? (
                        <Loader2 size={15} className="animate-spin text-amber-500" />
                      ) : (
                        <Download size={15} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Live Preview Modal */}
      <DocumentLivePreviewModal
        doc={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        theme={theme}
      />
    </>
  );
}
