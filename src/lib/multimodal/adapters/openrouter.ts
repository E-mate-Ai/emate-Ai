// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter Provider Adapter
// ─────────────────────────────────────────────────────────────────────────────

import {
  openRouterCompletion,
  openRouterCompletionStream,
  openRouterImageCompletion,
  OpenRouterError,
} from '@/lib/openrouter';
import {
  ProviderAdapter,
  GenerateTextOptions,
  GenerateStreamOptions,
  GenerateImageOptions,
  GenerateImageResult,
} from './base';
import { ProviderId } from '../types';

export class OpenRouterProviderAdapter implements ProviderAdapter {
  readonly providerId: ProviderId = 'openrouter';

  private resolveApiKey(explicitKey?: string): string {
    const key =
      explicitKey ||
      process.env.OPENROUTER_SERVER_FREE_KEY ||
      process.env.OPENROUTER_API_KEY;

    if (!key || key === 'your-openrouter-api-key-here') {
      throw new Error(
        'Missing OpenRouter API key. Please connect your OpenRouter account in Settings.'
      );
    }
    return key;
  }

  async generateText(options: GenerateTextOptions): Promise<{
    text: string;
    model: string;
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  }> {
    const apiKey = this.resolveApiKey(options.apiKey);
    const targetModel = options.model.providerModelId;

    const messages = options.messages.map((m) => ({
      role: m.role,
      content: m.content as any,
    }));

    if (options.systemPrompt && messages[0]?.role !== 'system') {
      messages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const response = (await openRouterCompletion(apiKey, {
      model: targetModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    })) as any;

    const text = response?.choices?.[0]?.message?.content || '';
    const usage = response?.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined;

    return {
      text: typeof text === 'string' ? text : JSON.stringify(text),
      model: response?.model || targetModel,
      usage,
    };
  }

  async generateStream(options: GenerateStreamOptions): Promise<Response> {
    const apiKey = this.resolveApiKey(options.apiKey);
    const targetModel = options.model.providerModelId;

    const messages = options.messages.map((m) => ({
      role: m.role,
      content: m.content as any,
    }));

    if (options.systemPrompt && messages[0]?.role !== 'system') {
      messages.unshift({ role: 'system', content: options.systemPrompt });
    }

    return await openRouterCompletionStream(apiKey, {
      model: targetModel,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    });
  }

  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const apiKey = this.resolveApiKey(options.apiKey);
    const prompt = options.prompt.trim();

    // Add optional aspect ratio / style hints
    let fullPrompt = prompt;
    if (options.style) {
      fullPrompt += ` ${options.style} style, clean details, high resolution.`;
    }

    const { imageUrl } = await openRouterImageCompletion(apiKey, {
      prompt: fullPrompt,
      model: options.model.providerModelId,
    });

    return {
      imageUrl,
      revisedPrompt: fullPrompt,
      mimeType: imageUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
    };
  }
}
