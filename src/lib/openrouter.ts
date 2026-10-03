// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter multi-model client — shared by the server chat route (edge-safe).
// No browser-only APIs: safe to import from Next.js route handlers (both
// nodejs + edge runtimes) and from client components (tree-shaken per use).
// ─────────────────────────────────────────────────────────────────────────────

import { ALL_FREE_MODELS, FREE_CASCADE_SLUGS, getFreeModelCascade, resolveModelId } from '@/lib/modelConfig';

export const OPENROUTER_ENDPOINT =
  'https://openrouter.ai/api/v1/chat/completions';

export interface ModelOption {
  label: string;
  id: string;
  /** Active, non-deprecated slug to retry if `id` is rejected (e.g. 404). */
  fallbackId?: string;
  isFlagship?: boolean;
}

/**
 * Task 1 — Active, non-deprecated OpenRouter model slugs.
 * NOTE: `google/gemini-2.0-flash-001` is deprecated/unrouted by OpenRouter and
 * has been replaced by the active `google/gemini-2.0-flash` slug.
 */
export const OPENROUTER_MODELS: ModelOption[] = [
  {
    label: 'e-Mate',
    id: 'emate',
    fallbackId: 'google/gemini-2.0-flash:free',
    isFlagship: true,
  },
  ...ALL_FREE_MODELS.filter((m) => m.id !== 'emate').map((m) => ({
    label: m.name,
    id: m.id,
    fallbackId: 'google/gemini-2.0-flash:free',
  })),
  {
    label: 'Gemini 2.0 Flash',
    id: 'google/gemini-2.0-flash',
    fallbackId: 'google/gemini-2.0-flash:free',
  },
  {
    label: 'Gemini 2.5 Flash',
    id: 'google/gemini-2.5-flash',
    fallbackId: 'google/gemini-2.0-flash:free',
  },
  {
    label: 'Gemini 2.5 Pro',
    id: 'google/gemini-2.5-pro',
    fallbackId: 'google/gemini-2.0-flash:free',
  },
  { label: 'Claude 3.5 Sonnet', id: 'anthropic/claude-3.5-sonnet', fallbackId: 'google/gemini-2.0-flash:free' },
  { label: 'GPT-4o Mini', id: 'openai/gpt-4o-mini', fallbackId: 'google/gemini-2.0-flash:free' },
];

export type OpenRouterModelId = (typeof OPENROUTER_MODELS)[number]['id'];

/** Resolve the active fallback slug for a model id, or undefined. */
export function getModelFallbackId(modelId: string): string | undefined {
  return OPENROUTER_MODELS.find((m) => m.id === modelId)?.fallbackId;
}

/** Lightweight, free failover models used when a model is quota'd or crashes. */
export const FALLBACK_MODELS = FREE_CASCADE_SLUGS;

export type OpenRouterRole = 'system' | 'user' | 'assistant';

export type OpenRouterMessage =
  | { role: OpenRouterRole; content: string }
  | { role: OpenRouterRole; content: Array<Record<string, unknown>> };

export interface OpenRouterCompletionOptions {
  /** Exact model id (see OPENROUTER_MODELS). */
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  /** Extra OpenRouter params merged into the payload (e.g. provider/transforms). */
  extraBody?: Record<string, unknown>;
  /** App identity sent in HTTP-Referer / X-Title headers. */
  referer?: string;
  title?: string;
}

export interface OpenRouterError extends Error {
  status?: number;
  /** True when the failure is a transient provider/quota fault (429/5xx). */
  retryable?: boolean;
}

/** Task 3 — Map OpenRouter HTTP status codes to user-friendly messages. */
export function getOpenRouterErrorMessage(status: number, modelId?: string): string {
  switch (status) {
    case 401:
      return "Invalid or missing OpenRouter API key. Ensure your key starts with 'sk-or-v1-'.";
    case 402:
      return 'The selected model requires credits. Switch to one of our free models (e.g. Gemini 2.0 Flash Free).';
    case 404:
      return `Selected model ID '${modelId || 'unknown'}' is invalid or deprecated.`;
    case 429:
      return 'Provider or OpenRouter rate limit exceeded. Retrying shortly...';
    case 500:
    case 502:
    case 503:
      return 'Upstream model provider is currently experiencing issues. Try switching models.';
    default:
      return `OpenRouter error (${status}). Please try again.`;
  }
}

/**
 * True for any HTTP error (quota, 402 credits, 404, 429 rate limit, 5xx server crash)
 * that justifies an automatic, silent failover to the next model in the 17-model mesh.
 */
export function shouldFallback(status: number): boolean {
  return status >= 400 && status !== 401;
}

/**
 * Filter out empty message objects before sending. Gemini rejects payloads
 * containing blank system/user messages with a 400 Bad Request, so drop any
 * message whose content is missing or whitespace-only before it reaches the wire.
 *
 * Multimodal content arrays (image/text) are kept as-is — they are never blank.
 */
