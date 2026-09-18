'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, MessageSquare, FileText, CornerDownLeft } from 'lucide-react';
import {
  getChatHistory,
  getChatTranscript,
  getChatTranscriptWithFallback,
  formatChatTime,
  type ChatHistoryItem,
  type ChatMessage,
} from '@/lib/chatHistory';
import { fetchChatSessions } from '@/lib/supabase/notebookAndHistory';

interface ChatSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (chat: ChatHistoryItem, messages: ChatMessage[]) => void;
}

interface SearchResult {
  chat: ChatHistoryItem;
  /** Full transcript for this chat (passed through to the load event). */
  transcript: ChatMessage[];
  /** Where the query matched — used to build the snippet/highlight. */
  snippet: string;
  snippetSource: 'title' | 'subject' | 'unit' | 'message';
}

const MAX_RESULTS = 12;

/** Case-insensitive occurrence of `needle` in `hay`, or -1. */
function indexOfCase(hay: string, needle: string): number {
  return hay.toLowerCase().indexOf(needle.toLowerCase());
}

/** Build a ~80 char snippet window around the first match of `needle`. */
function buildSnippet(text: string, needle: string): string {
  const idx = indexOfCase(text, needle);
  if (idx < 0) return text.slice(0, 80);
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + needle.length + 50);
  let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';
  return snippet;
}

