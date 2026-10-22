'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, Table as TableIcon, Database } from 'lucide-react';
import { toast } from 'sonner';

interface StructuredDataCardProps {
  format: 'json' | 'csv' | 'table';
  data: unknown;
  schemaTitle?: string;
  theme?: 'light' | 'dark';
}

export default function StructuredDataCard({
  format,
  data,
  schemaTitle = 'Structured Output',
  theme = 'dark',
}: StructuredDataCardProps) {
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const stringified =
    typeof data === 'string'
      ? data
      : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(stringified);
    setCopied(true);
    toast.success('Copied structured data to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'csv' ? 'csv' : 'json';
    const mime = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([stringified], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaTitle.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${ext.toUpperCase()} file`);
  };

  return (
    <div className="my-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          {format === 'csv' ? (
            <TableIcon size={14} className="text-emerald-500" />
          ) : (
            <Database size={14} className="text-blue-500" />
          )}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{schemaTitle}</span>
          <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400">
            {format}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition active:scale-95 text-[11px]"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition active:scale-95 text-[11px]"
          >
            <Download size={12} />
            <span>Download .{format}</span>
          </button>
        </div>
      </div>

      <div className="p-4 max-h-72 overflow-y-auto font-mono text-xs text-zinc-800 dark:text-zinc-200 bg-white/50 dark:bg-zinc-950/40">
        <pre className="whitespace-pre-wrap leading-relaxed">
          <code>{stringified}</code>
        </pre>
      </div>
    </div>
  );
}
