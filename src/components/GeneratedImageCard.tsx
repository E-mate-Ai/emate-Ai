'use client';

import React, { useEffect } from 'react';
import { Download, Maximize2, RefreshCw, X, KeyRound, ChevronDown, Sparkles } from 'lucide-react';
import type { GeneratedImage } from '@/lib/chatHistory';
import BlueDotMatrix from '@/components/ui/BlueDotMatrix';
import { Button } from '@/components/ui/button';

function getFriendlyImageError(message?: string) {
  const value = message?.toLowerCase() ?? '';
  if (/401|403|unauthori[sz]ed|api.?key|credential/.test(value)) {
    return 'The image provider rejected the request. Check your image provider connection, then try again.';
  }
  if (/402|credit|billing|quota/.test(value)) {
    return 'The image provider has no credits available. Add credits or choose a provider with available image credits.';
  }
  if (/not configured|configuration|missing provider/.test(value)) {
    return 'Image generation is not configured yet. Add an image provider key in Settings to enable it.';
  }
  return 'We couldn’t create this image right now. Please try again in a moment.';
}

interface GeneratedImageCardProps {
  image: GeneratedImage;
  theme?: 'light' | 'dark';
  /** Re-run generation for this image. Called with (imageId, prompt). */
  onRegenerate?: (imageId: string, prompt: string, promptIsEnhanced?: boolean) => void;
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
  const [enhancedPromptOpen, setEnhancedPromptOpen] = React.useState(false);
  const [promptDraft, setPromptDraft] = React.useState(image.enhancedPrompt || image.prompt);
  const isDark = theme === 'dark';

  useEffect(() => {
    setPromptDraft(image.enhancedPrompt || image.prompt);
  }, [image.enhancedPrompt, image.prompt]);

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

  if (image.status === 'enhancing' || image.status === 'generating') {
    const isLandscape = image.aspectRatio === '16:9' || image.aspectRatio === '3:2';
    const isPortrait = image.aspectRatio === '9:16' || image.aspectRatio === '3:4';
    const aspectClass = isLandscape
      ? 'aspect-video'
      : isPortrait
        ? 'aspect-[9/16] max-h-[380px]'
        : 'aspect-square max-h-[320px]';

    return (
      <div className="my-2 w-full max-w-md overflow-hidden rounded-2xl border border-blue-400/15 bg-[#030916] shadow-[0_12px_48px_rgba(0,90,255,0.12)]">
        <div className={`relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden p-6 ${aspectClass}`}>
          <BlueDotMatrix />
          <p className="text-center text-xs font-medium tracking-[0.12em] text-blue-100/80 sm:text-sm" role="status" aria-live="polite">
            {image.status === 'enhancing' ? 'Enhancing your prompt...' : 'Creating your imagination...'}
          </p>
          {image.enhancedPrompt && (
            <p className="max-w-[280px] text-center text-[11px] text-cyan-200/70">
              Prompt ready · preparing your image
            </p>
          )}
          {image.enhancementWarning && (
            <p className="max-w-[280px] text-center text-[10px] text-amber-200/75">
              {image.enhancementWarning}
            </p>
          )}
          {image.prompt && (
            <p className="line-clamp-2 max-w-[280px] px-2 text-center text-[11px] text-slate-400/75">
              “{image.prompt}”
            </p>
          )}
        </div>
      </div>
    );
  }

  if (image.status === 'error') {
    return (
      <div
        role="alert"
        className="max-w-md my-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm space-y-3"
        style={{ color: isDark ? '#fca5a5' : '#b91c1c' }}
      >
        <div className="font-semibold flex items-center gap-2 text-sm text-red-500">
          <KeyRound size={16} />
          Image generation failed
        </div>
        <p className="text-xs text-red-400 leading-relaxed opacity-90">
          {getFriendlyImageError(image.errorMessage)}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            onClick={handleConnectKey}
            variant="outline"
            size="sm"
            className="h-9 border-red-500/30 px-3 text-xs text-red-500 hover:bg-red-500/10 dark:text-red-300"
          >
            <KeyRound size={13} />
            Connect Key
          </Button>
          {onRegenerate && (
            <Button
              type="button"
              onClick={() => onRegenerate(image.id, image.enhancedPrompt || image.prompt, Boolean(image.enhancedPrompt))}
              variant="outline"
              size="sm"
              className="h-9 border-red-500/30 px-3 text-xs text-red-500 hover:bg-red-500/10 dark:text-red-300"
            >
              <RefreshCw size={12} />
              Retry
            </Button>
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
          className="generated-image-reveal w-full h-auto object-cover block cursor-zoom-in"
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
              onClick={() => onRegenerate(image.id, image.enhancedPrompt || image.prompt, Boolean(image.enhancedPrompt))}
              title="Regenerate image"
              aria-label="Regenerate image"
              className="h-8 w-8 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 transition-colors cursor-pointer"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>
      {image.enhancementWarning && (
        <p className="mb-2 max-w-md text-[11px] text-amber-600 dark:text-amber-400">
          {image.enhancementWarning}
        </p>
      )}
      {image.enhancedPrompt && (
        <div className="mb-3 max-w-md overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <button
            type="button"
            onClick={() => setEnhancedPromptOpen((open) => !open)}
            aria-expanded={enhancedPromptOpen}
            className="flex min-h-10 w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/70"
          >
            <span className="flex items-center gap-2"><Sparkles size={14} className="text-blue-500" /> AI Enhanced Prompt</span>
            <ChevronDown size={14} className={enhancedPromptOpen ? 'transition-transform rotate-180' : 'transition-transform'} />
          </button>
          {enhancedPromptOpen && (
            <div className="space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
              <label htmlFor={'enhanced-prompt-' + image.id} className="sr-only">Edit enhanced image prompt</label>
              <textarea
                id={'enhanced-prompt-' + image.id}
                value={promptDraft}
                onChange={(event) => setPromptDraft(event.target.value)}
                rows={5}
                className="w-full resize-y rounded-lg border border-zinc-200 bg-white p-2.5 text-xs leading-relaxed text-zinc-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
              />
              {onRegenerate && (
                <button
                  type="button"
                  disabled={!promptDraft.trim()}
                  onClick={() => onRegenerate(image.id, promptDraft.trim(), true)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Generate with this prompt
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
