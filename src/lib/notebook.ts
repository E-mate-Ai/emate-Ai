/**
 * Per-subject notebook utility.
 *
 * Source-of-truth hierarchy for authenticated users:
 *   1. Supabase Postgres (primary — all writes are awaited)
 *   2. localStorage (optimistic cache — bootstraps UI before server responds)
 *
 * For guest sessions localStorage/in-memory remain the sole stores.
 */
import { isGuestSession } from './chatHistory';

export interface NotebookEntry {
  id: string;
  content: string;
  timestamp: string;
  source: 'ai' | 'user';
  type?: 'file' | 'drive' | 'website' | 'text';
  title?: string;
  url?: string;
  size?: string;
}

export interface SubjectNotebook {
  subject: string;
  entries: NotebookEntry[];
  updatedAt: string;
}

// ─── Storage key helpers ───────────────────────────────────────────────────────
const storageKey = (subject: string) =>
  `nk-notebook-${subject.toLowerCase().replace(/\s+/g, '-')}`;

// ─── In-memory & Session-only guest store ─────────────────────────────────────
// Guests can create and access notebooks during the active browser session only.
// Guest data NEVER touches Supabase or persistent localStorage.
const guestNotebooksMemory = new Map<string, SubjectNotebook>();
let guestSubjectsMemory: Subject[] = [];

function getGuestSessionStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setGuestSessionStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (isGuestSession()) {
      guestNotebooksMemory.clear();
      guestSubjectsMemory = [];
      try {
        sessionStorage.clear();
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('nk-notebook-') || key === 'nk-custom-subjects') {
            localStorage.removeItem(key);
          }
        });
      } catch {}
    }
  });
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

// ─── Notebook read helpers ────────────────────────────────────────────────────

/**
 * @cache Load the notebook for a given subject from the local optimistic cache.
 */
