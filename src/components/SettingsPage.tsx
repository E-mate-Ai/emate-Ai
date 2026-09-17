'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ArrowLeft,
  Sun,
  Moon,
  Compass,
  BookOpen,
  User,
  Trash2,
  LogOut,
  Check,
  Mail,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { applyTheme } from '@/lib/theme';
import {
  getNotebook,
  clearNotebook,
  deleteNotebookEntry,
  appendToNotebook,
  getSubjects,
  Subject,
  NotebookEntry,
} from '@/lib/notebook';
import { isGuestModeEnabled, clearGuestModeEnabled } from '@/lib/guest-mode';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type SettingsTab = 'general' | 'context' | 'notebook' | 'account';

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [appearance, setAppearance] = useState<'Light' | 'Dark'>('Light');
  const [language, setLanguage] = useState('Auto-detect');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [subjects, setSubjects] = useState<Subject[]>(() => getSubjects());
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [notebookNotes, setNotebookNotes] = useState<NotebookEntry[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [profileName, setProfileName] = useState('Guest');
  const [profileSubtitle, setProfileSubtitle] = useState('Guest mode');
  const [avatarLabel, setAvatarLabel] = useState('G');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
    const t = saved || 'light';
    setTheme(t);
    setAppearance(t === 'light' ? 'Light' : 'Dark');
    setSelectedSubject(localStorage.getItem('nk-subject') || '');
    setSelectedUnit(localStorage.getItem('nk-unit') || '');
    const updateTheme = () => {
      const t2 = (localStorage.getItem('nk-theme') as 'light' | 'dark') || 'light';
      setTheme(t2);
      setAppearance(t2 === 'light' ? 'Light' : 'Dark');
    };
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  useEffect(() => {
    const handleSubjectsChanged = () => setSubjects(getSubjects());
    window.addEventListener('nk-subjects-changed', handleSubjectsChanged);
    return () => window.removeEventListener('nk-subjects-changed', handleSubjectsChanged);
  }, []);

  useEffect(() => {
    if (activeTab === 'notebook' && selectedSubject) {
      setNotebookNotes(getNotebook(selectedSubject).entries);
    }
  }, [activeTab, selectedSubject]);

  useEffect(() => {
    const sync = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
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
      const guest = isGuestModeEnabled();
      setIsGuest(guest);
      setProfileName(guest ? 'Guest' : 'Sign in');
      setProfileSubtitle(guest ? 'Guest mode' : 'Access your account');
      setAvatarLabel(guest ? 'G' : 'S');
      setProfileLoading(false);
    };
    sync();
  }, []);

  const handleSignOut = async () => {
    clearGuestModeEnabled();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/sign-up-login-screen');
  };

  const bdr = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const surface = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const textPrimary = theme === 'dark' ? '#f4f4f5' : '#09090b';
  const textMuted = theme === 'dark' ? '#71717a' : '#71717a';
  const bg = theme === 'dark' ? '#000000' : '#ffffff';

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'context', label: 'Study Context', icon: Compass },
    { id: 'notebook', label: 'My Notebook', icon: BookOpen },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div
      className="flex-1 h-full w-full flex flex-col overflow-hidden"
      style={{ background: bg, color: textPrimary, fontFamily: "'Inter', sans-serif" }}
    >
      {/* Back bar */}
      <div
        className="flex items-center gap-3 px-8 py-4 shrink-0 border-b"
        style={{ borderColor: bdr, background: bg }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium transition hover:opacity-70 active:scale-95"
          style={{ color: textPrimary }}
        >
          <ArrowLeft size={16} />
          <span>Back to Chat</span>
        </button>
        <span style={{ color: textMuted }}>·</span>
        <span className="text-sm font-semibold" style={{ color: textPrimary }}>
          Settings
        </span>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left tab nav */}
        <nav
          className="w-52 shrink-0 flex flex-col p-4 gap-1 border-r overflow-y-auto"
          style={{ borderColor: bdr, background: surface }}
        >
          <p
            className="text-[9px] font-mono uppercase tracking-widest px-3 pt-2 pb-3"
            style={{ color: textMuted }}
          >
            Settings
          </p>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
              style={{
                background:
                  activeTab === id
                    ? theme === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)'
                    : 'transparent',
                color: activeTab === id ? textPrimary : textMuted,
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>
                  General
                </h2>
                <p className="text-sm" style={{ color: textMuted }}>
                  Preferences that apply across e-Mate.
                </p>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{ border: `1px solid ${bdr}`, background: surface }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                    Appearance
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                    Interface colour scheme
                  </p>
                </div>
                <div
                  className="flex items-center p-0.5 rounded-xl gap-0.5"
                  style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: `1px solid ${bdr}`,
                  }}
                >
                  {(['Light', 'Dark'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setAppearance(opt);
                        const nt = opt === 'Light' ? 'light' : 'dark';
                        localStorage.setItem('nk-theme', nt);
                        applyTheme(nt);
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background:
                          appearance === opt
                            ? theme === 'dark'
                              ? '#27272a'
                              : '#ffffff'
                            : 'transparent',
                        color: appearance === opt ? textPrimary : textMuted,
                        boxShadow: appearance === opt ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                      }}
                    >
                      {opt === 'Light' ? <Sun size={12} /> : <Moon size={12} />}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className="p-4 rounded-2xl"
                style={{ border: `1px solid ${bdr}`, background: surface }}
              >
                <p className="text-sm font-semibold mb-0.5" style={{ color: textPrimary }}>
                  Language
                </p>
                <p className="text-xs mb-3" style={{ color: textMuted }}>
                  AI response language
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Auto-detect', 'English', 'Hindi', 'Spanish', 'French', 'German'].map(
                    (lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background:
                            language === lang
                              ? theme === 'dark'
                                ? '#27272a'
                                : '#09090b'
                              : theme === 'dark'
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(0,0,0,0.04)',
                          color:
                            language === lang
                              ? theme === 'dark'
                                ? '#f4f4f5'
                                : '#ffffff'
                              : textMuted,
                          border:
                            language === lang
                              ? theme === 'dark'
                                ? '1px solid rgba(255,255,255,0.12)'
                                : '1px solid rgba(0,0,0,0.15)'
                              : `1px solid ${bdr}`,
                        }}
                      >
                        {lang}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{ border: `1px solid ${bdr}`, background: surface }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                    Interactive Guide
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                    Learn e-Mate&apos;s advanced features
                  </p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new Event('nk-launch-guide'))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition hover:opacity-85"
                  style={{
                    background: theme === 'dark' ? '#ffffff' : '#09090b',
                    color: theme === 'dark' ? '#000000' : '#ffffff',
                  }}
                >
                  Launch Guide
                </button>
              </div>
            </div>
          )}

          {/* Study Context */}
          {activeTab === 'context' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>
                  Study Context
                </h2>
                <p className="text-sm" style={{ color: textMuted }}>
                  Set the subject and unit e-Mate answers from.
                </p>
              </div>
              <div
                className="p-4 rounded-2xl"
                style={{ border: `1px solid ${bdr}`, background: surface }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: textMuted }}
                >
                  Syllabus Subject
                </p>
                <div className="flex flex-col gap-1">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        const fu = s.units[0]?.name ?? '';
                        setSelectedSubject(s.name);
                        if (fu) setSelectedUnit(fu);
                        localStorage.setItem('nk-subject', s.name);
                        if (fu) localStorage.setItem('nk-unit', fu);
                        window.dispatchEvent(new Event('nk-context-change'));
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                      style={{
                        background:
                          selectedSubject === s.name
                            ? theme === 'dark'
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.06)'
                            : 'transparent',
                        color: selectedSubject === s.name ? textPrimary : textMuted,
                        border:
                          selectedSubject === s.name ? `1px solid ${bdr}` : '1px solid transparent',
                      }}
                    >
                      <span>{s.name}</span>
                      {selectedSubject === s.name && (
                        <Check size={14} style={{ color: textPrimary }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className="p-4 rounded-2xl"
                style={{ border: `1px solid ${bdr}`, background: surface }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: textMuted }}
                >
                  Unit / Topic
                </p>
                <div className="flex flex-col gap-1">
                  {(subjects.find((s) => s.name === selectedSubject)?.units ?? []).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedUnit(u.name);
                        localStorage.setItem('nk-unit', u.name);
                        window.dispatchEvent(new Event('nk-context-change'));
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                      style={{
                        background:
                          selectedUnit === u.name
                            ? theme === 'dark'
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.06)'
                            : 'transparent',
                        color: selectedUnit === u.name ? textPrimary : textMuted,
                        border:
                          selectedUnit === u.name ? `1px solid ${bdr}` : '1px solid transparent',
                      }}
                    >
                      <span>{u.name}</span>
                      {selectedUnit === u.name && (
                        <Check size={14} style={{ color: textPrimary }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notebook */}
          {activeTab === 'notebook' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>
                    My Notebook
                  </h2>
                  <p className="text-sm" style={{ color: textMuted }}>
                    Notes auto-saved during chats for{' '}
                    <strong>{selectedSubject || 'your active subject'}</strong>.
                  </p>
                </div>
                {notebookNotes.length > 0 && (
                  <button
                    onClick={() => {
                      clearNotebook(selectedSubject);
                      setNotebookNotes([]);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80 shrink-0"
                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {notebookNotes.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-dashed text-center"
                    style={{ borderColor: bdr }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center mb-2.5 shadow-glow-subtle">
                      <BookOpen size={18} strokeWidth={1.75} />
                    </div>
                    <h4 className="text-sm font-semibold font-display" style={{ color: textPrimary }}>
                      No saved notes yet
                    </h4>
                    <p className="text-xs mt-1 max-w-xs leading-relaxed" style={{ color: textMuted }}>
                      Key concepts, formulas, and definitions are automatically captured to this notebook during your study sessions.
                    </p>
                  </div>
                ) : (
                  notebookNotes.map((note) => (
                    <div
                      key={note.id}
                      className="group flex items-start justify-between gap-3 p-4 rounded-xl border"
                      style={{ background: surface, borderColor: bdr }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed" style={{ color: textPrimary }}>
                          {note.content}
                        </p>
                        <span className="text-xs mt-1 block" style={{ color: textMuted }}>
                          {note.timestamp} · {note.source === 'ai' ? 'Auto-saved' : 'Manual'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          deleteNotebookEntry(selectedSubject, note.id);
                          setNotebookNotes((prev) => prev.filter((n) => n.id !== note.id));
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition hover:bg-red-500/10"
                        title="Delete"
                      >
                        <Trash2 size={13} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div
                className="flex gap-2 p-4 rounded-2xl border"
                style={{ borderColor: bdr, background: surface }}
              >
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add a study note..."
                  className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none transition"
                  style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${bdr}`,
                    color: textPrimary,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newNoteText.trim()) {
                      appendToNotebook(selectedSubject, newNoteText.trim(), 'user');
                      setNotebookNotes(getNotebook(selectedSubject).entries);
                      setNewNoteText('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newNoteText.trim()) {
                      appendToNotebook(selectedSubject, newNoteText.trim(), 'user');
                      setNotebookNotes(getNotebook(selectedSubject).entries);
                      setNewNoteText('');
                    }
                  }}
                  disabled={!newNoteText.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-40"
                  style={{
                    background: theme === 'dark' ? '#27272a' : '#09090b',
                    color: theme === 'dark' ? '#f4f4f5' : '#ffffff',
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Account */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>
                  Account
                </h2>
                <p className="text-sm" style={{ color: textMuted }}>
                  Manage your profile and session.
                </p>
              </div>
              {profileLoading ? (
                <div
                  className="flex items-center gap-4 p-5 rounded-2xl animate-pulse"
                  style={{ border: `1px solid ${bdr}`, background: surface }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl shrink-0"
                    style={{ background: theme === 'dark' ? '#27272a' : '#e4e4e7' }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-3.5 rounded w-28"
                      style={{ background: theme === 'dark' ? '#27272a' : '#e4e4e7' }}
                    />
                    <div
                      className="h-3 rounded w-40"
                      style={{ background: theme === 'dark' ? '#27272a' : '#e4e4e7' }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-4 p-5 rounded-2xl"
                  style={{ border: `1px solid ${bdr}`, background: surface }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold shrink-0 overflow-hidden"
                    style={{
                      background: theme === 'dark' ? '#27272a' : '#f4f4f5',
                      color: textPrimary,
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={profileName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : null}
                    {avatarUrl ? null : avatarLabel}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                      {profileName}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: textMuted }}>
                      {profileSubtitle}
                    </p>
                  </div>
                  <span
                    className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      background: theme === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
                      color: textMuted,
                    }}
                  >
                    {isGuest ? 'Guest' : 'Pro'}
                  </span>
                </div>
              )}
              
              <div
                className="p-5 rounded-2xl space-y-3"
                style={{ border: `1px solid ${bdr}`, background: surface }}
              >
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>
                  Need Help &amp; Support?
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: textMuted }}>
                  Have questions or issues with your e-Mate study workspace? Contact our support team directly.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 text-xs">
                  <a
                    href="mailto:isachinbisht@gmail.com"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-600/20 transition-colors min-h-[44px]"
                  >
                    <Mail size={14} /> isachinbisht@gmail.com
                  </a>
                  <a
                    href="tel:+918860911070"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-500/20 transition-colors min-h-[44px]"
                  >
                    <Phone size={14} /> +91 8860911070
                  </a>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all hover:bg-red-500/8 active:scale-[0.99] min-h-[44px]"
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
              >
                <LogOut size={15} />
                Sign Out of e-Mate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
