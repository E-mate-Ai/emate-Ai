import { NextResponse } from 'next/server';
import { generateFlashcardDeck } from '@/lib/flashcards/generatorService';
import type { FlashcardGenerationRequest } from '@/lib/flashcards/types';

export const dynamic = 'force-dynamic';

function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
}

export async function POST(req: Request) {
  try {
    const body: FlashcardGenerationRequest = await req.json().catch(() => ({ topic: '' }));

    if (!body.topic || typeof body.topic !== 'string' || !body.topic.trim()) {
      return NextResponse.json({ error: 'A study topic is required to generate flashcards.' }, { status: 400 });
    }

    const cookieHeader = req.headers.get('cookie');
    const authHeader = req.headers.get('authorization');
    const authKey = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
    const userCookieKey = getCookie(cookieHeader, 'user_openrouter_key');

    const apiKey =
      (typeof body.userApiKey === 'string' && body.userApiKey.trim() ? body.userApiKey.trim() : undefined) ||
      authKey ||
      userCookieKey ||
      process.env.OPENROUTER_SERVER_FREE_KEY ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
      return NextResponse.json(
        { error: 'OpenRouter API key is missing. Please connect your OpenRouter account or configure server keys.' },
        { status: 401 }
      );
    }

    const deck = await generateFlashcardDeck(apiKey, body);

    return NextResponse.json({ deck }, { status: 200 });
  } catch (error: any) {
    console.error('[/api/flashcards/generate] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate flashcards. Please try again.' },
      { status: 500 }
    );
  }
}
