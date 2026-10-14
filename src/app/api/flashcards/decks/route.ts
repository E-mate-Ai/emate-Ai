import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { FlashcardDeck } from '@/lib/flashcards/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Unauthenticated users will rely on client localStorage
      return NextResponse.json({ decks: [], isGuest: true });
    }

    const { data: decks, error: dbError } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (dbError) {
      // If table does not exist yet or other DB issue, log and return empty rather than breaking
      console.warn('[/api/flashcards/decks] DB query error (falling back to local):', dbError.message);
      return NextResponse.json({ decks: [], error: dbError.message, isGuest: false });
    }

    const formattedDecks: FlashcardDeck[] = (decks || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      topic: row.topic,
      subject: row.subject || 'General',
      difficulty: row.difficulty || 'intermediate',
      learningMode: row.learning_mode || 'conceptual',
      cards: Array.isArray(row.cards) ? row.cards : [],
      cardCount: row.card_count || (Array.isArray(row.cards) ? row.cards.length : 0),
      thumbnailUrl: row.thumbnail_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userId: row.user_id,
    }));

    return NextResponse.json({ decks: formattedDecks, isGuest: false });
  } catch (error: any) {
    console.error('[/api/flashcards/decks] Unexpected error:', error);
    return NextResponse.json({ decks: [], error: error?.message || 'Server error' });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required to save deck to cloud.' }, { status: 401 });
    }

    const body: FlashcardDeck = await req.json();
    if (!body.id || !body.title || !body.cards) {
      return NextResponse.json({ error: 'Invalid deck payload.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const row = {
      id: body.id,
      user_id: user.id,
      title: body.title,
      topic: body.topic || body.title,
      subject: body.subject || 'General',
      difficulty: body.difficulty || 'intermediate',
      learning_mode: body.learningMode || 'conceptual',
      cards: body.cards,
      card_count: body.cards.length,
      thumbnail_url: body.thumbnailUrl || body.cards[0]?.image?.url || null,
      updated_at: now,
    };

    const { error: upsertError } = await supabase
      .from('flashcard_decks')
      .upsert(row, { onConflict: 'id' });

    if (upsertError) {
      console.warn('[/api/flashcards/decks] Upsert error:', upsertError.message);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deck: body });
  } catch (error: any) {
    console.error('[/api/flashcards/decks] Save error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save deck' }, { status: 500 });
  }
}
