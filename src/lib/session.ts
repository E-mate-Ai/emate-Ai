/**
 * Session ID manager.
 * Generates and maintains a unique session_id for every user (guest or signed-in)
 * and safely syncs active session records via internal API route.
 */

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

/** Track and sync active session ID cleanly without PostgREST RLS 403 errors */
export async function trackUserSession(): Promise<string> {
  const sessionId = getOrCreateSessionId();
  if (!sessionId || typeof window === 'undefined') return sessionId;

  try {
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Non-blocking background sync
  }

  return sessionId;
}
