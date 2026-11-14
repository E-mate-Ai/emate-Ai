import { IMAGE_GENERATION_MODEL, openRouterImageCompletion } from '@/lib/openrouter';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4']);
const RESOLUTIONS = new Set(['512', '768', '1K', '1.5K', '2K', '4K']);
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

function buildReferenceEditPrompt(
  request: string,
  referencePrompt: string,
  style: string,
  aspectRatio: string
): string {
  const styleGuidance: Record<string, string> = {
    creative: 'Improve polish, lighting, and composition while keeping the established visual direction.',
    educational: 'Keep the image accurate, legible, and uncluttered.',
    realistic: 'Keep materials, proportions, and lighting believable.',
    vector: 'Keep clean vector shapes, crisp edges, and a restrained palette.',
    illustration: 'Keep the established illustration style, shape language, and visual hierarchy.',
    anime: 'Keep the established anime style and character design.',
    watercolor: 'Keep the watercolor treatment and paper texture.',
    cinematic: 'Keep the cinematic visual direction and deliberate lighting.',
  };
  const context = referencePrompt.trim().slice(0, 1200);
  return [
    'Edit the supplied reference image according to the user’s request.',
    `User request: ${request.trim()}`,
    context ? `Original image brief for context: ${context}` : '',
    'Preserve the main subject, identity, recognizable details, and existing framing unless the user asks to change them. Apply only the requested improvements; do not introduce a different subject or unrelated objects.',
    styleGuidance[style],
    `Keep the existing ${aspectRatio} aspect ratio.`,
  ].filter(Boolean).join(' ');
}

async function getAvailableImageModels(apiKey: string, needsReference = false): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/images/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return needsReference ? [] : IMAGE_MODEL_PREFERENCES;

    const result = (await response.json()) as { data?: Array<{ id?: string; architecture?: { input_modalities?: string[]; output_modalities?: string[] } }> };
    const available = new Set((result.data || [])
      .filter((model) => model.id &&
        (!model.architecture?.output_modalities || model.architecture.output_modalities.includes('image')) &&
        (!needsReference || model.architecture?.input_modalities?.includes('image')))
      .map((model) => model.id as string));
    const preferred = IMAGE_MODEL_PREFERENCES.filter((model) => available.has(model));
    return preferred.length ? preferred : needsReference ? [] : IMAGE_MODEL_PREFERENCES;
  } catch {
    return needsReference ? [] : IMAGE_MODEL_PREFERENCES;
  }
}

function pollinationsDimensions(aspectRatio: string, resolution: string): { width: number; height: number } {
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
  const base = ratios[aspectRatio] || ratios['1:1'];
  if (resolution === '1K') return base;
  const targetLongEdge: Record<string, number> = {
    '512': 512,
    '768': 768,
    '1.5K': 1536,
    '2K': 2048,
    '4K': 4096,
  };
  const scale = (targetLongEdge[resolution] || 1024) / Math.max(base.width, base.height);
  return {
    width: Math.round((base.width * scale) / 8) * 8,
    height: Math.round((base.height * scale) / 8) * 8,
  };
}

