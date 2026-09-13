import { openRouterCompletion, type OpenRouterError } from '@/lib/openrouter';

export const dynamic = 'force-dynamic';

/** Parse a specific cookie value from a raw Cookie header string */
function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
}

export async function POST(req: Request) {
  try {
    const { imageDataUrl, prompt } = await req.json().catch(() => ({}));

    // Validate inputs
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Image data URL is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'A prompt is required to explain the image.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cookieHeader = req.headers.get('cookie');
    const userKey = getCookie(cookieHeader, 'user_openrouter_key');

    // Image explanation requires authentication
    if (!userKey) {
      return new Response(
        JSON.stringify({
          error: 'Image explanation is available only for connected accounts.',
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
          error: 'OpenRouter API key is missing.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call vision model with multimodal content array
    const response = await openRouterCompletion(apiKey, {
      model: 'google/gemini-2.5-flash', // Vision-capable model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt.trim() || 'Please explain this image in detail.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl, // Accepts base64 data URIs or HTTPS URLs
              },
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const explanation = response?.choices?.[0]?.message?.content;

    if (!explanation) {
      return new Response(
        JSON.stringify({ error: 'No explanation generated from image.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        explanation:
          typeof explanation === 'string'
            ? explanation
            : Array.isArray(explanation)
              ? explanation
                  .filter((p: any) => p.type === 'text')
                  .map((p: any) => p.text)
                  .join('')
              : String(explanation),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    const oe = err as OpenRouterError;
    const status = oe?.status || 500;
    const message =
      oe?.message ||
      (err?.message as string) ||
      'Failed to explain image. Try again later.';

    console.error('[explain-image] Error:', {
      status,
      message,
      raw: (err as any)?.raw,
    });

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
