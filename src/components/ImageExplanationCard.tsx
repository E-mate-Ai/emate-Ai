'use client';

import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { fileToBase64DataUri, isValidImageFile, formatFileSize } from '@/lib/imageUtils';
import { useImageExplanation } from '@/lib/hooks/useImageExplanation';

interface ImageExplanationCardProps {
  onExplanationReady?: (explanation: string) => void;
  onClose?: () => void;
}

export default function ImageExplanationCard({
  onExplanationReady,
  onClose,
}: ImageExplanationCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { explanation, loading, error, explainImage } = useImageExplanation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!isValidImageFile(file)) {
      toast.error('Invalid image format. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Image too large (${formatFileSize(file.size)}). Max 5 MB.`);
      return;
    }

    setSelectedFile(file);

    // Generate preview
    try {
      const dataUri = await fileToBase64DataUri(file);
      setPreview(dataUri);
    } catch (err) {
      toast.error('Failed to load image preview');
      setSelectedFile(null);
      setPreview('');
    }
  };

  const handleExplain = async () => {
    if (!selectedFile || !preview) {
      toast.error('Please select an image first.');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt to explain the image.');
      return;
    }

    try {
      await explainImage(preview, prompt);
      onExplanationReady?.(explanation);
    } catch (err) {
      // Error is already set in state by the hook
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview('');
    setPrompt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            Explain an Image
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition"
          >
            <X className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </button>
        )}
      </div>

      {/* File Input */}
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition"
        >
          <Upload className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Click to upload an image
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            JPEG, PNG, GIF, WebP (max 5 MB)
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Image Preview */}
          <div className="relative w-full bg-blue-100 dark:bg-blue-900 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Selected"
              className="w-full max-h-48 object-cover"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-md text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Input */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like to know about this image?"
            className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 placeholder-blue-400 dark:placeholder-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={loading}
          />

          {/* Error Display */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {explanation && !loading && (
            <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Image explanation ready!
              </p>
            </div>
          )}

          {/* Explain Button */}
          <button
            onClick={handleExplain}
            disabled={loading || !prompt.trim()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Explaining...
              </>
            ) : (
              'Explain Image'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
