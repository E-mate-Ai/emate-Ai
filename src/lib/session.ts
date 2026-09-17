/**
 * Session ID manager.
 * Generates and maintains a unique session_id for every user (guest or signed-in)
 * and syncs active session records to Supabase (`user_sessions` table).
 */
import { createClient } from '@/lib/supabase/client';

const SESSION_KEY = 'nk_user_session_id';

/** Get or create a unique session ID for the current browser user */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
    document.cookie = `user_session_id=${sessionId}; path=/; max-age=31536000; SameSite=Lax`;
  }
  return sessionId;
}

/** Track and sync active session ID to Supabase `user_sessions` table */
export async function trackUserSession(): Promise<string> {
  const sessionId = getOrCreateSessionId();
  if (!sessionId || typeof window === 'undefined') return sessionId;

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('user_sessions').upsert(
      {
        session_id: sessionId,
        user_id: user?.id || null,
        is_guest: !user,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        last_active_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    );
  } catch (err) {
    // Non-blocking background sync
  }

  return sessionId;
}
