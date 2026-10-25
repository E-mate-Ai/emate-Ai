import { IMAGE_GENERATION_MODEL, openRouterImageCompletion } from '@/lib/openrouter';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4']);
const IMAGE_MODEL_PREFERENCES = [
  IMAGE_GENERATION_MODEL,
  'google/gemini-2.5-flash-image',
];

function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((cookie) => cookie.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
}

function normalizeImageStyle(style: unknown, prompt: string): string {
  if (typeof style === 'string' && ['creative', 'educational', 'realistic', 'vector', 'illustration', 'anime', 'watercolor', 'cinematic'].includes(style)) {
    return style;
  }
  if (/\b(diagram|chart|infographic|educational|labeled)\b/i.test(prompt)) return 'educational';
  if (/\b(photo|photograph|photorealistic|realistic)\b/i.test(prompt)) return 'realistic';
  if (/\b(vector|icon|flat illustration)\b/i.test(prompt)) return 'vector';
  if (/\b(anime|manga)\b/i.test(prompt)) return 'anime';
  if (/\b(watercolor|watercolour)\b/i.test(prompt)) return 'watercolor';
  if (/\b(cinematic|film still)\b/i.test(prompt)) return 'cinematic';
  if (/\b(illustration|illustrated|storybook)\b/i.test(prompt)) return 'illustration';
  return 'creative';
}

function buildImagePrompt(prompt: string, style: string, aspectRatio: string): string {
  const styleGuidance: Record<string, string> = {
    creative: 'Use a clear focal subject, intentional composition, rich but coherent detail, and polished lighting.',
    educational: 'Make the visual accurate, easy to understand at a glance, and uncluttered. Use labels only when the brief asks for them.',
    realistic: 'Use believable materials, natural proportions, photographic lighting, and realistic depth.',
    vector: 'Use clean vector shapes, crisp edges, a restrained palette, and minimal visual noise.',
    illustration: 'Use a cohesive illustrated style, expressive shapes, and clear visual hierarchy.',
    anime: 'Use a polished anime illustration style, expressive character design, and controlled linework.',
    watercolor: 'Use layered watercolor washes, soft edges, visible paper texture, and a balanced composition.',
    cinematic: 'Use cinematic framing, deliberate lighting, atmospheric depth, and a strong visual focal point.',
  };
  const orientation = aspectRatio === '16:9' || aspectRatio === '3:2' || aspectRatio === '5:4'
    ? 'Compose in a wide landscape frame.'
    : aspectRatio === '9:16' || aspectRatio === '3:4' || aspectRatio === '2:3' || aspectRatio === '4:5'
      ? 'Compose in a tall portrait frame.'
      : 'Compose in a balanced square frame.';

  const subject = prompt
    .trim()
    .replace(/^(?:(?:please|i want(?: you)? to|i need(?: you)? to|i would like you to|can you|could you|would you)\s+)+/i, '')
    .replace(/^(?:gen(?:erate|rate|arte)|create|make|draw|paint|render|illustrate|design|produce|show me)\s+(?:me\s+)?/i, '')
    .replace(/^an?\s+(?:image|picture|photo|photograph|illustration|drawing|visual|artwork)\s+(?:of|about|for)\s+/i, '')
    .replace(/\s+(?:image|picture|photo|photograph|illustration|drawing|visual|artwork)\s*$/i, '')
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '') || prompt.trim();

  return `Create one image. Depict this subject accurately: ${subject}. Keep the requested subject as the clear focal point; do not replace it with a different subject or add people unless requested. ${styleGuidance[style]} ${orientation} Follow the user's details closely. Do not add lettering, frames, logos, or watermarks unless requested.`;
}

async function getAvailableImageModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/images/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return IMAGE_MODEL_PREFERENCES;

    const result = (await response.json()) as { data?: Array<{ id?: string; architecture?: { output_modalities?: string[] } }> };
    const available = new Set(
      (result.data || [])
        .filter((model) => model.id && (!model.architecture?.output_modalities || model.architecture.output_modalities.includes('image')))
        .map((model) => model.id as string)
    );
    const preferred = IMAGE_MODEL_PREFERENCES.filter((model) => available.has(model));
    return preferred.length ? preferred : IMAGE_MODEL_PREFERENCES;
  } catch {
    return IMAGE_MODEL_PREFERENCES;
  }
}

