/**
 * GET /api/user/history
 * Returns all chat sessions for the currently authenticated user.
 * Used by AuthListener on SIGNED_IN to hydrate a new device with cloud data.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, title, subject, unit, mode, timestamp')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (sessionsError) {
      console.error('[/api/user/history] sessions error:', sessionsError.message);
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions ?? [] });
  } catch (err: any) {
    console.error('[/api/user/history] unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
