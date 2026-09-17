/**
 * Chat History — localStorage-backed utility.
 * Persists recent chats (metadata) and their full message transcripts across
 * sessions, and broadcasts changes via the `nk-chat-history-change` custom event
 * for real-time sidebar sync.
 */

/** An AI-generated image attached to a chat message (in-memory only — not
 *  persisted to the transcript, see saveChatTranscript's strip). */
export interface GeneratedImage {
  id: string;
  url: string; // data: URL returned by the image provider
  prompt: string; // original prompt used to generate
  aspectRatio?: string;
  style?: string;
  status?: 'generating' | 'done' | 'error';
}

/** A chat message. Defined here (single source of truth) and re-exported by
 *  the chat screen so both the lib and components share one type. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: 'sprint' | 'deep-dive';
  timestamp: string;
  subject?: string;
  isGeneralChat?: boolean;
  /** Generated images rendered live from React state. Never persisted. */
  images?: GeneratedImage[];
  /** Quiz analyzer report rendered inline. In-memory only, never persisted. */
  analyzerReport?: import('@/lib/agents/types').StudyAnalyzerReport;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  subject: string;
  unit: string;
  mode: 'sprint' | 'deep-dive';
  timestamp: number; // epoch ms
}

const STORAGE_KEY = 'nk-chat-history';
const TRANSCRIPT_KEY = 'nk-chat-transcripts';
const MAX_ITEMS = 30;

function dispatch() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('nk-chat-history-change'));
  }
}

export function isGuestSession(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if guest mode is explicitly enabled via the app
  const guestModeFlag = window.localStorage.getItem('guest_mode') === 'true';
  if (guestModeFlag) return true;

  // Check cookie-based guest flag & Supabase auth tokens
  if (typeof document !== 'undefined') {
    const cookies = document.cookie;
    const hasAuthCookie =
      cookies.includes('sb-') ||
      cookies.includes('sb-access-token') ||
      cookies.includes('sb-refresh-token') ||
      cookies.includes('next-auth.session-token') ||
      cookies.includes('__Secure-next-auth.session-token');

    // Also check localStorage for Supabase auth tokens
    const hasLocalAuth = Object.keys(localStorage).some(
      (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
    );

    if (hasAuthCookie || hasLocalAuth) return false;

    const isGuestCookie = cookies.includes('is_guest_user=true');
    if (isGuestCookie) return true;
  }

  return false;
}

export function getChatHistory(): ChatHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatHistoryItem[];
  } catch {
    return [];
  }
}

/* ── Full message transcripts ─────────────────────────────────────────────── */

/** Load the saved message transcript for a chat session (may be empty). */
export function getChatTranscript(id: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSCRIPT_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, ChatMessage[]>;
    return map[id] ?? [];
  } catch {
    return [];
  }
}

/**
 * Persist a chat session's full message transcript. Overwrites the latest
 * state so resuming a chat always shows the most recent conversation.
 */
export function saveChatTranscript(id: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  const strippedMessages = messages.slice(-100).map(stripEphemeral);
  try {
    const raw = localStorage.getItem(TRANSCRIPT_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {};
    map[id] = strippedMessages;
    localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(map));
  } catch {
    // quota exceeded – silently ignore
  }

  // Sync to Supabase in background for authenticated users
  import('@/lib/supabase/client')
    .then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from('chat_transcripts')
          .upsert(
            {
              id,
              user_id: user.id,
              messages: strippedMessages,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .then(({ error }) => {
            if (error) console.error('Supabase Chat Transcript Write Error:', error.message, error.details);
          });
      });
    })
    .catch(() => {});
}

/** Drop ephemeral fields (images, analyzerReport) from a message before persisting. */
function stripEphemeral(m: ChatMessage): ChatMessage {
  const copy = { ...m };
  delete copy.images;
  delete copy.analyzerReport;
  return copy;
}

/** Remove a session's transcript (called on session delete). */
export function deleteChatTranscript(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(TRANSCRIPT_KEY);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, ChatMessage[]>;
    delete map[id];
    localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(map));
  } catch {
    /* empty */
  }

  import('@/lib/supabase/client')
    .then(({ createClient }) => {
      const supabase = createClient();
      supabase.from('chat_transcripts').delete().eq('id', id).then();
    })
    .catch(() => {});
}

/**
 * Save / upsert a chat session.
 * If an item with the same id exists it is updated in-place; otherwise
 * it is prepended so the newest always comes first.
 */
export function saveChatSession(item: ChatHistoryItem): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getChatHistory();
    const existingIdx = list.findIndex((c) => c.id === item.id);
    let updated: ChatHistoryItem[];
    if (existingIdx >= 0) {
      // update title / timestamp if the session already exists
      updated = list.map((c, i) => (i === existingIdx ? { ...c, ...item } : c));
    } else {
      updated = [item, ...list];
    }
    // Keep most recent MAX_ITEMS
    if (updated.length > MAX_ITEMS) updated = updated.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dispatch();
  } catch {
    // quota exceeded – silently ignore
  }

  // Sync session metadata to Supabase
  import('@/lib/supabase/client')
    .then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from('chat_sessions')
          .upsert(
            {
              id: item.id,
              user_id: user.id,
              title: item.title,
              subject: item.subject,
              unit: item.unit,
              mode: item.mode,
              timestamp: item.timestamp,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .then();
      });
    })
    .catch(() => {});
}

export function deleteChatSession(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = getChatHistory().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    deleteChatTranscript(id); // drop the transcript with the session
    dispatch();
  } catch {
    /* empty */
  }

  import('@/lib/supabase/client')
    .then(({ createClient }) => {
      const supabase = createClient();
      supabase.from('chat_sessions').delete().eq('id', id).then();
    })
    .catch(() => {});
}

export function clearChatHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TRANSCRIPT_KEY);
  dispatch();
}

/** Friendly relative timestamp for display */
export function formatChatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}



