/**
 * Chat History — persistence utility.
 *
 * Source-of-truth hierarchy for authenticated users:
 *   1. Supabase Postgres (primary, always awaited before broadcasting state changes)
 *   2. localStorage (optimistic cache — bootstraps UI before server responds)
 *
 * For guest sessions localStorage remains the sole store.
 *
 * All writes to Supabase are awaited (not fire-and-forget) so that a
 * sign-in on any new device produces a fully populated sidebar the moment
 * the auth listener triggers its hydration fetch.
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
  /** Grounded citations attached to retrieved context chunks */
  citations?: import('@/lib/prompts').Citation[];
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

// ─── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'nk-chat-history';
const TRANSCRIPT_KEY = 'nk-chat-transcripts';
const MAX_ITEMS = 30;

// ─── Change dispatcher ─────────────────────────────────────────────────────────
function dispatch() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('nk-chat-history-change'));
  }
}

// ─── Guest detection ───────────────────────────────────────────────────────────
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

// ─── Supabase client helper (lazy-loaded to avoid SSR issues) ─────────────────
async function getSupabaseUser() {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user };
  } catch {
    return { supabase: null, user: null };
  }
}

// ─── Cache read helpers (synchronous — for instant UI bootstrap) ───────────────

/** @cache Read chat session list from the local optimistic cache. */
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

/** @cache Read a single chat transcript from the local optimistic cache. */
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
 * Async transcript loader that tries the local cache first, then falls back
 * to Supabase. Use this in search modals and session resume flows.
 */
export async function getChatTranscriptWithFallback(id: string): Promise<ChatMessage[]> {
  // 1. Check the local cache first (instant)
  const local = getChatTranscript(id);
  if (local.length > 0) return local;

  // 2. Fall back to Supabase
  try {
    const { supabase, user } = await getSupabaseUser();
    if (!supabase || !user) return [];

    const { data, error } = await supabase
      .from('chat_transcripts')
      .select('messages')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[chatHistory] transcript remote fallback error:', error.message);
      return [];
    }

    const messages = (data?.messages as ChatMessage[]) ?? [];

    // Warm the local cache with the remote result
    if (messages.length > 0 && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(TRANSCRIPT_KEY);
        const map = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {};
        map[id] = messages;
        localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(map));
      } catch {
        /* quota exceeded — ignore */
      }
    }

    return messages;
  } catch {
    return [];
  }
}

// ─── Drop ephemeral fields before persisting ──────────────────────────────────
function stripEphemeral(m: ChatMessage): ChatMessage {
  const copy = { ...m };
  delete copy.images;
  delete copy.analyzerReport;
  return copy;
}

// ─── Chat transcript mutations ────────────────────────────────────────────────

/**
 * Persist a chat session's full message transcript.
 * Writes to localStorage immediately (optimistic cache) then awaits the
 * Supabase upsert so cloud state is always consistent after this call.
 */
export async function saveChatTranscript(id: string, messages: ChatMessage[]): Promise<void> {
  const strippedMessages = messages.slice(-100).map(stripEphemeral);

  // 1. Write to local optimistic cache immediately
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(TRANSCRIPT_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {};
      map[id] = strippedMessages;
      localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(map));
    } catch {
      /* quota exceeded — ignore */
    }
  }

  // 2. Await Supabase upsert (primary source of truth for authenticated users)
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return;

  const { error } = await supabase
    .from('chat_transcripts')
    .upsert(
      {
        id,
        user_id: user.id,
        messages: strippedMessages,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('[chatHistory] saveChatTranscript Supabase error:', error.message, error.details);
  }
}

/** Remove a session's transcript (called on session delete). */
export async function deleteChatTranscript(id: string): Promise<void> {
  // 1. Remove from local cache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(TRANSCRIPT_KEY);
      if (raw) {
        const map = JSON.parse(raw) as Record<string, ChatMessage[]>;
        delete map[id];
        localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(map));
      }
    } catch {
      /* empty */
    }
  }

  // 2. Delete from Supabase
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return;

  const { error } = await supabase
    .from('chat_transcripts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[chatHistory] deleteChatTranscript Supabase error:', error.message);
  }
}

// ─── Chat session mutations ────────────────────────────────────────────────────

/**
 * Save / upsert a chat session.
 * Writes to localStorage immediately (optimistic), then awaits the Supabase
 * upsert so AuthListener's next sync picks up a complete list.
 */
export async function saveChatSession(item: ChatHistoryItem): Promise<void> {
  // 1. Write to local optimistic cache first
  if (typeof window !== 'undefined') {
    try {
      const list = getChatHistory();
      const existingIdx = list.findIndex((c) => c.id === item.id);
      let updated: ChatHistoryItem[];
      if (existingIdx >= 0) {
        updated = list.map((c, i) => (i === existingIdx ? { ...c, ...item } : c));
      } else {
        updated = [item, ...list];
      }
      if (updated.length > MAX_ITEMS) updated = updated.slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      dispatch();
    } catch {
      /* quota exceeded — ignore */
    }
  }

  // 2. Await Supabase upsert
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return;

  const { error } = await supabase.from('chat_sessions').upsert(
    {
      id: item.id,
      user_id: user.id,
      title: item.title,
      subject: item.subject || null,
      unit: item.unit || null,
      mode: item.mode || 'sprint',
      timestamp: item.timestamp,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('[chatHistory] saveChatSession Supabase error:', error.message, error.details);
  }
}

/**
 * Delete a chat session and its associated transcript.
 * Removes from localStorage and awaits Supabase deletes.
 */
export async function deleteChatSession(id: string): Promise<void> {
  // 1. Remove from local cache
  if (typeof window !== 'undefined') {
    try {
      const updated = getChatHistory().filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      dispatch();
    } catch {
      /* empty */
    }
  }

  // 2. Delete transcript from local cache + Supabase in parallel
  await deleteChatTranscript(id);

  // 3. Delete session from Supabase
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return;

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[chatHistory] deleteChatSession Supabase error:', error.message);
  }
}

/**
 * Merge a remote sessions array from Supabase into the local cache.
 * Newer local entries (higher timestamp) win over remote — prevents overwriting
 * sessions that were created offline and not yet synced.
 */
export function mergeRemoteHistory(remote: ChatHistoryItem[]): void {
  if (typeof window === 'undefined' || remote.length === 0) return;
  try {
    const local = getChatHistory();
    const localMap = new Map(local.map((c) => [c.id, c]));

    for (const remoteItem of remote) {
      const localItem = localMap.get(remoteItem.id);
      // Remote wins when there's no local copy, or local is older
      if (!localItem || localItem.timestamp < remoteItem.timestamp) {
        localMap.set(remoteItem.id, remoteItem);
      }
    }

    const merged = Array.from(localMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    dispatch();
  } catch {
    /* quota exceeded — ignore */
  }
}

/** Clear the entire local chat history cache (used on sign-out). */
export function clearChatHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TRANSCRIPT_KEY);
  dispatch();
}

// ─── Display helpers ───────────────────────────────────────────────────────────

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
