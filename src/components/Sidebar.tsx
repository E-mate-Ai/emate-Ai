'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isGuestModeEnabled, clearGuestModeEnabled } from '@/lib/guest-mode';
import { applyTheme } from '@/lib/theme';
import {
  getSubjects,
  addSubject,
  deleteSubject,
  renameSubject,
  getNotebook,
  Subject,
} from '@/lib/notebook';
import {
  getChatHistory,
  getChatTranscript,
  deleteChatSession,
  clearChatHistory,
  formatChatTime,
  type ChatHistoryItem,
  type ChatMessage,
} from '@/lib/chatHistory';
import dynamic from 'next/dynamic';

const ChatSearchModal = dynamic(() => import('./ChatSearchModal'), { ssr: false });
import {
  Search,
  Image,
  PenSquare,
  Settings,
  BookOpen,
  Clock,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Trash2,
  PlusCircle,
  Plus,
  X,
  Sparkles,
  FlaskConical,
  Code2,
  Calculator,
  Globe,
  Atom,
  Brain,
  BarChart3,
  Target,
  Trophy,
  Lightbulb,
  PenLine,
  Edit2,
  Check,
  MoreHorizontal,
  ArrowLeft,
  Folder,
  BookMarked,
  User,
  Sun,
  Moon,
  Hammer,
} from 'lucide-react';
import { toast } from 'sonner';

// Data now fetched dynamically from localStorage

interface SidebarProps {
  onToggle?: () => void;
  width?: number;
  onOpenSettings?: () => void;
  onOpenNotebook?: (subjectName: string) => void;
}

