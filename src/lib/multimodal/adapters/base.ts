// ─────────────────────────────────────────────────────────────────────────────
// e-Mate AI Common Provider Adapter Interface
// ─────────────────────────────────────────────────────────────────────────────

import { ProviderId, UnifiedModelMetadata } from '../types';

export interface GenerateTextOptions {
  model: UnifiedModelMetadata;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<Record<string, unknown>>;
  }>;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  apiKey?: string;
}

export interface GenerateStreamOptions extends GenerateTextOptions {
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export interface GenerateImageOptions {
  prompt: string;
  model: UnifiedModelMetadata;
  aspectRatio?: string;
  style?: string;
  apiKey?: string;
}

export interface GenerateImageResult {
  imageUrl: string;
  revisedPrompt?: string;
  mimeType?: string;
}

export interface ProviderAdapter {
  readonly providerId: ProviderId;

  /** Generate non-streaming text or structured output */
  generateText(options: GenerateTextOptions): Promise<{
    text: string;
    model: string;
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  }>;

  /** Generate streaming text response (returns raw SSE Response or ReadableStream) */
  generateStream(options: GenerateStreamOptions): Promise<Response>;

  /** Generate genuine image artifact */
  generateImage(options: GenerateImageOptions): Promise<GenerateImageResult>;
}
