import { openRouterImageCompletion } from '@/lib/openrouter';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Parse a specific cookie value from a raw Cookie header string */
function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
}

/**
 * High-speed, photorealistic image generator using Flux via Pollinations AI.
 * Free, resilient, no credit limits, returns inline base64 data-URL.
 */
async function generateWithPollinations(prompt: string, style?: string): Promise<string> {
  const styleHint =
    style === 'educational'
      ? ' High quality educational diagram and concept visual, clean background, sharp details'
      : style === 'realistic'
        ? ' Highly detailed photorealistic, cinematic lighting, 8k resolution'
        : style === 'vector'
          ? ' Clean vector illustration style, modern minimalist'
          : '';

  const cleanPrompt = `${prompt.trim()}${styleHint}`;
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'e-Mate-AI/1.0',
    },
    signal: AbortSignal.timeout(35000),
  });

  if (!res.ok) {
    throw new Error(`Pollinations image generation failed with status: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return `data:${contentType};base64,${base64}`;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const authHeaderKey = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

    const cookieHeader = req.headers.get('cookie');
    const cookieKey = getCookie(cookieHeader, 'user_openrouter_key');

    const { prompt, aspectRatio, style, userApiKey: bodyKey } = await req.json().catch(() => ({}));
    void aspectRatio;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'A prompt is required to generate an image.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userProvidedKey = authHeaderKey || bodyKey || cookieKey;

    // If user provided a specific personal OpenRouter key, attempt OpenRouter first
    if (userProvidedKey && userProvidedKey !== 'your-openrouter-api-key-here') {
      try {
        const { imageUrl } = await openRouterImageCompletion(userProvidedKey, {
          prompt: prompt.trim(),
          model: 'google/gemini-2.5-flash-image',
        });
        if (imageUrl) {
          return new Response(JSON.stringify({ imageUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (orErr) {
        console.warn('[Generate-Image] User OpenRouter key failed or exhausted, falling back to Flux engine:', orErr);
      }
    }

    // Default & reliable path: Flux engine via Pollinations (instant, free, high quality)
    try {
      const imageUrl = await generateWithPollinations(prompt, style);
      return new Response(JSON.stringify({ imageUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (pollinationsErr: any) {
      console.error('[Generate-Image] Pollinations failed:', pollinationsErr);
      return new Response(
        JSON.stringify({
          error: pollinationsErr?.message || 'Image generation failed. Please try again.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (err: any) {
    const message = err?.message || 'Failed to generate image. Try again later.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}