export function sanitizeMessages(
  messages: OpenRouterMessage[]
): OpenRouterMessage[] {
  return messages.filter((msg) => {
    if (typeof msg.content === 'string') {
      return msg.content.trim().length > 0;
    }
    // Multimodal content arrays are non-empty by construction.
    return Array.isArray(msg.content) && msg.content.length > 0;
  });
}

/** Build the standard OpenRouter request headers. */
export function buildOpenRouterHeaders(
  apiKey: string,
  referer = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate-ai.runs-on.dev',
  title = 'e-Mate AI'
): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': referer,
    'X-Title': title,
  };
}

/**
/** Single OpenRouter HTTP execution helper. */
async function executeSingleOpenRouterCompletion(
  apiKey: string,
  options: OpenRouterCompletionOptions
): Promise<Record<string, unknown>> {
  const {
    model,
    messages,
    temperature = 0.7,
    max_tokens,
    stream = false,
    extraBody,
    referer,
    title,
  } = options;

  const targetModel = model === 'emate' ? resolveModelId('emate') : model;
  const payload: Record<string, unknown> = {
    model: targetModel,
    messages: sanitizeMessages(messages),
  };
  if (temperature !== undefined) payload.temperature = temperature;
  if (max_tokens !== undefined) payload.max_tokens = max_tokens;
  if (stream !== undefined) payload.stream = stream;
  if (extraBody) Object.assign(payload, extraBody);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: buildOpenRouterHeaders(apiKey, referer, title),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const e: OpenRouterError = new Error(
      'Network error reaching OpenRouter. Check your connection and try again.'
    );
    e.retryable = true;
    throw e;
  }

  if (!response.ok) {
    let rawMessage = '';
    try {
      const errJson = (await response.json()) as { error?: { message?: string } } | null;
      rawMessage = errJson?.error?.message || response.statusText || '';
    } catch {
      rawMessage = response.statusText || '';
    }

    const err: OpenRouterError = new Error(
      getOpenRouterErrorMessage(response.status, model)
    );
    err.status = response.status;
    err.retryable = shouldFallback(response.status);
    if (rawMessage) (err as OpenRouterError & { raw?: string }).raw = rawMessage;
    throw err;
  }

  return (await response.json()) as Record<string, unknown>;
}

/**
 * Task 2 — Execute OpenRouter chat-completion with silent 17-model auto-failover.
 * If one model crashes, 429s, or throws an error, it silently cascades through
 * all 17 free models in the mesh without the caller noticing.
 */
export async function openRouterCompletion(
  apiKey: string,
  options: OpenRouterCompletionOptions
): Promise<Record<string, unknown>> {
  const attemptOrder = getFreeModelCascade(options.model);

  let lastError: OpenRouterError | null = null;
  for (let i = 0; i < attemptOrder.length; i++) {
    const candidate = attemptOrder[i];
    try {
      return await executeSingleOpenRouterCompletion(apiKey, {
        ...options,
        model: candidate,
      });
    } catch (err) {
      const oe = err as OpenRouterError;
      lastError = oe;
      console.warn(`[e-Mate Mesh] Model ${candidate} (${i + 1}/${attemptOrder.length}) failed (${oe.status}): ${oe.message}. Silently cascading to next free model...`);
      // If error is 401 (invalid key entirely), abort immediately
      if (oe.status === 401) {
        throw oe;
      }
      // Otherwise, silently try the next model in the 17-model mesh
    }
  }

  throw lastError || new Error('e-Mate free AI model mesh temporarily unavailable.');
}

/** The OpenRouter model id used for image generation — FLUX.1 Schnell for high-speed educational visuals. */
export const IMAGE_GENERATION_MODEL = 'black-forest-labs/flux-1-schnell';

/**
 * Extract a `data:image/...` (or http) URL from an OpenRouter image-model
 * response. flux-1-schnell returns the image inline in
 * `choices[0].message.content`, either as a plain data-URL string, a markdown
 * `![alt](url)`, or a multimodal content array with `image_url` parts.
 */
function extractImageUrl(
  content: unknown,
  fallbackUrl?: unknown
): string | null {
  // Object wrapper fallback (e.g. `{ data: [...] }`-style providers).
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('https://')) return trimmed;
    const md = /!\[[^\]]*\]\(([^)]+)\)/.exec(trimmed);
    if (md && md[1]) return md[1];
    return null;
  }
  if (Array.isArray(content)) {
    for (const part of content) {
      if (
        part &&
        typeof part === 'object' &&
        'image_url' in part &&
        (part as { image_url?: { url?: string } }).image_url?.url
      ) {
        return (part as { image_url: { url: string } }).image_url.url;
      }
      if (
        part &&
        typeof part === 'object' &&
        'text' in part &&
        typeof (part as { text?: unknown }).text === 'string'
      ) {
        const fromText = extractImageUrl((part as { text: string }).text);
        if (fromText) return fromText;
      }
    }
  }
  // `fallbackUrl` — some responses surface the image in a top-level field.
  if (typeof fallbackUrl === 'string' && fallbackUrl.startsWith('data:image/')) return fallbackUrl;
  return null;
}

