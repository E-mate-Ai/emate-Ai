import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .trim();
}

/**
 * POST /api/documents/fetch-title
 * Extracts the real page title (<title> or og:title) from a given website URL.
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();

        // 1. Check og:title
        const ogMatch =
          html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
        if (ogMatch && ogMatch[1]?.trim()) {
          return NextResponse.json({
            title: decodeHtmlEntities(ogMatch[1]),
            url: targetUrl,
            success: true,
          });
        }

        // 2. Check <title>
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch && titleMatch[1]?.trim()) {
          const rawTitle = titleMatch[1].replace(/\s+/g, ' ').trim();
          if (rawTitle.length > 0) {
            return NextResponse.json({
              title: decodeHtmlEntities(rawTitle),
              url: targetUrl,
              success: true,
            });
          }
        }
      }
    } catch {
      // Fallback on timeout or network error
    }

    // Clean fallback derived from URL pathname/hostname
    try {
      const parsed = new URL(targetUrl);
      const host = parsed.hostname.replace(/^www\./, '');
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const lastPart = pathParts.pop();
      const title = lastPart
        ? `${decodeURIComponent(lastPart).replace(/[-_]+/g, ' ')} (${host})`
        : host;
      return NextResponse.json({
        title,
        url: targetUrl,
        success: true,
        isFallback: true,
      });
    } catch {
      return NextResponse.json({
        title: targetUrl.replace(/^https?:\/\//, ''),
        url: targetUrl,
        success: true,
        isFallback: true,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
