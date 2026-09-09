import { useState, useCallback } from 'react';

interface ImageExplanationResult {
  explanation: string;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to explain an image using OpenRouter vision models.
 * Handles multimodal payload formatting and error management.
 */
export function useImageExplanation() {
  const [state, setState] = useState<ImageExplanationResult>({
    explanation: '',
    loading: false,
    error: null,
  });

  const explainImage = useCallback(
    async (imageDataUrl: string, prompt: string): Promise<string> => {
      setState({ explanation: '', loading: true, error: null });

      try {
        if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
          throw new Error('Invalid image data URL. Must be a base64 data URI.');
        }

        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
          throw new Error('A prompt is required to explain the image.');
        }

        const response = await fetch('/api/explain-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageDataUrl,
            prompt: prompt.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData?.error || `Vision API failed (${response.status})`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const explanation = data.explanation || '';

        setState({ explanation, loading: false, error: null });
        return explanation;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to explain image';
        setState({ explanation: '', loading: false, error: errorMessage });
        throw err;
      }
    },
    []
  );

  return { ...state, explainImage };
}
