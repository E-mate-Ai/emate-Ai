'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  LayoutGrid,
  Wallet,
  ShieldCheck,
  Key,
  MessageSquare,
  Monitor,
  Lock,
  HelpCircle,
  FileText,
  LogOut,
  X,
  Sun,
  Moon,
  ArrowUpRight,
  ChevronRight,
  Check,
  Compass,
  BookOpen,
  Trash2,
  Plus,
  Mail,
  Phone,
  Laptop,
  Smartphone,
  Sparkles,
  Database,
  Globe,
  ExternalLink,
  ShieldAlert,
  CreditCard,
  Zap,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { applyTheme } from '@/lib/theme';
import { fetchOpenRouterKeyInfo, type OpenRouterKeyInfo } from '@/lib/openrouter';
import { fetchUserQuota, type UserQuota } from '@/lib/user-quota';
import {
  getGuestCredits,
  getUserTokens,
  getWalletBalance,
  addWalletBalance,
  getAutoRechargeEnabled,
  setAutoRechargeEnabled,
} from '@/lib/credits';
import { clearChatHistory } from '@/lib/chatHistory';
import {
  getNotebook,
  clearNotebook,
  deleteNotebookEntry,
  appendToNotebook,
  getSubjects,
  Subject,
  NotebookEntry,
} from '@/lib/notebook';
import { detectDevice, getDeviceDescription, type DeviceInfo } from '@/lib/device-detector';
import { isGuestModeEnabled, clearGuestModeEnabled } from '@/lib/guest-mode';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type SettingsTab =
  | 'general'
  | 'connectors'
  | 'wallet'
  | 'secure_store'
  | 'permissions'
  | 'messaging'
  | 'devices'
  | 'data_controls'
  | 'help'
  | 'legal'
  | 'context'
  | 'notebook';

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('light');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Existing e-Mate states preserved
  const [subjects, setSubjects] = useState<Subject[]>(() => getSubjects());
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [notebookNotes, setNotebookNotes] = useState<NotebookEntry[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [profileName, setProfileName] = useState('Account');
  const [profileSubtitle, setProfileSubtitle] = useState('Password, security, personal details');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [remainingCredits, setRemainingCredits] = useState(50);
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [openRouterKeyInfo, setOpenRouterKeyInfo] = useState<OpenRouterKeyInfo | null>(null);
  const [userTokens, setUserTokensState] = useState(1_000_000_000);
  const [walletBalance, setWalletBalanceState] = useState(100.0);
  const [autoRecharge, setAutoRechargeState] = useState(false); // Default OFF per user request

  const [manualKeyInput, setManualKeyInput] = useState('');
  const [isConnectingOpenRouter, setIsConnectingOpenRouter] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(false);

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);  // Refresh quota from API
  const refreshQuota = async () => {
    setQuotaLoading(true);
    try {
      const quota = await fetchUserQuota();
      if (quota) {
        setRemainingCredits(quota.freePlan.remaining);
        setUserTokensState(quota.additionalTokens);
        setWalletBalanceState(quota.walletBalance);
        setAutoRechargeState(quota.autoRecharge);
      }
    } catch (error) {
      console.error('Error refreshing quota:', error);
    } finally {
      setQuotaLoading(false);
    }
  };

  const handleOAuthConnect = () => {
    const w = 600, h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(
      '/api/auth/openrouter/connect',
      'OpenRouter Auth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
    );
    setIsConnectingOpenRouter(true);
  };

  const handleSaveManualKey = (keyToSave?: string) => {
    const k = (keyToSave ?? manualKeyInput).trim();
    if (!k) {
      toast.error('Please enter an API key');
      return;
    }
    localStorage.setItem('user_openrouter_key', k);
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `user_openrouter_key=${encodeURIComponent(k)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
    setOpenRouterKey(k);
    setManualKeyInput('');
    toast.success('OpenRouter API key saved successfully!');
    fetchOpenRouterKeyInfo(k).then((info) => {
      if (info) setOpenRouterKeyInfo(info);
    });
  };

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'OPENROUTER_AUTH_SUCCESS' && e.data.key) {
        handleSaveManualKey(e.data.key);
        setIsConnectingOpenRouter(false);
      }
    };
    const handleOpenModal = () => {
      handleOAuthConnect();
    };
    window.addEventListener('message', handleMsg);
    window.addEventListener('nk-open-openrouter-modal', handleOpenModal);
    return () => {
      window.removeEventListener('message', handleMsg);
      window.removeEventListener('nk-open-openrouter-modal', handleOpenModal);
    };
  }, []);

  // Sync real OpenRouter key, trial credits, tokens, and wallet balance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('user_openrouter_key') || '';
      setRemainingCredits(getGuestCredits());
      setOpenRouterKey(key);
      setUserTokensState(getUserTokens());
      setWalletBalanceState(getWalletBalance());
      setAutoRechargeState(getAutoRechargeEnabled());

      if (key) {
        fetchOpenRouterKeyInfo(key).then((info) => {
          if (info) setOpenRouterKeyInfo(info);
        });
      }
    }
  }, []);

  // Detect device info on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDeviceInfo(detectDevice());
    }
  }, []);
  // Connectors state
  const connectors = [
    {
      id: 'openrouter',
      name: 'OpenRouter AI Models',
      status: openRouterKey ? 'Connected (API Key Active)' : 'Not Connected',
      desc: 'Access 200+ LLMs & vision models',
    },
    {
      id: 'supabase',
      name: 'Supabase Vector DB',
      status: 'Connected',
      desc: 'Cloud embeddings & document search',
    },
    {
      id: 'google',
      name: 'Google Search API',
      status: 'Connected',
      desc: 'Live web citations & real-time grounding',
    },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
    const t = saved || 'light';
    setTheme(t);
    setMode(t);
    setSelectedSubject(localStorage.getItem('nk-subject') || '');
    setSelectedUnit(localStorage.getItem('nk-unit') || '');
    const savedLang = localStorage.getItem('nk-language');
    if (savedLang) setSelectedLanguage(savedLang);

    const updateTheme = () => {
      const t2 = (localStorage.getItem('nk-theme') as 'light' | 'dark') || 'light';
      setTheme(t2);
      setMode(t2);
    };
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  // Set up periodic quota refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isGuest) {
        refreshQuota();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isGuest]);

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
          'User Account';
        const displayName = String(fullName).trim() || 'User Account';
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
        setIsGuest(false);
        setProfileName(displayName);
        setUserEmail(user.email || '');
        setProfileSubtitle(
          user.email ? `${user.email} · Password & Security` : 'Password, security, personal details'
        );
        setAvatarUrl(avatar);
        setUserTokensState(getUserTokens(false));
        setWalletBalanceState(getWalletBalance(false));
        setProfileLoading(false);

        // Fetch real-time quota data from API
        const quota = await fetchUserQuota();
        if (quota) {
          setRemainingCredits(quota.freePlan.remaining);
          setUserTokensState(quota.additionalTokens);
          setWalletBalanceState(quota.walletBalance);
          setAutoRechargeState(quota.autoRecharge);
        }
        return;
      }
      setIsGuest(true);
      setProfileName('Guest');
      setProfileSubtitle('Guest mode · Search & Study');
      setUserTokensState(getUserTokens(true));
      setWalletBalanceState(getWalletBalance(true));
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

  const handleThemeChange = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
    let targetTheme: 'light' | 'dark' = 'light';
    if (newMode === 'system') {
      targetTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      targetTheme = newMode;
    }
    setTheme(targetTheme);
    localStorage.setItem('nk-theme', targetTheme);
    applyTheme(targetTheme);
    window.dispatchEvent(new Event('storage'));
  };

  const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'connectors', label: 'Connectors', icon: LayoutGrid },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'secure_store', label: 'Secure store', icon: ShieldCheck },
    { id: 'permissions', label: 'Permissions', icon: Key },
    { id: 'messaging', label: 'Messaging channels', icon: MessageSquare },
    { id: 'devices', label: 'Devices', icon: Monitor },
    { id: 'data_controls', label: 'Data controls', icon: Lock },
    { id: 'help', label: 'Help & support', icon: HelpCircle },
    { id: 'legal', label: 'Legal info', icon: FileText },
    { id: 'context', label: 'Study Context', icon: Compass },
    { id: 'notebook', label: 'My Notebook', icon: BookOpen },
  ];

  return (
    <div
      className="relative w-full max-w-[840px] h-[640px] max-h-[92vh] bg-white dark:bg-[#18181b] rounded-[28px] shadow-2xl border border-zinc-200/80 dark:border-zinc-800 flex overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-150 animate-in zoom-in-95"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Left Sidebar Navigation Pane ─────────────────────────────────── */}
      <nav className="w-[240px] shrink-0 border-r border-zinc-200/70 dark:border-zinc-800/80 p-5 flex flex-col justify-between bg-zinc-50/70 dark:bg-[#121215] select-none overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white px-2">
            Settings
          </h2>

          <div className="space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full text-left px-3 py-2 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'border-[1.5px] border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'border border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon
                    size={17}
                    className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}
                  />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Log out button */}
        <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 mt-4">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut size={17} className="text-zinc-500 dark:text-zinc-400 hover:text-red-500" />
            <span>Log out</span>
          </button>
        </div>
      </nav>

      {/* ── Right Content Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 sm:p-7 relative bg-white dark:bg-[#18181b]">
        {/* Close Button on top right */}
        <button
          onClick={onBack}
          className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all z-10"
          aria-label="Close Settings"
        >
          <X size={16} />
        </button>

        {/* Tab Header Title */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white capitalize">
            {NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'General'}
          </h3>
        </div>

        {/* ── GENERAL TAB CONTENT ───────────────────────────────────────── */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* User Account Card */}
            <div
              className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden text-zinc-700 dark:text-zinc-200">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={`${profileName || 'User'} avatar`} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                    {isGuest ? 'Guest' : profileName || 'User Account'}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {isGuest ? 'Guest mode · Sync searches' : profileSubtitle}
                  </p>
                </div>
              </div>
              {isGuest ? (
                <button
                  onClick={() => window.dispatchEvent(new Event('nk-open-signup-popup'))}
                  className="px-4 py-1.5 rounded-full bg-[#0060df] hover:bg-[#0052cc] text-white text-xs font-semibold shadow-2xs cursor-pointer active:scale-95 shrink-0"
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('help')}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <ArrowUpRight size={18} />
                </button>
              )}
            </div>

            {/* Usage Section */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Usage
              </span>
              <div className="p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 space-y-4">
                {/* Row 1: Free plan */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    <span>Free plan</span>
                    <span className="text-zinc-500 font-medium">
                      {remainingCredits} / 50 free searches left
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-2">Weekly limit resets every Sunday</p>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((50 - remainingCredits) / 50) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="h-[1px] bg-zinc-200/70 dark:bg-zinc-800/80 my-2" />

                {/* Row 2: OpenRouter API Tokens / Usage */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    <span>{openRouterKey ? 'OpenRouter API Usage' : 'Additional tokens'}</span>
                    <span className="text-zinc-500 font-medium font-mono text-[11px]">
                      {openRouterKey
                        ? openRouterKeyInfo
                          ? `$${openRouterKeyInfo.usage.toFixed(4)} USD used`
                          : 'Connected'
                        : isGuest
                        ? '0 tokens'
                        : `${(userTokens / 1_000_000_000).toFixed(1)}B tokens left`}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    {openRouterKey
                      ? openRouterKeyInfo
                        ? openRouterKeyInfo.isFreeTier
                          ? 'Free Tier Models active'
                          : openRouterKeyInfo.limit !== null
                          ? `$${openRouterKeyInfo.limit.toFixed(2)} USD spending limit`
                          : 'Direct OpenRouter API balance'
                        : 'OpenRouter Key connected'
                      : isGuest
                      ? 'Connect OpenRouter to unlock 200+ models'
                      : 'Never expires'}
                  </p>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        openRouterKey ? 'bg-emerald-500 w-[100%]' : 'bg-emerald-500 w-[0%]'
                      }`}
                    />
                  </div>
                </div>

                {/* Upgrade Button */}
                <div className="pt-1">
                  <button
                    onClick={() => router.push('/upgrade')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            </div>

            {/* Language Section */}
            <div className="relative">
              <div
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                  <span>Language</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>{selectedLanguage}</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {showLanguageMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-20 grid grid-cols-2 gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {['English', 'Auto-detect', 'Hindi', 'Spanish', 'French', 'German'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setShowLanguageMenu(false);
                        toast.success(`Language set to ${lang}`);
                      }}
                      className={`px-3 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                        selectedLanguage === lang
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Appearance Section */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Appearance
              </span>
              <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Mode</span>
                <div className="flex items-center p-1 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-2xl gap-1 border border-zinc-300/40 dark:border-zinc-700/50">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-1.5 rounded-xl transition-all ${
                      mode === 'light'
                        ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                    title="Light theme"
                  >
                    <Sun size={15} />
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-1.5 rounded-xl transition-all ${
                      mode === 'dark'
                        ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                    title="Dark theme"
                  >
                    <Moon size={15} />
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`p-1.5 rounded-xl transition-all ${
                      mode === 'system'
                        ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                    title="System theme"
                  >
                    <Monitor size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONNECTORS TAB ────────────────────────────────────────────── */}
        {activeTab === 'connectors' && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">Connect third-party models, search grounding, &amp; data stores.</p>
            <div className="space-y-3">
              {connectors.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{c.name}</h4>
                    <p className="text-xs text-zinc-500">{c.desc}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WALLET TAB ────────────────────────────────────────────────── */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white space-y-3 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-blue-100 uppercase font-semibold">
                    {openRouterKey ? 'OpenRouter API Credit Balance' : 'Available Credit'}
                  </span>
                  <h3 className="text-2xl font-bold mt-1">
                    {openRouterKey
                      ? openRouterKeyInfo
                        ? openRouterKeyInfo.limit !== null
                          ? `$${Math.max(0, openRouterKeyInfo.limit - openRouterKeyInfo.usage).toFixed(2)} USD`
                          : `$${walletBalance.toFixed(2)} USD`
                        : `$${walletBalance.toFixed(2)} USD`
                      : `$${walletBalance.toFixed(2)} USD`}
                  </h3>
                </div>
                <CreditCard size={24} className="text-blue-200" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-blue-100">
                  {openRouterKey
                    ? openRouterKeyInfo
                      ? `Key Usage: $${openRouterKeyInfo.usage.toFixed(4)} USD`
                      : 'OpenRouter key connected'
                    : isGuest
                    ? 'Sign in or create a free account to load wallet funds.'
                    : 'Unlimited fast-tier token access granted.'}
                </p>
                <button
                  onClick={() => {
                    if (openRouterKey) {
                      window.dispatchEvent(new Event('nk-open-openrouter-modal'));
                    } else if (isGuest) {
                      window.dispatchEvent(new Event('nk-open-signup-popup'));
                    } else {
                      const newBal = addWalletBalance(25.0);
                      setWalletBalanceState(newBal);
                      toast.success('Added $25.00 USD to your wallet!');
                    }
                  }}
                  className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                >
                  {openRouterKey ? 'Manage Key' : isGuest ? 'Sign In' : '+ Add $25'}
                </button>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-zinc-900 dark:text-white block">Auto-recharge low balance</span>
                <span className="text-[11px] text-zinc-400">Automatically top-up $20 when balance falls below $5</span>
              </div>
              <button
                onClick={() => {
                  const next = !autoRecharge;
                  setAutoRechargeState(next);
                  setAutoRechargeEnabled(next);
                  toast.success(`Auto-recharge ${next ? 'enabled' : 'disabled'}`);
                }}
                className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer active:scale-95 ${
                  autoRecharge
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {autoRecharge ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        )}

        {/* ── SECURE STORE TAB ───────────────────────────────────────────── */}
        {activeTab === 'secure_store' && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">Manage encrypted API keys and model credentials for unlimited access.</p>
            <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-white block">OpenRouter API Key</span>
                  <span className="font-mono text-zinc-400 text-[11px]">
                    {openRouterKey ? `sk-or-••••••••${openRouterKey.slice(-4)}` : 'Not connected'}
                  </span>
                  {openRouterKeyInfo && (
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                      <span>Usage: ${openRouterKeyInfo.usage.toFixed(4)} USD</span>
                      <a
                        href="https://openrouter.ai/settings/credits"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                      >
                        Top up credits <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {openRouterKey ? (
                    <button
                      onClick={() => {
                        localStorage.removeItem('user_openrouter_key');
                        document.cookie = 'user_openrouter_key=; path=/; max-age=0; SameSite=Lax';
                        setOpenRouterKey('');
                        setOpenRouterKeyInfo(null);
                        toast.success('OpenRouter API key disconnected');
                      }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-all active:scale-95 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleOAuthConnect}
                      disabled={isConnectingOpenRouter}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0060df] hover:bg-[#0052cc] text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      <span>{isConnectingOpenRouter ? 'Connecting...' : '1-Click Connect'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Manual API Key Input */}
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                <label className="text-[11px] font-medium text-zinc-500 block mb-1.5">
                  Or paste your OpenRouter API Key (sk-or-v1-...):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={manualKeyInput}
                    onChange={(e) => setManualKeyInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSaveManualKey()}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-all cursor-pointer"
                  >
                    Save Key
                  </button>
                </div>
              </div>

              <div className="h-[1px] bg-zinc-200/70 dark:bg-zinc-800" />
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-900 dark:text-white">Supabase Cloud Vector Key</span>
                <span className="font-mono text-emerald-500 font-semibold">Active &amp; Secured</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PERMISSIONS TAB ───────────────────────────────────────────── */}
        {activeTab === 'permissions' && (
          <div className="space-y-3">
            {['Microphone & Voice Input', 'Local File Access', 'Web Browser Grounding', 'Code Execution Sandbox'].map((p) => (
              <div key={p} className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-900 dark:text-white">{p}</span>
                <span className="text-emerald-500 font-semibold">Allowed</span>
              </div>
            ))}
          </div>
        )}

        {/* ── MESSAGING CHANNELS TAB ───────────────────────────────────── */}
        {activeTab === 'messaging' && (
          <div className="space-y-3">
            {['Web Chat Assistant', 'WhatsApp Integration', 'Telegram Bot Channel', 'Email Updates'].map((channel, idx) => (
              <div key={channel} className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-900 dark:text-white">{channel}</span>
                <span className={idx === 0 ? 'text-blue-500 font-semibold' : 'text-zinc-400'}>{idx === 0 ? 'Active' : 'Configure'}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── DEVICES TAB ───────────────────────────────────────────────── */}
        {activeTab === 'devices' && (
          <div className="space-y-3">
            {deviceInfo && (
              <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {deviceInfo.deviceType === 'mobile' && <Smartphone size={18} className="text-blue-500" />}
                  {deviceInfo.deviceType === 'tablet' && <Laptop size={18} className="text-blue-500" />}
                  {deviceInfo.deviceType === 'desktop' && <Laptop size={18} className="text-blue-500" />}
                  <div>
                    <h5 className="font-semibold text-zinc-900 dark:text-white">Current {deviceInfo.deviceName}</h5>
                    <p className="text-[11px] text-zinc-400">{getDeviceDescription(deviceInfo)}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-500">This Device</span>
              </div>
            )}
            {!deviceInfo && (
              <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Laptop size={18} className="text-blue-500" />
                  <div>
                    <h5 className="font-semibold text-zinc-900 dark:text-white">Device Information</h5>
                    <p className="text-[11px] text-zinc-400">Loading...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DATA CONTROLS TAB ─────────────────────────────────────────── */}
        {activeTab === 'data_controls' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Export Personal Chat History</span>
                <button
                  onClick={() => toast.success('Export started...')}
                  className="text-xs font-medium px-3.5 py-1 rounded-full bg-[#0060df] hover:bg-[#0052cc] text-white transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Export JSON
                </button>
              </div>
              <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex justify-between items-center">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Delete All Stored Sessions</span>
                <button
                  onClick={() => {
                    clearChatHistory();
                    toast.success('All chat sessions and local caches cleared!');
                  }}
                  className="text-xs font-medium px-3.5 py-1 rounded-full bg-[#db7a88] hover:bg-[#c96a78] text-white transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HELP & SUPPORT TAB ────────────────────────────────────────── */}
        {activeTab === 'help' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 space-y-3 text-xs">
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">Direct Support Contact</h4>
              <p className="text-zinc-500 leading-relaxed">Reach out to our engineering and student support team for instant assistance.</p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a href="mailto:support@emate-ai.com" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-500/20 transition-colors">
                  <Mail size={14} /> support@emate-ai.com
                </a>
                <a href="tel:+918860911070" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  <Phone size={14} /> +91 8860911070
                </a>
              </div>
              <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80 text-zinc-500 space-y-1">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">Registered Corporate Office</span>
                <p>e-Mate AI Technologies, Plot 42, Sector 18, Institutional Area, Gurugram, Delhi NCR 122015, India</p>
                <p className="text-[11px] text-zinc-400">Hours: Mon – Sat, 9:00 AM – 7:00 PM IST</p>
              </div>
            </div>
          </div>
        )}

        {/* ── LEGAL INFO TAB ────────────────────────────────────────────── */}
        {activeTab === 'legal' && (
          <div className="space-y-3 text-xs text-zinc-500">
            <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 space-y-3">
              <h4 className="font-semibold text-zinc-900 dark:text-white">e-Mate Artificial Intelligence System</h4>
              <p>Version 2.4.0 (Production Build 2026.09)</p>
              <p>© 2026 e-Mate AI Technologies. All rights reserved.</p>
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center gap-3">
                <a href="/privacy" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  Privacy Policy <ArrowUpRight size={12} />
                </a>
                <span>•</span>
                <a href="/terms" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  Terms of Service <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── STUDY CONTEXT TAB ─────────────────────────────────────────── */}
        {activeTab === 'context' && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">Select active syllabus subject and learning unit for contextual AI answers.</p>
            <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Syllabus Subject</span>
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                      selectedSubject === s.name
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span>{s.name}</span>
                    {selectedSubject === s.name && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── NOTEBOOK TAB ──────────────────────────────────────────────── */}
        {activeTab === 'notebook' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-500">Notes captured for <strong>{selectedSubject || 'active subject'}</strong></p>
              {notebookNotes.length > 0 && (
                <button
                  onClick={() => {
                    clearNotebook(selectedSubject);
                    setNotebookNotes([]);
                  }}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-[#db7a88] hover:bg-[#c96a78] text-white transition-all shadow-2xs cursor-pointer active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  Clear All Notes
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {notebookNotes.length === 0 ? (
                <p className="text-xs text-zinc-400 py-6 text-center">No saved notes yet.</p>
              ) : (
                notebookNotes.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 flex justify-between items-start text-xs">
                    <div>
                      <p className="text-zinc-900 dark:text-zinc-100">{n.content}</p>
                      <span className="text-[10px] text-zinc-400 mt-1 block">{n.timestamp}</span>
                    </div>
                    <button
                      onClick={() => {
                        deleteNotebookEntry(selectedSubject, n.id);
                        setNotebookNotes((prev) => prev.filter((x) => x.id !== n.id));
                      }}
                      className="text-red-500 p-1 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
