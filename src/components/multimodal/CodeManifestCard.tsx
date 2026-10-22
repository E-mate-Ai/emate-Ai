'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, ChevronRight, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { CodeFileItem } from '@/lib/multimodal/types';

interface CodeManifestCardProps {
  files: CodeFileItem[];
  theme?: 'light' | 'dark';
}

export default function CodeManifestCard({ files, theme = 'dark' }: CodeManifestCardProps) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  if (!files || files.length === 0) return null;

  const currentFile = files[activeFileIndex] || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    toast.success(`Copied ${currentFile.filename} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    // Sanitize filename to prevent path traversal
    const safeName = currentFile.filename.replace(/^(\.\.[\/\\])+/, '').replace(/[<>:"/\\|?*]/g, '_');
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${safeName}`);
  };

  const handleDownloadAll = () => {
    files.forEach((file) => {
      const safeName = file.filename.replace(/^(\.\.[\/\\])+/, '').replace(/[<>:"/\\|?*]/g, '_');
      const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    toast.success(`Downloaded ${files.length} code files`);
  };

  return (
    <div className="my-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-lg">
      {/* Top Header & File Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[70%] scrollbar-none py-0.5">
          {files.map((file, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveFileIndex(idx)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-[11px] transition-all shrink-0 cursor-pointer ${
                activeFileIndex === idx
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <FileCode size={12} />
              <span>{file.filename}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition active:scale-95 text-[11px]"
            title="Copy current file content"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSingle}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition active:scale-95 text-[11px]"
            title="Download this file"
          >
            <Download size={12} />
            <span>Download</span>
          </button>

          {files.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition active:scale-95 text-[11px]"
              title="Download all generated files"
            >
              <Layers size={12} />
              <span>All ({files.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Code Editor Preview Area */}
      <div className="relative p-4 overflow-x-auto bg-zinc-950 font-mono text-xs text-zinc-100">
        <pre className="whitespace-pre leading-relaxed font-mono">
          <code>{currentFile.content}</code>
        </pre>
      </div>
    </div>
  );
}