function pollinationsDimensions(aspectRatio: string): { width: number; height: number } {
  const ratios: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1280, height: 720 },
    '9:16': { width: 720, height: 1280 },
    '4:3': { width: 1024, height: 768 },
    '3:4': { width: 768, height: 1024 },
    '3:2': { width: 1200, height: 800 },
    '2:3': { width: 800, height: 1200 },
    '4:5': { width: 864, height: 1080 },
    '5:4': { width: 1080, height: 864 },
  };
  return ratios[aspectRatio] || ratios['1:1'];
}

async function generateWithPollinations(prompt: string, aspectRatio: string): Promise<string> {
  const { width, height } = pollinationsDimensions(aspectRatio);
  const seed = Math.floor(Math.random() * 1_000_000);
  const pollinationsKey = process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN;
  if (!pollinationsKey) {
    throw new Error('Pollinations image generation is not configured. Add POLLINATIONS_API_KEY or use an OpenRouter key with image-generation credits.');
  }
  const baseUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=black-forest-labs/flux.1-schnell&nologo=true&seed=${seed}`;
  const headers: Record<string, string> = { 'User-Agent': 'e-Mate-AI/1.0' };
  if (pollinationsKey) headers.Authorization = `Bearer ${pollinationsKey}`;
  const response = await fetch(baseUrl, {
    headers,
    signal: AbortSignal.timeout(35000),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Pollinations rejected its API key. Check POLLINATIONS_API_KEY in the server environment.');
    }
    throw new Error(`Pollinations image generation failed (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error('The image service returned an invalid image response.');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength < 256) throw new Error('The image service returned an empty image.');
  return `data:${contentType};base64,${Buffer.from(bytes).toString('base64')}`;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const authHeaderKey = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
    const cookieKey = getCookie(req.headers.get('cookie'), 'user_openrouter_key');
    const body = await req.json().catch(() => ({}));
    const { prompt, aspectRatio: requestedRatio, style: requestedStyle, userApiKey: bodyKey } = body;

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return Response.json({ error: 'A prompt is required to generate an image.' }, { status: 400 });
    }

    const aspectRatio = typeof requestedRatio === 'string' && ASPECT_RATIOS.has(requestedRatio)
      ? requestedRatio
      : '1:1';
    const style = normalizeImageStyle(requestedStyle, prompt);
    const enhancedPrompt = buildImagePrompt(prompt, style, aspectRatio);
    const apiKey =
      authHeaderKey ||
      (typeof bodyKey === 'string' ? bodyKey.trim() : '') ||
      cookieKey ||
      process.env.OPENROUTER_SERVER_FREE_KEY ||
      process.env.OPENROUTER_API_KEY;

    let lastOpenRouterError: any;
    const hasOpenRouterKey = Boolean(apiKey && apiKey !== 'your-openrouter-api-key-here');
    if (hasOpenRouterKey) {
      const models = await getAvailableImageModels(apiKey);
      for (const model of models) {
        try {
          const generated = await openRouterImageCompletion(apiKey, {
            prompt: enhancedPrompt,
            model,
            aspectRatio,
            resolution: '1K',
          });
          return Response.json({
            imageUrl: generated.imageUrl,
            model,
            revisedPrompt: enhancedPrompt,
            aspectRatio,
            style,
          });
        } catch (error) {
          lastOpenRouterError = error;
          console.warn(`[Generate-Image] ${model} failed; trying the next image provider.`, error);
        }
      }
    }

    const hasPollinationsKey = Boolean(process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN);
    if (hasPollinationsKey) {
      const imageUrl = await generateWithPollinations(enhancedPrompt, aspectRatio);
      return Response.json({ imageUrl, model: 'Flux image service', revisedPrompt: enhancedPrompt, aspectRatio, style });
    }
    if (lastOpenRouterError) {
      const status = lastOpenRouterError.status === 401 ? 401 : lastOpenRouterError.status === 402 ? 402 : 502;
      throw Object.assign(new Error(lastOpenRouterError.message || 'OpenRouter image generation failed.'), { status });
    }
    throw Object.assign(
      new Error('Image generation needs a configured provider. Add an OpenRouter API key with image-generation credits or a POLLINATIONS_API_KEY to the server environment.'),
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[Generate-Image] Image generation failed:', error);
    return Response.json(
      { error: error?.message || 'Image generation failed. Please try again.' },
      { status: error?.status || 500 }
    );
  }
}
