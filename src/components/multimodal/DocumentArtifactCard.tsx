'use client';

import React, { useState } from 'react';
import { FileText, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentArtifactCardProps {
  title: string;
  content: string;
  format?: 'markdown' | 'txt';
}

export default function DocumentArtifactCard({
  title,
  content,
  format = 'markdown',
}: DocumentArtifactCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Document copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'markdown' ? 'md' : 'txt';
    const mime = format === 'markdown' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${title}.${ext}`);
  };

  return (
    <div className="my-3 flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-4 py-3 shadow-xs">
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
          <FileText size={18} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Exportable {format.toUpperCase()} Study Document
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition active:scale-95"
          title="Copy document text"
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white shadow-2xs transition active:scale-95"
          title="Download as markdown"
        >
          <Download size={13} />
          <span>Download .{format === 'markdown' ? 'md' : 'txt'}</span>
        </button>
      </div>
    </div>
  );
}
