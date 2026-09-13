import { openRouterImageCompletion, type OpenRouterError } from '@/lib/openrouter';

export const dynamic = 'force-dynamic';

/** Parse a specific cookie value from a raw Cookie header string */
function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
}

export async function POST(req: Request) {
  try {
    const { prompt, aspectRatio, style } = await req.json().catch(() => ({}));
    void aspectRatio; // accepted for forward-compat; flux-1-schnell fixes its own ratio

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'A prompt is required to generate an image.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cookieHeader = req.headers.get('cookie');

    // Image generation is authenticated-only (has real per-request cost). Guests
    // (no BYOK cookie) are rejected server-side even if the UI is bypassed, which
    // also protects the free OPENROUTER_SERVER_FREE_KEY from expensive image calls.
    const userKey = getCookie(cookieHeader, 'user_openrouter_key');
    if (!userKey) {
      return new Response(
        JSON.stringify({
          error: 'Image generation is available only for connected accounts. Connect your OpenRouter key to continue.',
          code: 'auth_required',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey =
      userKey || process.env.OPENROUTER_SERVER_FREE_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'OpenRouter API key is missing. Please connect your OpenRouter account to continue.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Style hint appended to the prompt (educational/default).
    const styleHint =
      style === 'educational'
        ? ' High quality educational visual, clean background, sharp text.'
        : style === 'realistic'
          ? ' Photorealistic, high detail.'
          : style === 'vector'
            ? ' Flat vector illustration style.'
            : '';

    const fullPrompt = `${prompt.trim()}${styleHint}`;

    const { imageUrl } = await openRouterImageCompletion(apiKey, {
      prompt: fullPrompt,
    });

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const oe = err as OpenRouterError;
    const status = oe?.status || 500;
    const message =
      oe?.message || (err?.message as string) || 'Failed to generate image. Try again later.';
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}