/** Render a snippet with matched tokens wrapped in a highlighted <mark>. */
function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(<span key={key++}>{text.slice(i)}</span>);
      break;
    }
    if (idx > i) parts.push(<span key={key++}>{text.slice(i, idx)}</span>);
    parts.push(
      <mark
        key={key++}
        className="rounded-[3px] px-0.5 font-semibold"
        style={{ background: '#1f51ff33', color: 'inherit' }}
      >
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

export default function ChatSearchModal({ open, onClose, onSelect }: ChatSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  /** Remote chat sessions fetched from Supabase — supplements local cache. */
  const [remoteHistory, setRemoteHistory] = useState<ChatHistoryItem[]>([]);

  // Keep the modal theme in sync with the app.
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const saved = localStorage.getItem('nk-theme');
    setTheme(saved === 'dark' ? 'dark' : 'light');
    const sync = () => setTheme(localStorage.getItem('nk-theme') === 'dark' ? 'dark' : 'light');
    window.addEventListener('storage', sync);
    window.addEventListener('nk-theme', sync as EventListener);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('nk-theme', sync as EventListener);
    };
  }, [open]);

  // Reset + autofocus on open, and fetch remote sessions for cross-device search.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());

      // Fetch remote sessions to supplement local cache
      fetchChatSessions()
        .then((sessions) => setRemoteHistory(sessions))
        .catch(() => {});
    } else {
      setRemoteHistory([]);
    }
  }, [open]);

  // Esc closes the palette.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    if (!open || !query.trim()) return [];
    const q = query.trim();

    // Merge local + remote sessions, de-duplicated by id
    const localChats = getChatHistory();
    const localIds = new Set(localChats.map((c) => c.id));
    const allChats = [
      ...localChats,
      ...remoteHistory.filter((c) => !localIds.has(c.id)),
    ];

    const out: SearchResult[] = [];
    for (const chat of allChats) {
      const transcript = getChatTranscript(chat.id);

      // Title / subject / unit metadata matches.
      const titleMatch = indexOfCase(chat.title, q) >= 0;
      const subjectMatch = indexOfCase(chat.subject, q) >= 0;
      const unitMatch = indexOfCase(chat.unit, q) >= 0;

      if (titleMatch || subjectMatch || unitMatch) {
        const source = titleMatch ? 'title' : subjectMatch ? 'subject' : 'unit';
        const base =
          source === 'title' ? chat.title : source === 'subject' ? chat.subject : chat.unit;
        out.push({
          chat,
          transcript: transcript.slice(-100),
          snippet: buildSnippet(base, q),
          snippetSource: source,
        });
        if (out.length >= MAX_RESULTS) return out;
      }

      // Message-content matches (search the persisted local transcript).
      for (const m of transcript) {
        if (indexOfCase(m.content, q) >= 0) {
          out.push({
            chat,
            transcript: transcript.slice(-100),
            snippet: buildSnippet(m.content, q),
            snippetSource: 'message',
          });
          break; // one card per chat
        }
      }
      if (out.length >= MAX_RESULTS) return out;
    }
    return out;
  }, [open, query, remoteHistory]);

  const select = async (res: SearchResult) => {
    // Use fallback loader: tries local cache, then fetches from Supabase
    const transcript =
      res.transcript.length > 0
        ? res.transcript
        : await getChatTranscriptWithFallback(res.chat.id);
    onSelect(res.chat, transcript);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(results[activeIndex]);
    }
  };

  if (!open) return null;

  const dark = theme === 'dark';

  const content = (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center px-4 pt-[14vh]"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[20px] shadow-2xl"
        style={{
          background: dark ? '#131316' : '#ffffff',
          border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
        onKeyDown={onKeyDown}
      >
        {/* Search input bar */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{
            borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          }}
        >
          <Search
            size={16}
            style={dark ? { color: '#8aa2ff' } : { color: '#1f51ff' }}
            className="shrink-0"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search chat history…"
            spellCheck={false}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
            style={{ color: dark ? '#ffffff' : '#000000' }}
          />
          <kbd
            className="hidden sm:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              color: dark ? '#71717a' : '#52525b',
              border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
              background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results / empty state */}
        <div className="max-h-[48vh] overflow-y-auto p-2">
          {!query.trim() && (
            <p
              className="px-3 py-8 text-center text-sm"
              style={{ color: dark ? '#71717a' : '#a1a1aa' }}
            >
              Type to search your chat history — titles, subjects and message content.
            </p>
          )}

          {query.trim() && results.length === 0 && (
            <div className="px-4 py-10 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center mb-2.5 shadow-glow-subtle">
                <FileText size={18} strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold font-display" style={{ color: dark ? '#f8fafc' : '#0f172a' }}>
                No chats matching “{query}”
              </p>
              <p className="text-xs mt-1" style={{ color: dark ? '#94a3b8' : '#64748b' }}>
                Try searching for a subject name, formula, or study concept.
              </p>
            </div>
          )}

          <ul role="listbox" aria-label="Search results">
            {results.map((res, i) => {
              const active = i === activeIndex;
              const isMessage = res.snippetSource === 'message';
              return (
                <li key={res.chat.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => select(res)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                    style={{
                      background: active
                        ? dark
                          ? 'rgba(138,162,255,0.12)'
                          : 'rgba(31,81,255,0.08)'
                        : 'transparent',
                    }}
                  >
                    <div
                      className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        color: dark ? '#8aa2ff' : '#1f51ff',
                      }}
                    >
                      {isMessage ? <MessageSquare size={16} /> : <FileText size={16} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-semibold truncate"
                          style={{ color: dark ? '#ffffff' : '#000000' }}
                        >
                          {res.chat.title || 'Untitled chat'}
                        </span>
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            color: dark ? '#8aa2ff' : '#1f51ff',
                            background: dark ? 'rgba(138,162,255,0.14)' : 'rgba(31,81,255,0.10)',
                          }}
                        >
                          {res.chat.subject}
                        </span>
                        <span
                          className="shrink-0 ml-auto text-[10px] font-medium"
                          style={{ color: dark ? '#71717a' : '#a1a1aa' }}
                        >
                          {formatChatTime(res.chat.timestamp)}
                        </span>
                      </div>
                      <p
                        className="mt-0.5 text-xs leading-relaxed line-clamp-1"
                        style={{ color: dark ? '#a1a1aa' : '#52525b' }}
                      >
                        <Highlighted text={res.snippet} query={query} />
                      </p>
                    </div>

                    {active && (
                      <CornerDownLeft
                        size={14}
                        className="shrink-0 opacity-50"
                        style={dark ? { color: '#a1a1aa' } : { color: '#71717a' }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div
            className="flex items-center gap-4 px-4 py-2 border-t"
            style={{
              borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              color: dark ? '#71717a' : '#a1a1aa',
            }}
          >
            <span className="flex items-center gap-1 text-[10px]">
              <kbd
                className="rounded px-1 text-[10px] font-medium"
                style={{
                  border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                }}
              >
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <kbd
                className="rounded px-1 text-[10px] font-medium"
                style={{
                  border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                }}
              >
                ↵
              </kbd>
              open
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Guard for SSR — portals need the client document.
  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
