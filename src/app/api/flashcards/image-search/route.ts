import { NextResponse } from 'next/server';
import { getEducationalImage, searchEducationalImages } from '@/lib/flashcards/imageService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { query, topic, conceptName, mode, limit } = await req.json().catch(() => ({}));

    const searchTarget = query || conceptName || topic;
    if (!searchTarget) {
      return NextResponse.json({ error: 'Search query or concept name is required.' }, { status: 400 });
    }

    if (mode === 'browse') {
      const images = await searchEducationalImages(searchTarget, limit || 8);
      return NextResponse.json({ images }, { status: 200 });
    }

    const image = await getEducationalImage(query || '', topic || 'General Science', conceptName);
    return NextResponse.json({ image }, { status: 200 });
  } catch (error: any) {
    console.error('[/api/flashcards/image-search] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to search educational image' }, { status: 500 });
  }
}