/**
 * Execute a single non-streaming image-generation request against the same
 * OpenRouter chat/completions endpoint (flux models are served there).
 *
 * Returns `{ imageUrl }` where `imageUrl` is a data: URL. Throws an
 * `OpenRouterError` with a user-friendly, status-aware message on non-2xx.
 */
export async function openRouterImageCompletion(
  apiKey: string,
  options: {
    prompt: string;
    model?: string;
    referer?: string;
    title?: string;
  }
): Promise<{ imageUrl: string }> {
  const {
    prompt,
    model = IMAGE_GENERATION_MODEL,
    referer,
    title,
  } = options;

  const payload: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content: prompt }],
  };

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: buildOpenRouterHeaders(apiKey, referer, title),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const e: OpenRouterError = new Error(
      'Network error reaching OpenRouter. Check your connection and try again.'
    );
    e.retryable = true;
    throw e;
  }

  if (!response.ok) {
    let rawMessage = '';
    try {
      const errJson = (await response.json()) as { error?: { message?: string }; message?: string } | null;
      rawMessage = errJson?.error?.message || errJson?.message || response.statusText || '';
      console.error('[OpenRouter API Error Details]:', { status: response.status, model, error: errJson });
    } catch {
      rawMessage = response.statusText || '';
      console.error('[OpenRouter API Error Details]:', { status: response.status, model, text: rawMessage });
    }

    const err: OpenRouterError = new Error(rawMessage || getOpenRouterErrorMessage(response.status, model));
    err.status = response.status;
    err.retryable = shouldFallback(response.status);
    if (rawMessage) (err as OpenRouterError & { raw?: string }).raw = rawMessage;
    throw err;
  }

  const json = (await response.json()) as {
    data?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  const content = json?.choices?.[0]?.message?.content;
  const imageUrl = extractImageUrl(content, json?.data);
  if (!imageUrl) {
    const err: OpenRouterError = new Error(
      'Image generation returned an empty response. Try a different prompt, or switch models.'
    );
    err.retryable = true;
    throw err;
  }

  return { imageUrl };
}

/**
 * Task 2b — Streaming variant for SSE piping. Performs the same auth + payload
 * construction and pre-flights non-2xx responses so callers can surface the
 * granular error message BEFORE streaming begins, then returns the raw
 * upstream Response (with a live .body) on success.
 *
 * Prefer this when the caller wants to forward the stream untouched.
 */
export async function openRouterCompletionStream(
  apiKey: string,
  options: OpenRouterCompletionOptions
): Promise<Response> {
  const {
    model,
    messages,
    temperature = 0.7,
    max_tokens,
    stream = true,
    extraBody,
    referer,
    title,
  } = options;

  const targetModel = model === 'emate' ? resolveModelId('emate') : model;
  const payload: Record<string, unknown> = {
    model: targetModel,
    messages: sanitizeMessages(messages),
    stream,
  };
  if (temperature !== undefined) payload.temperature = temperature;
  if (max_tokens !== undefined) payload.max_tokens = max_tokens;
  if (extraBody) Object.assign(payload, extraBody);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: buildOpenRouterHeaders(apiKey, referer, title),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const e: OpenRouterError = new Error(
      'Network error reaching OpenRouter. Check your connection and try again.'
    );
    e.retryable = true;
    throw e;
  }

  if (!response.ok) {
    let rawMessage = '';
    try {
      const errJson = (await response.json()) as { error?: { message?: string } } | null;
      rawMessage = errJson?.error?.message || response.statusText || '';
    } catch {
      rawMessage = response.statusText || '';
    }

    const err: OpenRouterError = new Error(
      getOpenRouterErrorMessage(response.status, model)
    );
    err.status = response.status;
    err.retryable = shouldFallback(response.status);
    if (rawMessage) (err as OpenRouterError & { raw?: string }).raw = rawMessage;
    throw err;
  }

  return response;
}

export interface OpenRouterKeyInfo {
  usage: number; // in USD
  limit: number | null; // in USD
  isFreeTier: boolean;
  label?: string;
}

/** Query OpenRouter API for real-time key usage, credits, and free tier status */
export async function fetchOpenRouterKeyInfo(apiKey: string): Promise<OpenRouterKeyInfo | null> {
  if (!apiKey || !apiKey.trim()) return null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.data) {
      return {
        usage: typeof json.data.usage === 'number' ? json.data.usage : 0,
        limit: typeof json.data.limit === 'number' ? json.data.limit : null,
        isFreeTier: Boolean(json.data.is_free_tier),
        label: json.data.label || 'OpenRouter Key',
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch OpenRouter key info:', err);
    return null;
  }
}
