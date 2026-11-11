'use client';

import React, { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle2, X, AlertCircle, Loader2 } from 'lucide-react';

interface PdfUploaderProps {
  onExtracted: (text: string, fileName: string) => void;
  onError?: (message: string) => void;
  className?: string;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfUploader({ onExtracted, onError, className }: PdfUploaderProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are accepted.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File must be under 10 MB.';
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validate(file);
      if (validationError) {
        toast.error(validationError);
        onError?.(validationError);
        setState('error');
        setErrorMessage(validationError);
        return;
      }

      setSelectedFile(file);
      setState('uploading');
      setPreviewText('');
      setErrorMessage('');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const msg = data?.error ?? `Server error (${response.status})`;
          throw new Error(msg);
        }

        const data = await response.json();
        const text: string = data.text ?? '';

        setPreviewText(text.slice(0, 200));
        setState('success');
        onExtracted(text, file.name);
        toast.success('PDF extracted successfully!');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to process PDF.';
        setErrorMessage(msg);
        setState('error');
        onError?.(msg);
        toast.error(msg);
      }
    },
    [onExtracted, onError]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setState('idle');
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setState('dragging');
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setState('idle');
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // reset input so the same file can be re-selected
      e.target.value = '';
    },
    [handleFile]
  );

  const reset = useCallback(() => {
    setState('idle');
    setSelectedFile(null);
    setPreviewText('');
    setErrorMessage('');
  }, []);

  /* ── Zone border style ── */
  const borderClass =
    state === 'dragging'
      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40'
      : state === 'success'
      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
      : state === 'error'
      ? 'border-red-400 bg-red-50/50 dark:bg-red-950/30'
      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20';

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="PDF upload zone"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        className={[
          'relative flex flex-col items-center justify-center gap-3',
          'rounded-2xl border-2 border-dashed p-8 cursor-pointer',
          'transition-all duration-200 select-none outline-none',
          'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          borderClass,
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={onInputChange}
        />

        {/* ── IDLE ── */}
        {state === 'idle' && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Drop your study PDF here, or{' '}
                <span className="text-blue-600 dark:text-blue-400 underline underline-offset-2">browse</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">PDF only · up to 10 MB</p>
            </div>
          </>
        )}

        {/* ── DRAGGING ── */}
        {state === 'dragging' && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-300">
              <Upload className="h-6 w-6 animate-bounce" />
            </div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Release to upload</p>
          </>
        )}

        {/* ── UPLOADING ── */}
        {state === 'uploading' && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedFile?.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {selectedFile ? formatBytes(selectedFile.size) : ''} · Extracting text…
              </p>
            </div>
          </>
        )}

        {/* ── SUCCESS ── */}
        {state === 'success' && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedFile?.name}</p>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {selectedFile ? formatBytes(selectedFile.size) : ''}
              </p>
            </div>
            {previewText && (
              <p className="mt-1 max-w-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 ring-1 ring-blue-200/60 dark:ring-blue-800/60 font-mono">
                {previewText}…
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Remove file"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {/* ── ERROR ── */}
        {state === 'error' && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-red-600">Upload failed</p>
              {errorMessage && (
                <p className="mt-0.5 text-xs text-red-500">{errorMessage}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 underline underline-offset-2">
                Click to try again
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
