/**
 * e-Mate AI — Vector Embedding Engine
 * Primary: Google Gemini text-embedding-004 (768-dimensional float vectors)
 * Fallback: Deterministic local semantic embedding for offline/dev resilience
 */

const GEMINI_EMBED_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004';

export interface EmbeddingResult {
  embedding: number[];
  provider: 'gemini' | 'local_fallback';
  dimensions: number;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  provider: 'gemini' | 'local_fallback';
  dimensions: number;
}

/**
 * Generates a 768-dimensional embedding vector for a single text string.
 */
export async function generateEmbedding(
  text: string,
  customApiKey?: string
): Promise<number[]> {
  const result = await generateEmbeddings([text], customApiKey);
  return result.embeddings[0];
}

/**
 * Generates 768-dimensional embeddings for a batch of text strings.
 * Handles rate-limit retries with exponential backoff and seamless local fallback.
 */
export async function generateEmbeddings(
  texts: string[],
  customApiKey?: string
): Promise<BatchEmbeddingResult> {
  if (!texts || texts.length === 0) {
    return { embeddings: [], provider: 'local_fallback', dimensions: 768 };
  }

  const apiKey =
    customApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey && apiKey !== 'your-gemini-api-key-here') {
    try {
      const embeddings = await fetchGeminiBatchEmbeddings(texts, apiKey);
      return {
        embeddings,
        provider: 'gemini',
        dimensions: 768,
      };
    } catch (err: any) {
      console.warn(
        `[Embeddings] Gemini API failed (${err?.message || 'network error'}). Activating local fallback embedding.`
      );
    }
  } else {
    console.info(
      '[Embeddings] GEMINI_API_KEY not configured. Using deterministic local fallback embeddings.'
    );
  }

  // Fallback path
  const localEmbeddings = texts.map((t) => generateLocalDeterministicEmbedding(t, 768));
  return {
    embeddings: localEmbeddings,
    provider: 'local_fallback',
    dimensions: 768,
  };
}

/**
 * Executes batch embedding calls to Google Gemini API in chunks of up to 50 items.
 */
async function fetchGeminiBatchEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const BATCH_SIZE = 50;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + BATCH_SIZE);

    const requestPayload = {
      requests: batchTexts.map((text) => ({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: text.slice(0, 8000) }], // Stay within token limit per chunk
        },
      })),
    };

    const response = await fetchWithRetry(
      `${GEMINI_EMBED_API_URL}:batchEmbedContents?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      },
      3
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const batchResult: number[][] = (data?.embeddings || []).map((e: any) => e.values);

    if (batchResult.length !== batchTexts.length) {
      throw new Error(
        `Gemini returned ${batchResult.length} embeddings for ${batchTexts.length} requested texts.`
      );
    }

    allEmbeddings.push(...batchResult);
  }

  return allEmbeddings;
}

/**
 * Fetch wrapper with exponential backoff on HTTP 429 / 503.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status >= 500) {
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
      }
      return res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Deterministic local feature projection embedding (768-dim normalized vector).
 * Preserves semantic keyword overlap and cosine similarity when external APIs are offline.
 */
export function generateLocalDeterministicEmbedding(
  text: string,
  dimensions = 768
): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = normalizedText.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    vector[0] = 1.0;
    return vector;
  }

  // Token hashing & n-gram projection into 768-dimensional space
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const hash1 = hashString(token);
    const hash2 = hashString(token + '_v2');

    const dim1 = Math.abs(hash1) % dimensions;
    const dim2 = Math.abs(hash2) % dimensions;

    const sign1 = hash1 > 0 ? 1.0 : -1.0;
    const sign2 = hash2 > 0 ? 0.7 : -0.7;

    vector[dim1] += sign1;
    vector[dim2] += sign2;

    // Bigram context
    if (i < tokens.length - 1) {
      const bigram = `${token}_${tokens[i + 1]}`;
      const biHash = hashString(bigram);
      const biDim = Math.abs(biHash) % dimensions;
      vector[biDim] += biHash > 0 ? 1.5 : -1.5;
    }
  }

  // Normalize to unit vector (L2 norm)
  let normSq = 0;
  for (let i = 0; i < dimensions; i++) {
    normSq += vector[i] * vector[i];
  }

  const norm = Math.sqrt(normSq);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }
  } else {
    vector[0] = 1.0;
  }

  return vector;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
