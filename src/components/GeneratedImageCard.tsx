'use client';

import React, { useEffect } from 'react';
import { Download, Maximize2, RefreshCw, X, Loader2, KeyRound } from 'lucide-react';
import type { GeneratedImage } from '@/lib/chatHistory';
import { ImageGeneration } from '@/components/ui/ai-chat-image-generation-1';

interface GeneratedImageCardProps {
  image: GeneratedImage;
  theme?: 'light' | 'dark';
  /** Re-run generation for this image. Called with (imageId, prompt). */
  onRegenerate?: (imageId: string, prompt: string) => void;
  /** Open OpenRouter connect modal */
  onConnectOpenRouter?: () => void;
}

/**
 * A generated-image response card. Renders the loader while `generating`,
 * the image (with download / lightbox-zoom / regenerate overlay) when `done`,
 * and an inline error with Retry when `error`.
 */
export default function GeneratedImageCard({
  image,
  theme = 'dark',
  onRegenerate,
  onConnectOpenRouter,
}: GeneratedImageCardProps) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const isDark = theme === 'dark';

  const handleConnectKey = () => {
    if (onConnectOpenRouter) {
      onConnectOpenRouter();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('nk-open-openrouter-modal'));
    }
  };

  // Close the lightbox on Escape.
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  const handleDownload = () => {
    if (!image.url) return;
    const a = document.createElement('a');
    a.href = image.url;
    a.download = `e-mate-${image.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (image.status === 'generating') {
    return (
      <ImageGeneration>
        <div className="w-full aspect-video flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <Loader2
            className="animate-spin"
            style={{ color: isDark ? '#8aa2ff' : '#1f51ff' }}
            size={28}
          />
        </div>
      </ImageGeneration>
    );
  }

  if (image.status === 'error') {
    return (
      <div
        className="max-w-md my-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm space-y-3"
        style={{ color: isDark ? '#fca5a5' : '#b91c1c' }}
      >
        <div className="font-semibold flex items-center gap-2 text-sm text-red-500">
          <KeyRound size={16} />
          Image generation failed
        </div>
        <p className="text-xs text-red-400 leading-relaxed opacity-90">
          Image generation is available only for connected accounts. Connect your OpenRouter key to continue.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleConnectKey}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <KeyRound size={13} />
            Connect OpenRouter Key
          </button>
          {onRegenerate && (
            <button
              type="button"
              onClick={() => onRegenerate(image.id, image.prompt)}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-medium hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer text-red-400"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // done
  return (
    <>
      <div className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-w-md my-2 shadow-sm">
        <img
          src={image.url}
          alt={image.prompt}
          className="w-full h-auto object-cover block cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        />

        {/* Hover action overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={handleDownload}
            title="Download image"
            aria-label="Download image"
            className="h-8 w-8 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 transition-colors cursor-pointer"
          >
            <Download size={15} />
          </button>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            title="Zoom image"
            aria-label="Zoom image"
            className="h-8 w-8 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 transition-colors cursor-pointer"
          >
            <Maximize2 size={15} />
          </button>
          {onRegenerate && (
            <button
              type="button"
              onClick={() => onRegenerate(image.id, image.prompt)}
              title="Regenerate image"
              aria-label="Regenerate image"
              className="h-8 w-8 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 transition-colors cursor-pointer"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image"
            className="absolute top-4 right-4 h-9 w-9 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/25 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <div
            className="max-w-4xl w-full max-h-[85vh] overflow-auto flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={image.url}
              alt={image.prompt}
              className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
            <p className="text-sm text-zinc-300 max-w-md text-center">{image.prompt}</p>
          </div>
        </div>
      )}
    </>
  );
}

// Download / zoom / regenerate button class used by the overlay.
GeneratedImageCard.displayName = 'GeneratedImageCard';
