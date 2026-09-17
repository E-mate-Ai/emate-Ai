/**
 * Per-subject notebook utility.
 * Each subject gets its own localStorage key so context is always isolated.
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

const storageKey = (subject: string) => `nk-notebook-${subject.toLowerCase().replace(/\s+/g, '-')}`;

// In-memory fallback cache for guests so they can create and access notebooks during active session
const guestNotebooksMemory = new Map<string, SubjectNotebook>();
let guestSubjectsMemory: Subject[] = [];

if (typeof window !== 'undefined') {
  // Clear guest data when page unloads or session leaves
  window.addEventListener('beforeunload', () => {
    if (isGuestSession()) {
      guestNotebooksMemory.clear();
      guestSubjectsMemory = [];
      // Also clean up any lingering local storage guest notebooks
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('nk-notebook-') || key === 'nk-custom-subjects') {
            localStorage.removeItem(key);
          }
        });
      } catch {}
    }
  });
}

/**
 * Load the notebook for a given subject.
 */
export function getNotebook(subject: string): SubjectNotebook {
  if (typeof window === 'undefined') {
    return { subject, entries: [], updatedAt: new Date().toISOString() };
  }
  if (isGuestSession()) {
    return (
      guestNotebooksMemory.get(subject.toLowerCase()) || {
        subject,
        entries: [],
        updatedAt: new Date().toISOString(),
      }
    );
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
 * Save (overwrite) the entire notebook for a subject.
 */
export function saveNotebook(subject: string, notebook: SubjectNotebook): void {
  if (typeof window === 'undefined') return;
  const updatedNotebook = { ...notebook, updatedAt: new Date().toISOString() };
  if (isGuestSession()) {
    guestNotebooksMemory.set(subject.toLowerCase(), updatedNotebook);
    window.dispatchEvent(new CustomEvent('nk-notebook-change', { detail: { subject } }));
    return;
  }
  try {
    localStorage.setItem(storageKey(subject), JSON.stringify(updatedNotebook));
    window.dispatchEvent(new CustomEvent('nk-notebook-change', { detail: { subject } }));
  } catch {
    // storage quota exceeded — silently ignore
  }

  // Sync notebook entries to Supabase for signed-in users
  import('@/lib/supabase/client')
    .then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from('user_notebooks')
          .upsert(
            {
              id: `${user.id}-${subject.toLowerCase().replace(/\s+/g, '-')}`,
              user_id: user.id,
              subject,
              notebook_data: updatedNotebook,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .then(({ error }) => {
            if (error) console.error('Supabase Notebook Write Error:', error.message, error.details);
          });
      });
    })
    .catch(() => {});
}

/**
 * Append a single entry to the subject's notebook.
 */
export function appendToNotebook(
  subject: string,
  content: string,
  source: 'ai' | 'user' = 'ai'
): void {
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
  saveNotebook(subject, nb);
}

/**
 * Delete a single notebook entry by id.
 */
export function deleteNotebookEntry(subject: string, entryId: string): void {
  const nb = getNotebook(subject);
  nb.entries = nb.entries.filter((e) => e.id !== entryId);
  saveNotebook(subject, nb);
}

/**
 * Clear all notes for a subject.
 */
export function clearNotebook(subject: string): void {
  saveNotebook(subject, { subject, entries: [], updatedAt: new Date().toISOString() });
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
    .map((e) => `- [${e.type ? e.type.toUpperCase() : e.source}]: ${e.title ? e.title + ' — ' : ''}${e.content}`)
    .join('\n');
  return `\n\n## ${subject} — Full Notebook Knowledge Base & Chat History (Use this complete memory of all past discussions and uploaded sources to answer accurately):\n${lines}`;
}

export interface Subject {
  id: string;
  name: string;
  units: { id: string; name: string }[];
}

const STATIC_SUBJECTS: Subject[] = [];

export function getSubjects(): Subject[] {
  if (typeof window === 'undefined') return STATIC_SUBJECTS;
  if (isGuestSession()) return guestSubjectsMemory;
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

export function addSubject(name: string): Subject[] {
  if (typeof window === 'undefined') return getSubjects();
  const list = getSubjects();
  if (list.some((s) => s.name.toLowerCase() === name.toLowerCase())) return list;
  const newSubj: Subject = {
    id: `subj-${Date.now()}`,
    name,
    units: [{ id: `unit-${Date.now()}-1`, name: 'Introduction & Context Setup' }],
  };
  const updated = [...list, newSubj];
  if (isGuestSession()) {
    guestSubjectsMemory = updated;
    window.dispatchEvent(new Event('nk-subjects-changed'));
    return updated;
  }
  localStorage.setItem('nk-custom-subjects', JSON.stringify(updated));
  window.dispatchEvent(new Event('nk-subjects-changed'));

  // Sync custom subjects list to Supabase for signed-in users
  import('@/lib/supabase/client')
    .then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from('user_subjects')
          .upsert(
            {
              user_id: user.id,
              subjects: updated,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .then();
      });
    })
    .catch(() => {});

  return updated;
}

/**
 * Delete a subject notebook by id and clear all its stored notes.
 */
export function deleteSubject(subjectId: string): Subject[] {
  const list = getSubjects();
  const subjectToDelete = list.find((s) => s.id === subjectId);
  if (subjectToDelete) {
    if (isGuestSession()) {
      guestNotebooksMemory.delete(subjectToDelete.name.toLowerCase());
    } else {
      const key = `nk-notebook-${subjectToDelete.name.toLowerCase().replace(/\s+/g, '-')}`;
      if (typeof window !== 'undefined') localStorage.removeItem(key);
    }
  }
  const updated = list.filter((s) => s.id !== subjectId);
  if (isGuestSession()) {
    guestSubjectsMemory = updated;
    window.dispatchEvent(new Event('nk-subjects-changed'));
    return updated;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('nk-custom-subjects', JSON.stringify(updated));
    window.dispatchEvent(new Event('nk-subjects-changed'));
  }

  // Sync subject deletion to Supabase for authenticated users
  import('@/lib/supabase/client')
    .then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from('user_subjects')
          .upsert({ user_id: user.id, subjects: updated, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          .then();

        if (subjectToDelete) {
          const notebookId = `${user.id}-${subjectToDelete.name.toLowerCase().replace(/\s+/g, '-')}`;
          supabase.from('user_notebooks').delete().eq('id', notebookId).then();
        }
      });
    })
    .catch(() => {});

  return updated;
}

/**
 * Rename a subject notebook by id.
 */
export function renameSubject(subjectId: string, newName: string): Subject[] {
  const list = getSubjects();
  if (list.some((s) => s.name.toLowerCase() === newName.toLowerCase() && s.id !== subjectId)) {
    return list; // name collision
  }
  const updated = list.map((s) => (s.id === subjectId ? { ...s, name: newName } : s));
  if (isGuestSession()) {
    guestSubjectsMemory = updated;
    window.dispatchEvent(new Event('nk-subjects-changed'));
    return updated;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('nk-custom-subjects', JSON.stringify(updated));
    window.dispatchEvent(new Event('nk-subjects-changed'));
  }

  // Sync rename to Supabase for authenticated users
  import('@/lib/supabase/client')
    .then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from('user_subjects')
          .upsert({ user_id: user.id, subjects: updated, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          .then();
      });
    })
    .catch(() => {});

  return updated;
}