export default function Sidebar({
  onToggle,
  width = 248,
  onOpenSettings,
  onOpenNotebook,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [profileName, setProfileName] = useState('Guest');
  const [profileSubtitle, setProfileSubtitle] = useState('Guest mode');
  const [avatarLabel, setAvatarLabel] = useState('G');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectIcon, setNewSubjectIcon] = useState('book');
  const [newSubjectType, setNewSubjectType] = useState('');
  const [portalMounted, setPortalMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  // Global Cmd/Ctrl+K shortcut to open chat search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const SUBJECT_TYPES = [
    { label: 'Science', icon: FlaskConical },
    { label: 'Technology', icon: Code2 },
    { label: 'Mathematics', icon: Calculator },
    { label: 'Language', icon: Globe },
    { label: 'Physics', icon: Atom },
    { label: 'General', icon: Sparkles },
  ];

  const ICON_PICKS = [
    { id: 'book', label: 'Books & Notes', icon: BookOpen },
    { id: 'science', label: 'Science & Lab', icon: FlaskConical },
    { id: 'tech', label: 'Technology & Code', icon: Code2 },
    { id: 'math', label: 'Mathematics', icon: Calculator },
    { id: 'language', label: 'Language & Global', icon: Globe },
    { id: 'physics', label: 'Physics & Atoms', icon: Atom },
    { id: 'brain', label: 'Cognition & Brainstorm', icon: Brain },
    { id: 'chart', label: 'Analytics & Charts', icon: BarChart3 },
    { id: 'target', label: 'Goals & Targets', icon: Target },
    { id: 'trophy', label: 'Achievements', icon: Trophy },
    { id: 'idea', label: 'Ideas & Concepts', icon: Lightbulb },
    { id: 'pencil', label: 'Writing & Drafts', icon: PenLine },
  ];

  useEffect(() => {
    setSubjects(getSubjects());
    const handleSubjectsChanged = () => {
      setSubjects(getSubjects());
    };
    window.addEventListener('nk-subjects-changed', handleSubjectsChanged);
    return () => window.removeEventListener('nk-subjects-changed', handleSubjectsChanged);
  }, []);

  // Allow any component to open the Create Notebook modal via a custom event.
  useEffect(() => {
    const handleOpenCreate = () => handleCreateNotebook();
    window.addEventListener('nk-create-notebook', handleOpenCreate);
    return () => window.removeEventListener('nk-create-notebook', handleOpenCreate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Real-time chat history sync ────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  useEffect(() => {
    setChatHistory(getChatHistory());
    const handleHistoryChange = () => setChatHistory(getChatHistory());
    window.addEventListener('nk-chat-history-change', handleHistoryChange);
    // Also sync when another tab writes to localStorage
    window.addEventListener('storage', handleHistoryChange);
    return () => {
      window.removeEventListener('nk-chat-history-change', handleHistoryChange);
      window.removeEventListener('storage', handleHistoryChange);
    };
  }, []);

  const handleCreateNotebook = () => {
    setNewSubjectName('');
    setNewSubjectIcon('book');
    setNewSubjectType('');
    setShowCreateModal(true);
  };

  const handleConfirmCreate = () => {
    const name = newSubjectName.trim();
    if (!name) return;
    addSubject(name);
    handleSelectNotebook(name);
    setShowCreateModal(false);
  };

  // ── Manage Notebooks Modal ────────────────────────────────────────────────
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteSubject = (id: string) => {
    const updated = deleteSubject(id);
    setConfirmDeleteId(null);
    // If active subject was deleted, switch to first remaining
    const deletedSubject = subjects.find((s) => s.id === id);
    if (deletedSubject && selectedSubject === deletedSubject.name) {
      const remaining = updated;
      if (remaining.length > 0) {
        handleSelectNotebook(remaining[0].name);
      }
    }
  };

  const handleStartRename = (subj: Subject) => {
    setEditingSubjectId(subj.id);
    setEditingSubjectName(subj.name);
  };

  const handleConfirmRename = (id: string) => {
    const trimmed = editingSubjectName.trim();
    if (!trimmed) return;
    renameSubject(id, trimmed);
    setEditingSubjectId(null);
  };

  useEffect(() => {
    const updateTheme = () => {
      const saved = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
      const t = saved || 'light';
      setTheme(t);
      applyTheme(t);
    };
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;

    const syncProfileState = async () => {
      setProfileLoading(true);
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // User is authenticated — ensure guest mode is cleared so they get full access!
          clearGuestModeEnabled();

          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'User';
          const displayName = String(fullName).trim() || 'User';
          const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

          setIsGuest(false);
          setProfileName(displayName);
          setProfileSubtitle(user.email || 'Signed in');
          setAvatarLabel(displayName.charAt(0).toUpperCase());
          setAvatarUrl(avatar);
          setProfileLoading(false);
          return;
        }
      } catch (_) {}

      const guestEnabled = isGuestModeEnabled();
      setIsGuest(guestEnabled);
      setAvatarUrl('');

      if (guestEnabled) {
        setProfileName('Guest');
        setProfileSubtitle('Guest mode');
        setAvatarLabel('G');
      } else {
        setProfileName('Sign in');
        setProfileSubtitle('Access your account');
        setAvatarLabel('S');
      }
      setProfileLoading(false);
    };

    syncProfileState();

    import('@/lib/supabase/client')
      .then(({ createClient }) => {
        const supabase = createClient();
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
          syncProfileState();
        });
        authSubscription = subscription;
      })
      .catch(() => {});

    window.addEventListener('storage', syncProfileState);
    window.addEventListener('nk-guest-mode-change', syncProfileState);

    return () => {
      authSubscription?.unsubscribe();
      window.removeEventListener('storage', syncProfileState);
      window.removeEventListener('nk-guest-mode-change', syncProfileState);
    };
  }, []);

  const handleSignOut = async () => {
    clearGuestModeEnabled();
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (_) {}
    router.push('/sign-up-login-screen');
  };

  const handleSelectNotebook = (subjName: string) => {
    const subj = subjects.find((s) => s.name === subjName);
    const firstUnit = subj?.units?.[0]?.name ?? '';
    setSelectedSubject(subjName);
    if (firstUnit) setSelectedUnit(firstUnit);
    localStorage.setItem('nk-subject', subjName);
    if (firstUnit) localStorage.setItem('nk-unit', firstUnit);
    window.dispatchEvent(new Event('nk-context-change'));
    if (onOpenNotebook) {
      onOpenNotebook(subjName);
    }
  };

  const [isGeneralWorkspaceActive, setIsGeneralWorkspaceActive] = useState(false);
  useEffect(() => {
    const handleSyncGeneralChat = () => {
      const active = localStorage.getItem('nk-general-chat-active') === 'true';
      setIsGeneralWorkspaceActive(active);
    };
    handleSyncGeneralChat();
    window.addEventListener('nk-general-chat-change', handleSyncGeneralChat);
    return () => {
      window.removeEventListener('nk-general-chat-change', handleSyncGeneralChat);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside
        className="relative flex flex-col shrink-0 transition-colors duration-300"
        style={{
          width: `${width}px`,
          background: theme === 'dark' ? '#080809' : '#f9f9fb',
          borderRight:
            theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
        />
        <div className="px-3 pt-3 pb-2 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {/* Logo + collapse button */}
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              title="Return to Home Landing Page"
            >
              <div
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl"
                style={{
                  border: '1px solid rgba(0,0,0,0.06)',
                  background: '#f8f9fa',
                }}
              >
                <img
                  src="/asset/images/e.svg"
                  alt="e-Mate"
                  className="h-full w-full object-contain"
                />
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: theme === 'dark' ? '#d4d4d8' : '#3f3f46' }}
              >
                e-Mate AI
              </span>
            </Link>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-2xl border transition"
              style={{
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: theme === 'dark' ? '#a1a1aa' : '#71717a',
              }}
              onClick={onToggle}
              title="Close sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            <a
              href="/ai-topper-chat"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background: isGeneralWorkspaceActive
                  ? theme === 'dark'
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)'
                  : theme === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                color: isGeneralWorkspaceActive
                  ? theme === 'dark'
                    ? '#ffffff'
                    : '#000000'
                  : theme === 'dark'
                    ? '#f4f4f5'
                    : '#09090b',
                border: isGeneralWorkspaceActive
                  ? theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.18)'
                    : '1px solid rgba(0,0,0,0.12)'
                  : '1px solid transparent',
              }}
            >
              <PenSquare size={14} />
              <span>{isGeneralWorkspaceActive ? 'General Workspace' : 'New chat'}</span>
            </a>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: theme === 'dark' ? '#71717a' : '#52525b' }}
            >
              <Search size={14} />
              <span>Search</span>
              <span
                className="ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  color: theme === 'dark' ? '#8aa2ff' : '#1f51ff',
                  background: theme === 'dark' ? 'rgba(138,162,255,0.12)' : 'rgba(31,81,255,0.08)',
                }}
              >
                ⌘K
              </span>
            </button>

            <button
              type="button"
              className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{ color: theme === 'dark' ? '#71717a' : '#71717a' }}
            >
              <BookOpen size={14} />
              <span>Library</span>
            </button>

            <button
              type="button"
              onClick={() =>
                toast.info('Builder X is coming soon!', {
                  description: 'We are building an advanced AI agent workspace. Stay tuned!',
                })
              }
              className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: theme === 'dark' ? '#71717a' : '#52525b' }}
            >
              <div className="flex items-center gap-2.5">
                <Hammer size={14} />
                <span>Builder X</span>
              </div>
              <span
                className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full"
                style={{
                  background: theme === 'dark' ? 'rgba(138,162,255,0.12)' : 'rgba(31,81,255,0.08)',
                  color: theme === 'dark' ? '#8aa2ff' : '#1f51ff',
                  border: `1px solid ${theme === 'dark' ? 'rgba(138,162,255,0.2)' : 'rgba(31,81,255,0.15)'}`,
                }}
              >
                Soon
              </span>
            </button>
          </nav>

          {/* Notebooks & Recent Sections container with space-y-4 visual separation */}
          <div className="mt-6 space-y-4">
            {/* Notebooks Section */}
            <div>
              <div className="flex items-center justify-between mb-2 px-3">
                <p className="text-[10px] tracking-wider font-bold text-gray-400 uppercase">
                  NOTEBOOKS
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCreateNotebook}
                    title="Create notebook"
                    aria-label="Create notebook"
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManageModal(true)}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md transition hover:opacity-80"
                    style={{
                      color: theme === 'dark' ? '#71717a' : '#71717a',
                      background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    }}
                  >
                    Manage
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {subjects.length === 0 ? (
                  <div className="px-3 py-3.5 text-center rounded-xl border border-dashed border-border bg-card/40 flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-0.5">
                      <BookOpen size={13} strokeWidth={1.75} />
                    </div>
                    <p className="text-[11px] font-medium text-text-primary">
                      No notebooks yet
                    </p>
                    <p className="text-[10px] text-text-muted leading-tight">
                      Add a subject to organize your notes & quizzes
                    </p>
                  </div>
                ) : (
                  subjects.map((subject) => {
                    const isActive = selectedSubject === subject.name;
                    return (
                      <div
                        key={subject.id}
                        className={`group flex items-center transition-all ${
                          isActive
                            ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium rounded-lg px-2.5 py-1.5'
                            : 'rounded-lg px-3 py-2 text-gray-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectNotebook(subject.name)}
                          className="flex-1 text-left text-xs font-semibold truncate flex items-center gap-2"
                        >
                          <Folder size={11} className="shrink-0 opacity-70" />
                          {subject.name}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                          <button
                            onClick={() => {
                              handleStartRename(subject);
                              setShowManageModal(true);
                            }}
                            className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition"
                            title="Rename"
                          >
                            <Edit2 size={10} style={{ color: '#a1a1aa' }} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(subject.id)}
                            className="p-1 rounded-md hover:bg-red-500/10 transition"
                            title="Delete"
                          >
                            <Trash2 size={10} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent chats Section */}
            <div>
              <div className="flex items-center justify-between mb-2 px-3">
                <p className="text-[10px] tracking-wider font-bold text-gray-400 uppercase">
                  RECENT
                </p>
                {chatHistory.length > 0 && (
                  <button
                    onClick={() => clearChatHistory()}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg transition hover:opacity-80"
                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {chatHistory.length === 0 ? (
                <div className="text-center py-5 px-3 flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-lg bg-card-hover text-text-muted flex items-center justify-center mb-0.5">
                    <Clock size={13} strokeWidth={1.75} />
                  </div>
                  <p className="text-xs font-medium text-text-secondary">
                    No recent chats
                  </p>
                  <p className="text-[10px] text-text-muted">
                    Your study conversations and quizzes will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.slice(0, 15).map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        const messages = getChatTranscript(chat.id);
                        router.push(`/ai-topper-chat?chatId=${chat.id}`);
                        window.dispatchEvent(
                          new CustomEvent('nk-chat-load', {
                            detail: {
                              id: chat.id,
                              title: chat.title,
                              subject: chat.subject,
                              unit: chat.unit,
                              mode: chat.mode,
                              messages,
                            },
                          })
                        );
                      }}
                      className="group relative w-full cursor-pointer rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                      style={{ background: 'transparent' }}
                    >
                      <div className="flex items-center justify-between gap-2 pr-4">
                        <span className="text-xs font-medium line-clamp-1 text-gray-600 dark:text-zinc-400">
                          {chat.title}
                        </span>
                        <span className="text-[9px] shrink-0 text-gray-400 dark:text-zinc-650">
                          {formatChatTime(chat.timestamp)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChatSession(chat.id);
                        }}
                        className="absolute right-2 top-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition"
                        title="Remove"
                      >
                        <Trash2 size={10} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pinned settings + profile at bottom */}
        <div
          className="mt-auto border-t p-3 space-y-2 shrink-0"
          style={{
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          }}
        >
          <button
            onClick={() => onOpenSettings?.()}
            className="flex items-center gap-3 w-full rounded-2xl px-2.5 py-2 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: theme === 'dark' ? '#d4d4d8' : '#3f3f46' }}
            title="Settings"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          {/* Profile card */}
          {profileLoading ? (
            <div className="flex items-center gap-3 px-2.5 py-2.5 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-zinc-300 dark:bg-zinc-700 rounded w-24" />
                <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
              </div>
            </div>
          ) : !isGuest && profileSubtitle.includes('@') ? (
            <div
              className="flex items-center justify-between rounded-2xl px-2.5 py-2 transition group"
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                border:
                  theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar: image or letter fallback */}
                <div
                  className="relative w-9 h-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center font-semibold text-sm border border-zinc-300 dark:border-zinc-600"
                  style={{
                    background: theme === 'dark' ? '#52525b' : '#d4d4d8',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profileName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  {avatarUrl ? null : <span className="relative z-10">{avatarLabel}</span>}
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <span
                    className="truncate text-xs font-semibold"
                    style={{ color: theme === 'dark' ? '#ffffff' : '#09090b' }}
                  >
                    {profileName}
                  </span>
                  <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {profileSubtitle}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition shrink-0 ml-1"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div>
              <div
                className="flex items-center justify-between rounded-2xl px-2.5 py-2 transition group"
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border:
                    theme === 'dark'
                      ? '1px solid rgba(255,255,255,0.06)'
                      : '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="relative w-9 h-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center font-semibold text-sm border"
                    style={{
                      background: theme === 'dark' ? '#1c3a3a' : '#ccfbf1',
                      borderColor: theme === 'dark' ? 'rgba(94,234,212,0.3)' : 'rgba(20,184,166,0.3)',
                      color: theme === 'dark' ? '#5eead4' : '#0d9488',
                    }}
                  >
                    G
                  </div>
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span
                      className="truncate text-xs font-semibold"
                      style={{ color: theme === 'dark' ? '#ffffff' : '#09090b' }}
                    >
                      Guest
                    </span>
                    <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      Guest mode
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new Event('nk-open-signup-popup'))}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-90"
                  style={{
                    background: theme === 'dark' ? 'rgba(138,162,255,0.15)' : 'rgba(31,81,255,0.1)',
                    color: theme === 'dark' ? '#8aa2ff' : '#1f51ff',
                  }}
                  title="Sign in to your account"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* All modals rendered via portal to escape sidebar overflow/transform */}
      {portalMounted &&
        createPortal(
          <>
            {/* Create Notebook Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center w-screen h-screen bg-black/60 backdrop-blur-md p-4 sm:p-6">
                <div className="relative w-full max-w-4xl h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  {/* Top Header Bar */}
                  <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        Create New Notebook
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Set up a personalized study workspace with custom icons and categories.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable Form Content */}
                  <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Icon & Subject Name Form Controls */}
                    <div className="flex flex-col gap-6">
                      {/* Subject Name Input */}
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block text-zinc-550 dark:text-zinc-400">
                          Subject Name
                        </label>
                        <input
                          autoFocus
                          type="text"
                          placeholder="e.g. Discrete Mathematics, Machine Learning…"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmCreate();
                          }}
                          className="w-full h-11 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-400 transition-all"
                          style={{
                            background:
                              theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            borderColor:
                              theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            color: theme === 'dark' ? '#ffffff' : '#111111',
                          }}
                        />
                      </div>

                      {/* Icon Picker Grid */}
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block text-zinc-500 dark:text-zinc-400">
                          Pick an Icon
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {ICON_PICKS.map((item) => {
                            const IconComponent = item.icon;
                            const isSelected = newSubjectIcon === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setNewSubjectIcon(item.id)}
                                title={item.label}
                                aria-label={item.label}
                                className={`h-11 rounded-xl flex items-center justify-center transition-all duration-150 border cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600/30 dark:ring-blue-500/30'
                                    : 'bg-zinc-100/80 dark:bg-zinc-800/50 border-zinc-200/80 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200'
                                }`}
                              >
                                <IconComponent size={18} strokeWidth={2} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Category Selection & Preview Card */}
                    <div className="flex flex-col gap-6">
                      {/* Subject Category Selectors */}
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block text-zinc-500 dark:text-zinc-400">
                          Subject Category
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {SUBJECT_TYPES.map((type) => {
                            const CategoryIcon = type.icon;
                            const isSelected = newSubjectType === type.label;
                            return (
                              <button
                                key={type.label}
                                type="button"
                                onClick={() => setNewSubjectType(type.label)}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold ring-1 ring-blue-600/30 dark:ring-blue-500/30'
                                    : 'bg-zinc-100/80 dark:bg-zinc-800/50 border-zinc-200/80 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                                }`}
                              >
                                <CategoryIcon
                                  size={15}
                                  strokeWidth={2}
                                  className={
                                    isSelected
                                      ? 'text-blue-600 dark:text-blue-400 shrink-0'
                                      : 'text-zinc-500 dark:text-zinc-400 shrink-0'
                                  }
                                />
                                <span>{type.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Preview card */}
                      {newSubjectName.trim() && (
                        <div
                          className="rounded-2xl p-4 border mt-auto"
                          style={{
                            background:
                              theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            borderColor:
                              theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {(() => {
                              const PreviewIcon =
                                ICON_PICKS.find((p) => p.id === newSubjectIcon)?.icon || BookOpen;
                              return (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 border border-blue-600/30 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shrink-0">
                                  <PreviewIcon size={20} strokeWidth={2} />
                                </div>
                              );
                            })()}
                            <div>
                              <p
                                className="font-bold text-sm"
                                style={{ color: theme === 'dark' ? '#ffffff' : '#111111' }}
                              >
                                {newSubjectName}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {newSubjectType || 'General'} Notebook · AI-personalised
                              </p>
                            </div>
                            <div className="ml-auto">
                              <span
                                className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                                style={{
                                  background:
                                    theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                  color: theme === 'dark' ? '#ffffff' : '#000000',
                                }}
                              >
                                New
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-650 dark:text-zinc-400 hover:bg-zinc-200/60 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmCreate}
                      disabled={!newSubjectName.trim()}
                      className="px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: theme === 'dark' ? '#ffffff' : '#000000',
                        color: theme === 'dark' ? '#000000' : '#ffffff',
                      }}
                    >
                      Save & Launch Notebook
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Manage Notebooks Modal ──────────────────────────────────────── */}
            {showManageModal && (
              <div
                className="fixed inset-0 z-[999] flex items-center justify-center w-screen h-screen px-4"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowManageModal(false);
                    setEditingSubjectId(null);
                  }
                }}
              >
                <div
                  className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                  style={{
                    background: theme === 'dark' ? '#111111' : '#ffffff',
                    border:
                      theme === 'dark'
                        ? '1px solid rgba(255,255,255,0.1)'
                        : '1px solid rgba(0,0,0,0.08)',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {/* Header */}
                  <div
                    className="px-6 pt-6 pb-5 flex items-start justify-between"
                    style={{
                      background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      borderBottom:
                        theme === 'dark'
                          ? '1px solid rgba(255,255,255,0.07)'
                          : '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen
                          size={16}
                          style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                        />
                        <span
                          className="text-xs font-semibold uppercase tracking-widest"
                          style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                        >
                          My Notebooks
                        </span>
                      </div>
                      <h2
                        className="text-xl font-bold"
                        style={{ color: theme === 'dark' ? '#ffffff' : '#111111' }}
                      >
                        Manage Notebooks
                      </h2>
                      <p className="text-sm mt-0.5" style={{ color: '#a1a1aa' }}>
                        Rename or delete your study notebooks.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowManageModal(false);
                        setEditingSubjectId(null);
                      }}
                      className="p-1.5 rounded-xl transition hover:opacity-70 ml-4 shrink-0"
                      style={{ color: '#a1a1aa' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Notebook list */}
                  <div className="px-5 py-4 space-y-2 max-h-[420px] overflow-y-auto">
                    {subjects.length === 0 && (
                      <div className="text-center py-8 px-4 flex flex-col items-center justify-center">
                        <div className="w-11 h-11 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center mb-2.5 shadow-glow-subtle">
                          <BookOpen size={20} strokeWidth={1.75} />
                        </div>
                        <h4 className="text-sm font-semibold font-display text-text-primary">
                          No notebooks created yet
                        </h4>
                        <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
                          Create your first subject notebook to store lecture notes, flashcards, and quiz results.
                        </p>
                      </div>
                    )}

                    {subjects.map((subj) => (
                      <div
                        key={subj.id}
                        className="rounded-2xl border px-4 py-3 flex items-center gap-3 transition group"
                        style={{
                          borderColor:
                            theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                          background:
                            selectedSubject === subj.name
                              ? theme === 'dark'
                                ? 'rgba(16,163,127,0.08)'
                                : 'rgba(16,163,127,0.04)'
                              : theme === 'dark'
                                ? 'rgba(255,255,255,0.03)'
                                : 'rgba(0,0,0,0.02)',
                        }}
                      >
                        {/* Subject Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            background:
                              theme === 'dark'
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(0,0,0,0.04)',
                            borderColor:
                              theme === 'dark'
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.08)',
                            color: theme === 'dark' ? '#d4d4d8' : '#52525b',
                          }}
                        >
                          <BookOpen size={18} strokeWidth={2} />
                        </div>

                        {/* Name / Edit input */}
                        <div className="flex-1 min-w-0">
                          {editingSubjectId === subj.id ? (
                            <input
                              autoFocus
                              className="w-full text-sm font-semibold rounded-lg px-2 py-1 focus:outline-none"
                              style={{
                                background:
                                  theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                color: theme === 'dark' ? '#ffffff' : '#111111',
                                border: '1px solid #10a37f',
                              }}
                              value={editingSubjectName}
                              onChange={(e) => setEditingSubjectName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmRename(subj.id);
                                if (e.key === 'Escape') setEditingSubjectId(null);
                              }}
                            />
                          ) : (
                            <div
                              onClick={() => {
                                setShowManageModal(false);
                                handleSelectNotebook(subj.name);
                              }}
                              className="cursor-pointer"
                            >
                              <p
                                className="text-sm font-semibold truncate"
                                style={{ color: theme === 'dark' ? '#ffffff' : '#111111' }}
                              >
                                {subj.name}
                              </p>
                              <p className="text-xs" style={{ color: '#a1a1aa' }}>
                                {getNotebook(subj.name).entries.length} saved notes
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Active badge */}
                        {selectedSubject === subj.name && editingSubjectId !== subj.id && (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0"
                            style={{
                              background:
                                theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                              color: theme === 'dark' ? '#ffffff' : '#000000',
                            }}
                          >
                            Active
                          </span>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {editingSubjectId === subj.id ? (
                            <>
                              <button
                                onClick={() => handleConfirmRename(subj.id)}
                                className="p-1.5 rounded-full transition"
                                style={{
                                  background:
                                    theme === 'dark'
                                      ? 'rgba(255,255,255,0.12)'
                                      : 'rgba(0,0,0,0.06)',
                                  color: theme === 'dark' ? '#ffffff' : '#000000',
                                }}
                                title="Save rename"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={() => setEditingSubjectId(null)}
                                className="p-1.5 rounded-lg transition hover:opacity-70"
                                style={{ color: '#a1a1aa' }}
                                title="Cancel"
                              >
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartRename(subj)}
                                className="p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100"
                                style={{ color: '#a1a1aa' }}
                                title="Rename notebook"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(subj.id)}
                                className="p-1.5 rounded-lg transition hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                                style={{ color: '#ef4444' }}
                                title="Delete notebook"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{
                      borderTop:
                        theme === 'dark'
                          ? '1px solid rgba(255,255,255,0.07)'
                          : '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowManageModal(false);
                        handleCreateNotebook();
                      }}
                      className="flex items-center gap-2 text-sm font-semibold transition hover:opacity-80"
                      style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                    >
                      <PlusCircle size={15} />
                      New Notebook
                    </button>
                    <button
                      onClick={() => {
                        setShowManageModal(false);
                        setEditingSubjectId(null);
                      }}
                      className="px-5 h-9 rounded-full border text-sm font-semibold transition hover:opacity-80"
                      style={{
                        borderColor:
                          theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                        color: theme === 'dark' ? '#d4d4d8' : '#3f3f46',
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete confirmation */}
            {confirmDeleteId && (
              <div
                className="fixed inset-0 z-[999] flex items-center justify-center w-screen h-screen px-4"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
              >
                <div
                  className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
                  style={{
                    background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                    border:
                      theme === 'dark'
                        ? '1px solid rgba(255,255,255,0.1)'
                        : '1px solid rgba(0,0,0,0.1)',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {' '}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-10 w-10 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.12)' }}
                    >
                      <Trash2 size={18} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                      <p
                        className="font-bold text-sm"
                        style={{ color: theme === 'dark' ? '#ffffff' : '#111111' }}
                      >
                        Delete Notebook?
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>
                        {subjects.find((s) => s.id === confirmDeleteId)?.name}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm mb-5" style={{ color: '#a1a1aa' }}>
                    All saved notes and personalization data for this notebook will be permanently
                    removed. This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 h-10 rounded-xl border text-sm font-semibold transition hover:opacity-80"
                      style={{
                        borderColor:
                          theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                        color: theme === 'dark' ? '#d4d4d8' : '#3f3f46',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(confirmDeleteId)}
                      className="flex-1 h-10 rounded-xl text-sm font-bold transition"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}

      {/* In-chat search command palette (Cmd/Ctrl+K or Search button) */}
      <ChatSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(chat, messages) => {
          // Resume the selected session in /ai-topper-chat (if mounted).
          setSearchOpen(false);
          window.dispatchEvent(
            new CustomEvent('nk-chat-load', {
              detail: {
                id: chat.id,
                title: chat.title,
                subject: chat.subject,
                unit: chat.unit,
                mode: chat.mode,
                messages,
              },
            })
          );
        }}
      />
    </>
  );
}
