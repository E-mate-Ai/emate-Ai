'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Globe,
  Clipboard,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle,
  FolderOpen,
  File,
} from 'lucide-react';
import { toast } from 'sonner';
import { getNotebook, saveNotebook, type NotebookEntry } from '@/lib/notebook';

export interface SourceItem {
  id: string;
  title: string;
  type: 'file' | 'drive' | 'website' | 'text';
  content?: string;
  url?: string;
  size?: string;
  timestamp: string;
}

interface AddSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
}

// Custom Google Drive Icon matching Gemini UI
const DriveIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
      fill="#0066da"
    />
    <path
      d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.45z"
      fill="#00ac47"
    />
    <path
      d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.65-2.85c.8-1.4 1.2-2.95 1.2-4.5h-27.45l13.75 23.85z"
      fill="#ea4335"
    />
    <path
      d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
      fill="#00832d"
    />
    <path
      d="m59.8 53-16.15-28-16.15 28h32.3z"
      fill="#2684fc"
    />
    <path
      d="m73.55 76.8 6.65-11.55c.8-1.4 1.2-2.95 1.2-4.5s-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 27.5 47.65z"
      fill="#ffba00"
    />
  </svg>
);

export default function AddSourcesModal({ isOpen, onClose, subject }: AddSourcesModalProps) {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [activeInputMode, setActiveInputMode] = useState<'none' | 'drive' | 'website' | 'text'>('none');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [pastedTextTitle, setPastedTextTitle] = useState('');
  const [pastedTextContent, setPastedTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing sources whenever subject or modal open state changes
  useEffect(() => {
    if (!isOpen || !subject) return;
    const nb = getNotebook(subject);
    const existingSources: SourceItem[] = (nb.entries || [])
      .filter((e) => e.type)
      .map((e) => ({
        id: e.id,
        title: e.title || e.content.slice(0, 30) || 'Untitled Source',
        type: e.type || 'text',
        content: e.content,
        url: e.url,
        size: e.size,
        timestamp: e.timestamp,
      }));
    setSources(existingSources);
  }, [isOpen, subject]);

  if (!isOpen) return null;

  const saveNewSource = (source: SourceItem) => {
    const nb = getNotebook(subject);
    const newEntry: NotebookEntry = {
      id: source.id,
      content: source.content || source.title,
      timestamp: source.timestamp,
      source: 'user',
      type: source.type,
      title: source.title,
      url: source.url,
      size: source.size,
    };
    const updatedEntries = [...nb.entries, newEntry];
    saveNotebook(subject, { ...nb, entries: updatedEntries });
    setSources((prev) => [source, ...prev]);
    toast.success(`Added "${source.title}" to ${subject}`);
    setActiveInputMode('none');
  };

  const handleDeleteSource = (sourceId: string, sourceTitle: string) => {
    const nb = getNotebook(subject);
    const updatedEntries = nb.entries.filter((e) => e.id !== sourceId);
    saveNotebook(subject, { ...nb, entries: updatedEntries });
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
    toast.info(`Removed "${sourceTitle}"`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const sizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
        saveNewSource({
          id: `source-file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: file.name,
          type: 'file',
          content: text || `Content from ${file.name}`,
          size: sizeFormatted,
          timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
        });
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    const url = websiteUrl.trim();
    if (!url) return;
    let title = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (title.length > 35) title = title.slice(0, 32) + '...';

    saveNewSource({
      id: `source-web-${Date.now()}`,
      title: title || 'Website Link',
      type: 'website',
      url,
      content: `Reference URL: ${url}`,
      timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    });
    setWebsiteUrl('');
  };

  const handleAddDrive = (e: React.FormEvent) => {
    e.preventDefault();
    const url = driveUrl.trim();
    if (!url) return;
    let title = 'Google Drive Document';
    if (url.includes('/document/d/')) title = 'Drive Doc';
    else if (url.includes('/spreadsheets/d/')) title = 'Drive Spreadsheet';
    else if (url.includes('/presentation/d/')) title = 'Drive Slides';

    saveNewSource({
      id: `source-drive-${Date.now()}`,
      title,
      type: 'drive',
      url,
      content: `Google Drive file: ${url}`,
      timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    });
    setDriveUrl('');
  };

  const handleAddCopiedText = (e: React.FormEvent) => {
    e.preventDefault();
    const text = pastedTextContent.trim();
    if (!text) return;
    const title = pastedTextTitle.trim() || text.slice(0, 25) + '...';

    saveNewSource({
      id: `source-text-${Date.now()}`,
      title,
      type: 'text',
      content: text,
      timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    });
    setPastedTextTitle('');
    setPastedTextContent('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs transition-opacity duration-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
        className="hidden"
      />

      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Sources
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Add files that e-Mate can reference in your notebook
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[340px]">
          {/* Left Column: Action Pill Buttons */}
          <div className="md:col-span-4 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setActiveInputMode('none');
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
            >
              <div className="w-6 h-6 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform">
                <Plus size={14} strokeWidth={2.5} />
              </div>
              <span>Upload files</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInputMode('drive')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs group ${
                activeInputMode === 'drive'
                  ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DriveIcon className="w-3.5 h-3.5" />
              </div>
              <span>Add from Drive</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInputMode('website')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs group ${
                activeInputMode === 'website'
                  ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform">
                <Globe size={13} strokeWidth={2} />
              </div>
              <span>Add websites</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInputMode('text')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs group ${
                activeInputMode === 'text'
                  ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform">
                <Clipboard size={13} strokeWidth={2} />
              </div>
              <span>Copied text</span>
            </button>
          </div>

          {/* Right Column: Display list or active input sub-dialog */}
          <div className="md:col-span-8 flex flex-col min-h-[260px] bg-zinc-50/60 dark:bg-zinc-950/40 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/60">
            {activeInputMode === 'website' && (
              <form onSubmit={handleAddWebsite} className="flex flex-col gap-3 h-full justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Add Website URL
                  </h3>
                  <p className="text-[11px] text-zinc-500 mb-3">
                    Paste a link to a website, article, or documentation page.
                  </p>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/article"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveInputMode('none')}
                    className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Save URL
                  </button>
                </div>
              </form>
            )}

            {activeInputMode === 'drive' && (
              <form onSubmit={handleAddDrive} className="flex flex-col gap-3 h-full justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Add Google Drive Link
                  </h3>
                  <p className="text-[11px] text-zinc-500 mb-3">
                    Paste a shareable Google Docs, Sheets, or Drive file link.
                  </p>
                  <input
                    type="url"
                    required
                    placeholder="https://docs.google.com/document/d/..."
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveInputMode('none')}
                    className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Add Drive Link
                  </button>
                </div>
              </form>
            )}

            {activeInputMode === 'text' && (
              <form onSubmit={handleAddCopiedText} className="flex flex-col gap-3 h-full justify-between">
                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Paste Study Text
                  </h3>
                  <input
                    type="text"
                    placeholder="Source Title (optional)"
                    value={pastedTextTitle}
                    onChange={(e) => setPastedTextTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <textarea
                    required
                    rows={4}
                    placeholder="Paste lecture notes, definitions, or copied text here..."
                    value={pastedTextContent}
                    onChange={(e) => setPastedTextContent(e.target.value)}
                    className="w-full flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveInputMode('none')}
                    className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Add Text Source
                  </button>
                </div>
              </form>
            )}

            {activeInputMode === 'none' && (
              <>
                {sources.length === 0 ? (
                  /* Empty State Matching Gemini Screenshot */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-2xs">
                      <FolderOpen size={22} strokeWidth={1.5} />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 max-w-xs leading-snug">
                      Documents, images, videos, and files you add will appear here.
                    </p>
                  </div>
                ) : (
                  /* List of Added Sources */
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Added Sources ({sources.length})
                      </span>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
                      {sources.map((src) => (
                        <div
                          key={src.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs group hover:border-blue-200 dark:hover:border-blue-900 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              {src.type === 'drive' && <DriveIcon className="w-4 h-4" />}
                              {src.type === 'website' && <Globe size={16} className="text-blue-500" />}
                              {src.type === 'file' && <FileText size={16} className="text-emerald-500" />}
                              {src.type === 'text' && <Clipboard size={16} className="text-amber-500" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                {src.title}
                              </p>
                              <p className="text-[10px] text-zinc-400 flex items-center gap-2">
                                <span>{src.type.toUpperCase()}</span>
                                {src.size && <span>• {src.size}</span>}
                                <span>• {src.timestamp}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSource(src.id, src.title)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-80 group-hover:opacity-100"
                            title="Remove source"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