export function getNotebook(subject: string): SubjectNotebook {
  if (typeof window === 'undefined' || !subject) {
    return { subject, entries: [], updatedAt: new Date().toISOString() };
  }
  if (isGuestSession()) {
    const mem = guestNotebooksMemory.get(subject.toLowerCase());
    if (mem) return mem;
    const sessionSaved = getGuestSessionStorage<SubjectNotebook>(`guest-nk-notebook-${subject.toLowerCase()}`);
    if (sessionSaved) {
      guestNotebooksMemory.set(subject.toLowerCase(), sessionSaved);
      return sessionSaved;
    }
    return {
      subject,
      entries: [],
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(storageKey(subject));
    if (!raw) return { subject, entries: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as SubjectNotebook;
  } catch {
    return { subject, entries: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * Async notebook loader that tries the local cache first, then falls back
 * to Supabase. Use this in context-building and cross-device sync flows.
 */
export async function getNotebookWithFallback(subject: string): Promise<SubjectNotebook> {
  const local = getNotebook(subject);
  if (local.entries.length > 0) return local;

  try {
    const { supabase, user } = await getSupabaseUser();
    if (!supabase || !user) return local;

    const id = `${user.id}-${subject.toLowerCase().replace(/\s+/g, '-')}`;
    const { data, error } = await supabase
      .from('user_notebooks')
      .select('notebook_data')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[notebook] getNotebookWithFallback error:', error.message);
      return local;
    }

    const remote = (data?.notebook_data as SubjectNotebook) ?? local;

    // Warm local cache
    if (remote.entries.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey(subject), JSON.stringify(remote));
      } catch {}
    }

    return remote;
  } catch {
    return local;
  }
}

/**
 * Merge notebooks fetched from the server into the local cache.
 * Called by AuthListener after a SIGNED_IN event. Remote wins for subjects
 * that have no local cache entry; local wins when a local entry is newer.
 */
export function mergeRemoteNotebooks(
  remoteNotebooks: { subject: string; notebook: SubjectNotebook }[]
): void {
  if (typeof window === 'undefined') return;
  for (const { subject, notebook } of remoteNotebooks) {
    try {
      const local = getNotebook(subject);
      const localIsNewer =
        local.entries.length > 0 && new Date(local.updatedAt) >= new Date(notebook.updatedAt);
      if (!localIsNewer) {
        localStorage.setItem(storageKey(subject), JSON.stringify(notebook));
      }
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('nk-notebook-change', { detail: { bulk: true } }));
}

// ─── Notebook write helpers ───────────────────────────────────────────────────

/**
 * Save (overwrite) the entire notebook for a subject.
 * Writes to localStorage immediately (optimistic), then awaits the Supabase upsert.
 */
export async function saveNotebook(subject: string, notebook: SubjectNotebook): Promise<void> {
  if (typeof window === 'undefined' || !subject) return;
  const updatedNotebook = { ...notebook, updatedAt: new Date().toISOString() };

  // Guest path: in-memory & sessionStorage only (never touches Supabase or persistent localStorage)
  if (isGuestSession()) {
    guestNotebooksMemory.set(subject.toLowerCase(), updatedNotebook);
    setGuestSessionStorage(`guest-nk-notebook-${subject.toLowerCase()}`, updatedNotebook);
    window.dispatchEvent(new CustomEvent('nk-notebook-change', { detail: { subject } }));
    return;
  }

  // 1. Write to local optimistic cache
  try {
    localStorage.setItem(storageKey(subject), JSON.stringify(updatedNotebook));
    window.dispatchEvent(new CustomEvent('nk-notebook-change', { detail: { subject } }));
  } catch {
    /* storage quota exceeded — ignore */
  }

  // 2. Await Supabase upsert
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return;

  const { error } = await supabase.from('user_notebooks').upsert(
    {
      id: `${user.id}-${subject.toLowerCase().replace(/\s+/g, '-')}`,
      user_id: user.id,
      subject,
      notebook_data: updatedNotebook,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('[notebook] saveNotebook Supabase error:', error.message, error.details);
  }
}

/**
 * Append a single entry to the subject's notebook.
 */
export async function appendToNotebook(
  subject: string,
  content: string,
  source: 'ai' | 'user' = 'ai'
): Promise<void> {
  const nb = getNotebook(subject);
  const entry: NotebookEntry = {
    id: `note-${Date.now()}`,
    content: content.trim(),
    timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    source,
  };
  nb.entries = [...nb.entries, entry];
  // Keep only the last 50 entries to avoid bloat
  if (nb.entries.length > 50) nb.entries = nb.entries.slice(-50);
  await saveNotebook(subject, nb);
}

/**
 * Delete a single notebook entry by id.
 */
export async function deleteNotebookEntry(subject: string, entryId: string): Promise<void> {
  const nb = getNotebook(subject);
  nb.entries = nb.entries.filter((e) => e.id !== entryId);
  await saveNotebook(subject, nb);
}

/**
 * Clear all notes for a subject.
 */
export async function clearNotebook(subject: string): Promise<void> {
  await saveNotebook(subject, { subject, entries: [], updatedAt: new Date().toISOString() });
}

/**
 * Build a compact system-prompt string from the notebook entries.
 * Used to inject per-subject context into the AI.
 */
export function buildNotebookContext(subject: string): string {
  const nb = getNotebook(subject);
  if (!nb.entries.length) return '';
  const lines = nb.entries
    .slice(-30)
    .map(
      (e) =>
        `- [${e.type ? e.type.toUpperCase() : e.source}]: ${e.title ? e.title + ' — ' : ''}${e.content}`
    )
    .join('\n');
  return `\n\n## ${subject} — Full Notebook Knowledge Base & Chat History (Use this complete memory of all past discussions and uploaded sources to answer accurately):\n${lines}`;
}

// ─── Subject management ───────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
  units: { id: string; name: string }[];
}

const STATIC_SUBJECTS: Subject[] = [];

/** @cache Read the subjects list from the local optimistic cache. */
export function getSubjects(): Subject[] {
  if (typeof window === 'undefined') return STATIC_SUBJECTS;
  if (isGuestSession()) {
    if (guestSubjectsMemory.length > 0) return guestSubjectsMemory;
    const sessionSaved = getGuestSessionStorage<Subject[]>('guest-nk-subjects');
    if (sessionSaved && Array.isArray(sessionSaved)) {
      guestSubjectsMemory = sessionSaved;
      return sessionSaved;
    }
    return guestSubjectsMemory;
  }
  try {
    const raw = localStorage.getItem('nk-custom-subjects');
    if (!raw) {
      localStorage.setItem('nk-custom-subjects', JSON.stringify(STATIC_SUBJECTS));
      return STATIC_SUBJECTS;
    }
    return JSON.parse(raw) as Subject[];
  } catch {
    return STATIC_SUBJECTS;
  }
}

/**
 * Merge a remote subjects array from Supabase into the local cache.
 * Called by AuthListener after SIGNED_IN.
 */
export function mergeRemoteSubjects(remote: Subject[]): void {
  if (typeof window === 'undefined' || remote.length === 0) return;
  try {
    const local = getSubjects();
    // Build a merged set: local entries win (may have offline additions)
    const localIds = new Set(local.map((s) => s.id));
    const merged = [
      ...local,
      ...remote.filter((s) => !localIds.has(s.id)),
    ];
    localStorage.setItem('nk-custom-subjects', JSON.stringify(merged));
    window.dispatchEvent(new Event('nk-subjects-changed'));
  } catch {}
}

/** Sync subjects list to Supabase (shared helper for add/delete/rename). */
async function syncSubjectsToSupabase(subjects: Subject[]): Promise<void> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return;

  const { error } = await supabase.from('user_subjects').upsert(
    {
      user_id: user.id,
      subjects,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('[notebook] syncSubjectsToSupabase error:', error.message);
  }
}

export async function addSubject(name: string): Promise<Subject[]> {
  if (typeof window === 'undefined') return getSubjects();
  const list = getSubjects();
  if (list.some((s) => s.name.toLowerCase() === name.toLowerCase())) return list;

  const newSubj: Subject = {
    id: `subj-${Date.now()}`,
    name,
    units: [{ id: `unit-${Date.now()}-1`, name: 'Introduction & Context Setup' }],
  };
  const updated = [...list, newSubj];

  // Guest path: in-memory & sessionStorage only (never touches Supabase)
  if (isGuestSession()) {
    guestSubjectsMemory = updated;
    setGuestSessionStorage('guest-nk-subjects', updated);
    window.dispatchEvent(new Event('nk-subjects-changed'));
    return updated;
  }

  // 1. Write to local optimistic cache
  localStorage.setItem('nk-custom-subjects', JSON.stringify(updated));
  window.dispatchEvent(new Event('nk-subjects-changed'));

  // 2. Await Supabase sync
  await syncSubjectsToSupabase(updated);

  return updated;
}

export async function deleteSubject(subjectId: string): Promise<Subject[]> {
  const list = getSubjects();
  const subjectToDelete = list.find((s) => s.id === subjectId);
  if (!subjectToDelete) return list;

  const updated = list.filter((s) => s.id !== subjectId);

  // Guest path: in-memory & sessionStorage only
  if (isGuestSession()) {
    guestSubjectsMemory = updated;
    setGuestSessionStorage('guest-nk-subjects', updated);
    guestNotebooksMemory.delete(subjectToDelete.name.toLowerCase());
    window.dispatchEvent(new Event('nk-subjects-changed'));
    return updated;
  }

  localStorage.setItem('nk-custom-subjects', JSON.stringify(updated));
  localStorage.removeItem(storageKey(subjectToDelete.name));
  window.dispatchEvent(new Event('nk-subjects-changed'));

  // Await Supabase sync
  await syncSubjectsToSupabase(updated);

  const { supabase, user } = await getSupabaseUser();
  if (supabase && user) {
    await supabase
      .from('user_notebooks')
      .delete()
      .eq('id', `${user.id}-${subjectToDelete.name.toLowerCase().replace(/\s+/g, '-')}`);
  }

  return updated;
}

export async function renameSubject(subjectId: string, newName: string): Promise<Subject[]> {
  const list = getSubjects();
  const target = list.find((s) => s.id === subjectId);
  if (!target || target.name === newName) return list;
  if (list.some((s) => s.name.toLowerCase() === newName.toLowerCase() && s.id !== subjectId)) {
    return list; // name collision
  }

  const oldName = target.name;
  const oldNotebook = getNotebook(oldName);
  const updated = list.map((s) => (s.id === subjectId ? { ...s, name: newName } : s));

  // Guest path: in-memory & sessionStorage only
  if (isGuestSession()) {
    guestSubjectsMemory = updated;
    setGuestSessionStorage('guest-nk-subjects', updated);
    guestNotebooksMemory.delete(oldName.toLowerCase());
    guestNotebooksMemory.set(newName.toLowerCase(), { ...oldNotebook, subject: newName });
    setGuestSessionStorage(`guest-nk-notebook-${newName.toLowerCase()}`, { ...oldNotebook, subject: newName });
    window.dispatchEvent(new Event('nk-subjects-changed'));
    return updated;
  }

  // 1. Write to local cache
  if (typeof window !== 'undefined') {
    localStorage.setItem('nk-custom-subjects', JSON.stringify(updated));
    localStorage.setItem(storageKey(newName), JSON.stringify({ ...oldNotebook, subject: newName }));
    localStorage.removeItem(storageKey(oldName));
    window.dispatchEvent(new Event('nk-subjects-changed'));
  }

  // 2. Await Supabase sync
  await syncSubjectsToSupabase(updated);

  const { supabase, user } = await getSupabaseUser();
  if (supabase && user) {
    await supabase
      .from('user_notebooks')
      .delete()
      .eq('id', `${user.id}-${oldName.toLowerCase().replace(/\s+/g, '-')}`);
    await saveNotebook(newName, { ...oldNotebook, subject: newName });
  }

  return updated;
}
