import type { EducationalImage } from './types';

// In-memory cache for search queries to respect Wikimedia rate limits and improve speed
const imageCache = new Map<string, { image: EducationalImage | null; timestamp: number }>();
const browseCache = new Map<string, { images: EducationalImage[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

/** Strip HTML tags and entities from Wikimedia metadata strings */
function cleanHtml(input: string | undefined): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** Sanitize and refine query to find the best educational/scientific diagram */
export function sanitizeQuery(rawQuery: string): string {
  return rawQuery
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Check if the image format is web-safe and modern */
function isSupportedImageExtension(url: string): boolean {
  const cleanUrl = url.toLowerCase().split('?')[0];
  return (
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.webp') ||
    cleanUrl.endsWith('.svg')
  );
}

/**
 * Fetch multiple legitimate educational images from Wikimedia Commons Action API.
 * Uses high-resolution rendered thumbs (`iiurlwidth=800`) with full verified metadata.
 */
export async function searchEducationalImages(
  query: string,
  limit: number = 8
): Promise<EducationalImage[]> {
  const cleanQ = sanitizeQuery(query);
  if (!cleanQ) return [];

  const cacheKey = `${cleanQ}:::limit${limit}`.toLowerCase();
  const cached = browseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.images.length > 0) {
    return cached.images;
  }

  const results: EducationalImage[] = [];

  try {
    const fetchLimit = Math.min(Math.max(limit * 2, 6), 20);
    const searchUrl =
      `https://commons.wikimedia.org/w/api.php?action=query` +
      `&generator=search` +
      `&gsrsearch=${encodeURIComponent(cleanQ)}` +
      `&gsrnamespace=6` + // File namespace
      `&gsrlimit=${fetchLimit}` +
      `&prop=imageinfo` +
      `&iiprop=url|size|extmetadata` +
      `&iiurlwidth=800` +
      `&format=json`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'e-Mate-AI-Educational-Assistant/1.0 (academic study copilot; contact@emate.live)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.query?.pages) {
        const pages = Object.values(data.query.pages) as Array<{
          title?: string;
          imageinfo?: Array<{
            url?: string;
            thumburl?: string;
            thumbwidth?: number;
            thumbheight?: number;
            descriptionurl?: string;
            extmetadata?: {
              Artist?: { value?: string };
              LicenseShortName?: { value?: string };
              License?: { value?: string };
              ImageDescription?: { value?: string };
            };
          }>;
        }>;

        for (const page of pages) {
          if (results.length >= limit) break;
          const info = page.imageinfo?.[0];
          if (!info) continue;

          const rawUrl = info.thumburl || info.url;
          if (!rawUrl || !isSupportedImageExtension(rawUrl)) continue;

          const meta = info.extmetadata || {};
          const artist = cleanHtml(meta.Artist?.value);
          const license = meta.LicenseShortName?.value || meta.License?.value || 'CC BY-SA / Wikimedia Commons';
          const description = cleanHtml(meta.ImageDescription?.value) || page.title?.replace(/^File:/i, '') || cleanQ;
          const sourceUrl = info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`;

          results.push({
            url: rawUrl,
            alt: description.slice(0, 150),
            sourceName: 'Wikimedia Commons',
            sourceUrl,
            license,
            attribution: artist ? `By ${artist.slice(0, 80)} (${license})` : `Wikimedia Commons (${license})`,
            width: info.thumbwidth || 600,
            height: info.thumbheight || 400,
          });
        }
      }
    }
  } catch (error) {
    // Non-blocking timeout or error
  }

  // Cache results
  if (results.length > 0) {
    browseCache.set(cacheKey, { images: results, timestamp: Date.now() });
  }

  return results;
}

/**
 * Fetch legitimate educational image from Wikimedia Commons Action API.
 */
async function fetchFromWikimediaCommons(query: string): Promise<EducationalImage | null> {
  const images = await searchEducationalImages(query, 2);
  return images[0] || null;
}

/**
 * Fallback to Wikipedia REST API Summary for the term.
 */
async function fetchFromWikipediaSummary(query: string): Promise<EducationalImage | null> {
  try {
    const cleanTerm = query.split(' ')[0] || query;
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'e-Mate-AI-Educational-Assistant/1.0 (academic study copilot; contact@emate.live)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    const imageInfo = data.originalimage || data.thumbnail;
    if (imageInfo?.source && isSupportedImageExtension(imageInfo.source)) {
      return {
        url: imageInfo.source,
        alt: data.title || query,
        sourceName: 'Wikipedia',
        sourceUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
        license: 'CC BY-SA 4.0 / Public Domain',
        attribution: `Wikipedia contributors (${data.title})`,
        width: imageInfo.width,
        height: imageInfo.height,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * High-quality SVG diagram generator for abstract topics when no photographic / Commons match is found.
 * Modernized to e-Mate visual blue/slate branding.
 */
export function generateEducationalDiagramSVG(concept: string, topic: string): EducationalImage {
  const safeConcept = concept.replace(/[<>&"]/g, '');
  const safeTopic = topic.replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0060df" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0060df"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Deep Obsidian Slate Background -->
  <rect width="600" height="400" rx="20" fill="url(#bgGrad)"/>

  <!-- Radial Background Accent Glow -->
  <circle cx="300" cy="200" r="160" fill="url(#glowGrad)"/>

  <!-- Subtle grid lines -->
  <g stroke="#334155" stroke-width="0.8" stroke-opacity="0.35">
    <line x1="60" y1="0" x2="60" y2="400" />
    <line x1="180" y1="0" x2="180" y2="400" />
    <line x1="300" y1="0" x2="300" y2="400" />
    <line x1="420" y1="0" x2="420" y2="400" />
    <line x1="540" y1="0" x2="540" y2="400" />
    <line x1="0" y1="80" x2="600" y2="80" />
    <line x1="0" y1="160" x2="600" y2="160" />
    <line x1="0" y1="240" x2="600" y2="240" />
    <line x1="0" y1="320" x2="600" y2="320" />
  </g>

  <!-- Central Visual Container -->
  <rect x="70" y="55" width="460" height="290" rx="18" fill="#131B2E" stroke="#2563EB" stroke-width="1.5" stroke-opacity="0.6" filter="url(#cardShadow)"/>

  <!-- Schematic Core Circles / Pulse -->
  <circle cx="300" cy="165" r="54" fill="#0060df" fill-opacity="0.12" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="300" cy="165" r="36" fill="#0060df" fill-opacity="0.25" stroke="#60A5FA" stroke-width="2"/>

  <!-- Node Connection Accents -->
  <line x1="175" y1="165" x2="245" y2="165" stroke="#3B82F6" stroke-width="2.5" stroke-dasharray="5 3"/>
  <line x1="355" y1="165" x2="425" y2="165" stroke="#3B82F6" stroke-width="2.5" stroke-dasharray="5 3"/>
  <circle cx="165" cy="165" r="14" fill="#1E293B" stroke="#60A5FA" stroke-width="2.5"/>
  <circle cx="435" cy="165" r="14" fill="#1E293B" stroke="#60A5FA" stroke-width="2.5"/>

  <!-- Center Graphic Icon (Pulse/Atom) -->
  <path d="M 300 148 L 300 182 M 283 165 L 317 165" stroke="#93C5FD" stroke-width="3" stroke-linecap="round"/>
  <circle cx="300" cy="165" r="5" fill="#FFFFFF"/>

  <!-- Badge / Subject Tag -->
  <rect x="220" y="85" width="160" height="26" rx="13" fill="url(#accentGrad)" />
  <text x="300" y="102" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${safeTopic.toUpperCase().slice(0, 20)}</text>

  <!-- Concept Title in High-Clarity Typography -->
  <text x="300" y="265" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#F8FAFC" text-anchor="middle">${safeConcept.slice(0, 36)}</text>
  <text x="300" y="295" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">e-Mate Educational Concept Diagram</text>
</svg>`;

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    url: dataUrl,
    alt: `${concept} educational visual diagram`,
    sourceName: 'e-Mate Visual System',
    sourceUrl: 'https://emate.live',
    license: 'CC BY-SA 4.0 (Educational Visual)',
    attribution: 'e-Mate AI Visual Learning Engine',
    width: 600,
    height: 400,
  };
}

/**
 * Main public entrypoint: Retrieve educational image for a flashcard concept.
 * Queries Wikimedia Commons -> Wikipedia -> SVG fallback.
 */
export async function getEducationalImage(
  imageQuery: string,
  topic: string,
  conceptName?: string
): Promise<EducationalImage> {
  const cleanQ = sanitizeQuery(imageQuery || conceptName || topic);
  const cacheKey = `${topic}:::${cleanQ}`.toLowerCase();

  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.image) {
    return cached.image;
  }

  // 1. Try Wikimedia Commons with specific query (2s timeout)
  let result = await fetchFromWikimediaCommons(cleanQ);

  // 2. If no result, try Wikipedia summary once
  if (!result && conceptName && conceptName !== cleanQ) {
    result = await fetchFromWikipediaSummary(conceptName);
  }

  // 3. Instant crisp SVG diagram fallback for speed and reliable visual learning
  if (!result) {
    result = generateEducationalDiagramSVG(conceptName || cleanQ, topic);
  }

  // Cache the valid verified result
  imageCache.set(cacheKey, { image: result, timestamp: Date.now() });

  return result;
}