async function generateWithPollinations(prompt: string, aspectRatio: string, resolution: string, apiKey: string): Promise<string> {
  const { width, height } = pollinationsDimensions(aspectRatio, resolution);
  const seed = Math.floor(Math.random() * 1_000_000);
  const pollinationsKey = apiKey;
  if (!pollinationsKey) {
    throw new Error('Image generation API is not configured.');
  }
  const baseUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;
  const headers: Record<string, string> = {
    'User-Agent': 'e-Mate-AI/1.0',
    Authorization: `Bearer ${pollinationsKey}`,
  };
  const response = await fetch(baseUrl, {
    headers,
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Image API authentication failed (HTTP ${response.status}). Check image API key.`);
    }
    throw new Error(`Image generation failed (HTTP ${response.status}).`);
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
    const {
      prompt,
      aspectRatio: requestedRatio,
      style: requestedStyle,
      userApiKey: bodyKey,
      referenceImageUrl,
      referencePrompt,
      promptIsEnhanced,
      promptIsFinal,
      resolution: requestedResolution,
    } = body;

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return Response.json({ error: 'A prompt is required to generate an image.' }, { status: 400 });
    }

    const aspectRatio = typeof requestedRatio === 'string' && ASPECT_RATIOS.has(requestedRatio)
      ? requestedRatio
      : '1:1';
    const normalizedResolution = typeof requestedResolution === 'string' ? requestedResolution.toUpperCase() : '1K';
    const resolution = RESOLUTIONS.has(normalizedResolution) ? normalizedResolution : '1K';
    const style = normalizeImageStyle(requestedStyle, prompt);
    const reference = typeof referenceImageUrl === 'string' ? referenceImageUrl : '';
    const validReference = !reference ||
      ((reference.startsWith('data:image/png;base64,') || reference.startsWith('data:image/jpeg;base64,') || reference.startsWith('data:image/webp;base64,')) && reference.length <= 20_000_000) ||
      (/^https:\/\//i.test(reference) && reference.length <= 4096);
    if (!validReference) {
      return Response.json({ error: 'The reference image is invalid or too large. Please use a PNG, JPEG, or WebP image under 15 MB.' }, { status: 400 });
    }
    const priorPrompt = typeof referencePrompt === 'string' ? referencePrompt.slice(0, 1200) : '';
    const enhancedPrompt = reference
      ? buildReferenceEditPrompt(prompt, priorPrompt, style, aspectRatio)
      : promptIsFinal === true || promptIsEnhanced === true
        ? prompt.trim()
        : buildImagePrompt(prompt, style, aspectRatio);

    // Image-to-image requests require a model that explicitly accepts image references.
    // The text-to-image Flux service cannot honor a visual reference.
    const userKey = authHeaderKey || (typeof bodyKey === 'string' ? bodyKey.trim() : '') || cookieKey;
    const serverKey = process.env.OPENROUTER_SERVER_FREE_KEY || process.env.OPENROUTER_API_KEY;
    const apiKey = userKey || serverKey;
    const pollinationsKey = process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN;
    if (reference && !apiKey) {
      throw Object.assign(new Error('Image editing needs an image model connection. Add an OpenRouter key in Settings, then try again.'), { status: 503 });
    }
    if (!apiKey && !pollinationsKey) {
      throw Object.assign(new Error('Image generation is not connected. Add an image provider key in Settings, then try again.'), { status: 503 });
    }
    if (!reference && pollinationsKey) {
      try {
        const imageUrl = await generateWithPollinations(enhancedPrompt, aspectRatio, resolution, pollinationsKey);
        return Response.json({
          imageUrl,
          model: 'Pollinations Flux',
          revisedPrompt: enhancedPrompt,
          aspectRatio,
          resolution,
          style,
        });
      } catch (pollinationsError: any) {
        console.warn('[Generate-Image] Dedicated Flux image API failed; attempting fallback.', pollinationsError);
      }
    }

    if (apiKey) {
      let lastModelError: any;
      try {
        const models = await getAvailableImageModels(apiKey, Boolean(reference));
        if (reference && models.length === 0) {
          throw Object.assign(new Error('No connected image model currently supports editing from a reference image.'), { status: 422 });
        }
        for (const model of models) {
          try {
            const generated = await openRouterImageCompletion(apiKey, {
              prompt: enhancedPrompt,
              model,
              aspectRatio,
              resolution,
              inputReferences: reference ? [reference] : undefined,
            });
            return Response.json({
              imageUrl: generated.imageUrl,
              model,
              revisedPrompt: enhancedPrompt,
              aspectRatio,
              resolution,
              style,
            });
          } catch (modelErr) {
            lastModelError = modelErr;
            console.warn(`[Generate-Image] ${model} failed; trying next fallback model.`, modelErr);
          }
        }
      } catch (openRouterErr) {
        console.warn('[Generate-Image] OpenRouter fallback failed.', openRouterErr);
        if (openRouterErr && typeof openRouterErr === 'object' && 'status' in openRouterErr) throw openRouterErr;
      }
      if (lastModelError?.status && lastModelError.status !== 404) throw lastModelError;
    }

    throw Object.assign(
      new Error(reference
        ? 'Could not edit this image. Check your image model connection and try again.'
        : 'Image generation failed. Please try again with a revised prompt.'),
      { status: 502 }
    );
  } catch (error: any) {
    console.error('[Generate-Image] Image generation failed:', error);
    return Response.json(
      { error: error?.message || 'Image generation failed. Please try again.' },
      { status: error?.status || 500 }
    );
  }
}
