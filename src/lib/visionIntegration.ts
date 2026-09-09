/**
 * Vision integration layer — handles multimodal message formatting
 * and image explanation for OpenRouter vision models.
 */

/**
 * Multimodal content block for vision requests.
 * Supports both text and image inputs in a single message.
 */
export interface MultimodalContentBlock {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string; // base64 data URI or HTTPS URL
  };
}

/**
 * Format a user message with text and image data into multimodal content array.
 * @param textContent - The user's text input
 * @param imageDataUri - Base64 data URI (e.g., "data:image/png;base64,...")
 * @returns Array of content blocks ready for OpenRouter vision API
 */
export function formatMultimodalMessage(
  textContent: string,
  imageDataUri: string
): MultimodalContentBlock[] {
  const content: MultimodalContentBlock[] = [];

  // Always include text first
  if (textContent && textContent.trim()) {
    content.push({
      type: 'text',
      text: textContent.trim(),
    });
  }

  // Add image if present
  if (imageDataUri && imageDataUri.startsWith('data:image/')) {
    content.push({
      type: 'image_url',
      image_url: {
        url: imageDataUri,
      },
    });
  }

  return content;
}

/**
 * Vision-capable models on OpenRouter that support multimodal input.
 */
export const VISION_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
  'google/gemini-2.0-flash',
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o-mini',
] as const;

/**
 * Check if a model supports vision/multimodal input.
 */
export function isVisionModel(modelId: string): boolean {
  return VISION_MODELS.includes(modelId as any);
}

/**
 * Get the recommended vision model for image analysis.
 * Defaults to Gemini 2.5 Flash for best performance.
 */
export function getRecommendedVisionModel(): string {
  return 'google/gemini-2.5-flash';
}
