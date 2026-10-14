import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DeckProgress } from '@/lib/flashcards/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Unauthenticated users will persist ratings in local state
      return NextResponse.json({ success: true, isGuest: true });
    }

    const progress: DeckProgress = await req.json();
    if (!progress.deckId) {
      return NextResponse.json({ error: 'Deck ID is required.' }, { status: 400 });
    }

    const recordId = `${user.id}:${progress.deckId}`;
    const now = new Date().toISOString();

    const row = {
      id: recordId,
      user_id: user.id,
      deck_id: progress.deckId,
      card_ratings: progress.cardRatings || {},
      bookmarked_card_ids: progress.bookmarkedCardIds || [],
      cards_studied: progress.cardsStudied || 0,
      is_completed: Boolean(progress.isCompleted),
      last_reviewed_at: progress.lastReviewedAt || now,
      updated_at: now,
    };

    const { error: upsertError } = await supabase
      .from('flashcard_deck_progress')
      .upsert(row, { onConflict: 'id' });

    if (upsertError) {
      console.warn('[/api/flashcards/reviews] Progress upsert error:', upsertError.message);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, isGuest: false });
  } catch (error: any) {
    console.error('[/api/flashcards/reviews] Unexpected error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
