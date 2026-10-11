'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  Globe,
  LayoutDashboard,
  MessageSquare,
  NotebookPen,
  RefreshCw,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { ALL_FREE_MODELS, type AIModelDefinition } from '@/lib/modelConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

type Metrics = {
  totalUsers: number;
  totalChatSessions: number;
  totalNotebooks: number;
  activeUsers: number;
  guestUsers: number;
  referrals: number;
  healthIssues: number;
};

type ActivityRow = {
  id: string;
  type: string;
  user: string;
  description: string;
  time: string;
};

type UserRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

type CreditRow = {
  id: string;
  email: string;
  name: string;
  plan: string;
  lastActive: string;
  status: string;
};

type HealthRow = {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  detail: string;
  value: string;
};

type FeatureFlag = {
  id: string;
  label: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
};

export type AdminSection =
  | 'overview'
  | 'activity'
  | 'users'
  | 'system-health'
  | 'model-routing'
  | 'feature-controls';

const SECTION_DETAILS: Record<AdminSection, { title: string; description: string }> = {
  overview: {
    title: 'Operations overview',
    description: 'Monitor usage, system health, and AI configuration.',
  },
  activity: {
    title: 'Activity log',
    description: 'Review recent chat and notebook activity across the workspace.',
  },
  users: {
    title: 'User management',
    description: 'Review registered accounts, profile details, and recent activity.',
  },
  'system-health': {
    title: 'System health',
    description: 'Inspect service connectivity, latency, and operational readiness.',
  },
  'model-routing': {
    title: 'Model routing',
    description: 'Choose the default AI engine and control which models are available.',
  },
  'feature-controls': {
    title: 'Feature controls',
    description: 'Manage maintenance, referrals, model selection, and experimental features.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatAbsTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const STATUS_RING: Record<string, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-700 border border-amber-500/25',
  critical: 'bg-red-500/10 text-red-700 border border-red-500/25',
};

const STATUS_DOT: Record<string, string> = {
  healthy: 'bg-emerald-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-400',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'default',
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: 'default' | 'blue' | 'purple' | 'amber';
  sub?: string;
}) {
  const accentMap: Record<string, string> = {
    default: 'text-emerald-700',
    blue: 'text-blue-700',
    purple: 'text-violet-700',
    amber: 'text-amber-700',
  };
  const bgMap: Record<string, string> = {
    default: 'bg-emerald-500/10',
    blue: 'bg-blue-500/10',
    purple: 'bg-violet-500/10',
    amber: 'bg-amber-500/10',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgMap[accent]}`}>
          <Icon size={16} className={accentMap[accent]} />
        </span>
      </div>
      <div className="text-3xl font-bold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function DetailStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-900/[0.02]">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-0.5 truncate text-[11px] text-slate-500">{note}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function LiveBadge({ updatedAt }: { updatedAt: string | null }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {updatedAt ? `Updated ${formatRelTime(updatedAt)}` : 'Live'}
    </div>
  );
}

function EmptyRow({ cols, label }: { cols: number; label?: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-sm text-slate-500">
        {label ?? 'No data yet'}
      </td>
    </tr>
  );
}

async function postAdminAction(payload: Record<string, unknown>) {
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Admin action failed (${response.status}).`);
  }
  return data;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard({ section = 'overview' }: { section?: AdminSection }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [credits, setCredits] = useState<CreditRow[]>([]);
  const [health, setHealth] = useState<HealthRow[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [modelConfig, setModelConfig] = useState<{
    activeEngineForEmate: string;
    enabledModelIds: string[];
    modelSelectorEnabled: boolean;
  }>({
    activeEngineForEmate: 'google/gemini-2.0-flash:free',
    enabledModelIds: [],
    modelSelectorEnabled: true,
  });
  const [availableModels, setAvailableModels] = useState<AIModelDefinition[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelFeedback, setModelFeedback] = useState<string | null>(null);
  const [mode, setMode] = useState<string>('');
  const [settingsStorageAvailable, setSettingsStorageAvailable] = useState(false);
  const [settingsStorageError, setSettingsStorageError] = useState<string | null>(null);
  const [savingFlagId, setSavingFlagId] = useState<string | null>(null);
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [savingEngine, setSavingEngine] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const safeJson = async (res: Response | null) => {
        if (!res) throw new Error('Unable to reach the admin API. Check the server connection.');
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || `Admin API returned ${res.status}.`);
        }
        return data;
      };

      const [overviewRes, usersRes, activityRes, creditsRes, healthRes, flagsRes, modelConfigRes] =
        await Promise.all([
          fetch('/api/admin?action=overview').catch(() => null),
          fetch('/api/admin?action=recent-users').catch(() => null),
          fetch('/api/admin?action=activity').catch(() => null),
          fetch('/api/admin?action=credits').catch(() => null),
          fetch('/api/admin?action=health').catch(() => null),
          fetch('/api/admin?action=flags').catch(() => null),
          fetch('/api/admin?action=model-config').catch(() => null),
        ]);

      const [
        overviewData,
        usersData,
        activityData,
        creditsData,
        healthData,
        flagsData,
        modelConfigData,
      ] = await Promise.all([
        safeJson(overviewRes),
        safeJson(usersRes),
        safeJson(activityRes),
        safeJson(creditsRes),
        safeJson(healthRes),
        safeJson(flagsRes),
        safeJson(modelConfigRes),
      ]);

      if (!overviewData) {
        throw new Error('Failed to connect to admin API. Make sure the dev server is running.');
      }

      setMetrics(overviewData.metrics ?? null);
      setMode(overviewData.mode ?? '');
      setUsers(usersData?.users ?? []);
      setActivity(activityData?.activity ?? []);
      setCredits(creditsData?.credits ?? []);
      setHealth(healthData?.health ?? []);
      setFlags(flagsData?.flags ?? []);
      const storageAvailable = Boolean(
        flagsData?.storageAvailable && modelConfigData?.storageAvailable
      );
      setSettingsStorageAvailable(storageAvailable);
      setSettingsStorageError(
        storageAvailable
          ? null
          : flagsData?.storageError ||
              modelConfigData?.storageError ||
              'Admin settings storage is unavailable.'
      );
      if (modelConfigData?.config) setModelConfig(modelConfigData.config);
      if (modelConfigData?.allModels) setAvailableModels(modelConfigData.allModels);
      setLastRefreshed(new Date().toISOString());
    } catch (err: any) {
      setError(err?.message ?? 'Unable to fetch admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + auto-refresh every 30 seconds
  useEffect(() => {
    fetchAll(false);
    timerRef.current = setInterval(() => fetchAll(true), 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleFlag = async (flagId: string, enabled: boolean) => {
    if (!settingsStorageAvailable || savingFlagId) return;
    setSavingFlagId(flagId);
    setError(null);
    try {
      const data = await postAdminAction({ action: 'toggle-flag', flagId, enabled });
      setFlags((cur) =>
        cur.map((f) =>
          f.id === flagId ? { ...f, enabled: data.flag.enabled, updatedAt: data.flag.updatedAt } : f
        )
      );
      if (flagId === 'openrouterModelSelector') {
        setModelConfig((current) => ({ ...current, modelSelectorEnabled: data.flag.enabled }));
      }
      setModelFeedback(`${data.flag.label} ${enabled ? 'enabled' : 'disabled'}`);
      window.setTimeout(() => setModelFeedback(null), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to update feature flag');
    } finally {
      setSavingFlagId(null);
    }
  };

  const switchActiveEngine = async (engineId: string) => {
    if (!settingsStorageAvailable || savingEngine) return;
    setSavingEngine(true);
    setError(null);
    try {
      const data = await postAdminAction({ action: 'switch-active-model', modelId: engineId });
      if (data.config) setModelConfig(data.config);
      setModelFeedback(`e-Mate engine switched to ${engineId}`);
      window.setTimeout(() => setModelFeedback(null), 3500);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to switch engine');
    } finally {
      setSavingEngine(false);
    }
  };

  const toggleModelPermitted = async (modelId: string, enabled: boolean) => {
    if (!settingsStorageAvailable || savingModelId) return;
    setSavingModelId(modelId);
    setError(null);
    const nextList = enabled
      ? [...new Set([...modelConfig.enabledModelIds, modelId])]
      : modelConfig.enabledModelIds.filter((id) => id !== modelId);
    try {
      const data = await postAdminAction({
        action: 'update-model-config',
        config: { enabledModelIds: nextList },
      });
      if (data.config) setModelConfig(data.config);
      setModelFeedback(`${modelId} ${enabled ? 'enabled' : 'hidden'}`);
      window.setTimeout(() => setModelFeedback(null), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update model');
    } finally {
      setSavingModelId(null);
    }
  };

  const toggleModelSelectorVisibility = (enabled: boolean) =>
    toggleFlag('openrouterModelSelector', enabled);

  const enabledModels = modelConfig.enabledModelIds.length
    ? modelConfig.enabledModelIds.length
    : availableModels.length || ALL_FREE_MODELS.length;
  const healthyServices = health.filter((item) => item.status === 'healthy').length;
  const attentionServices = health.length - healthyServices;
  const enabledFlags = flags.filter((flag) => flag.enabled).length;
  const summaryBySection: Partial<
    Record<AdminSection, Array<{ label: string; value: string | number; note: string }>>
  > = {
    activity: [
      {
        label: 'Recent events',
        value: activity.length,
        note: 'Events in the latest activity feed',
      },
      {
        label: 'Chat sessions',
        value: activity.filter((item) => item.type === 'chat').length,
        note: 'Recent chat activity',
      },
      {
        label: 'Notebook updates',
        value: activity.filter((item) => item.type === 'notebook').length,
        note: 'Recent notebook activity',
      },
      {
        label: 'Latest event',
        value: activity[0] ? formatRelTime(activity[0].time) : '—',
        note: 'Most recent recorded event',
      },
    ],
    users: [
      {
        label: 'Total users',
        value: fmtNum(metrics?.totalUsers ?? 0),
        note: 'Registered profiles',
      },
      {
        label: 'Active users',
        value: fmtNum(metrics?.activeUsers ?? 0),
        note: 'Profiles updated in the last 30 days',
      },
      { label: 'Profiles shown', value: users.length, note: 'Latest registered users loaded' },
      { label: 'Account records', value: credits.length, note: 'Recent account activity loaded' },
    ],
    'system-health': [
      { label: 'Services checked', value: health.length, note: 'Configured dependency checks' },
      { label: 'Healthy', value: healthyServices, note: 'Services responding normally' },
      { label: 'Needs attention', value: attentionServices, note: 'Warnings or failed checks' },
      {
        label: 'Last check',
        value: lastRefreshed ? formatRelTime(lastRefreshed) : '—',
        note: 'Dashboard health refresh',
      },
    ],
    'model-routing': [
      {
        label: 'Models available',
        value: availableModels.length || ALL_FREE_MODELS.length,
        note: 'Curated free model catalog',
      },
      { label: 'Models enabled', value: enabledModels, note: 'Visible in the user model picker' },
      {
        label: 'User model picker',
        value: modelConfig.modelSelectorEnabled ? 'Enabled' : 'Disabled',
        note: 'Composer model selection',
      },
      {
        label: 'Default engine',
        value:
          modelConfig.activeEngineForEmate.split('/').pop() || modelConfig.activeEngineForEmate,
        note: 'Engine behind e-Mate',
      },
    ],
    'feature-controls': [
      {
        label: 'Features enabled',
        value: enabledFlags,
        note: `Of ${flags.length} configured controls`,
      },
      {
        label: 'Features disabled',
        value: flags.length - enabledFlags,
        note: 'Currently switched off',
      },
      {
        label: 'Settings storage',
        value: settingsStorageAvailable ? 'Connected' : 'Read-only',
        note: 'Persistent configuration status',
      },
      {
        label: 'Last refreshed',
        value: lastRefreshed ? formatRelTime(lastRefreshed) : '—',
        note: 'Current feature flag snapshot',
      },
    ],
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="sticky top-0 z-30 border-b border-slate-200 bg-white md:fixed md:inset-y-0 md:left-0 md:flex md:w-60 md:flex-col md:border-b-0 md:border-r">
        <div className="flex h-[68px] items-center gap-3 border-b border-slate-100 px-5">
          <img
            src="/asset/images/e.svg"
            alt="e-Mate logo"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-contain"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-slate-900">
              e-Mate AI
            </div>
            <div className="text-xs text-slate-500">Admin workspace</div>
          </div>
        </div>
        <nav
          aria-label="Admin sections"
          className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:overflow-y-auto"
        >
          <span className="hidden px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 md:block">
            Workspace
          </span>
          {[
            { id: 'overview' as AdminSection, label: 'Overview', icon: LayoutDashboard },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'system-health', label: 'System health', icon: Server },
          ].map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={id === 'overview' ? '/admin' : `/admin/${id}`}
              aria-current={section === id ? 'page' : undefined}
              className={`flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${section === id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </Link>
          ))}
          <span className="hidden px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 md:block">
            Configuration
          </span>
          {[
            { id: 'model-routing', label: 'Model routing', icon: Bot },
            { id: 'feature-controls', label: 'Feature controls', icon: SlidersHorizontal },
          ].map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`/admin/${id}`}
              aria-current={section === id ? 'page' : undefined}
              className={`flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${section === id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </Link>
          ))}
          <div className="mt-auto hidden rounded-xl border border-slate-200 bg-slate-50 p-3 md:block">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <ShieldCheck size={15} className="text-slate-500" />
              Secure admin access
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
              Operational settings are restricted to authorized administrators.
            </p>
          </div>
        </nav>
      </aside>

      <div className="min-w-0 md:ml-60">
        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                <span>Admin</span>
                <span aria-hidden="true">/</span>
                <span className="font-medium text-slate-700">{SECTION_DETAILS[section].title}</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                {SECTION_DETAILS[section].title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{SECTION_DETAILS[section].description}</p>
              <div className="mt-3 flex items-center gap-3">
                {mode && (
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600">
                    {mode === 'dev'
                      ? 'Development'
                      : mode === 'api-key'
                        ? 'API key'
                        : 'Admin session'}
                  </span>
                )}
                {lastRefreshed && <LiveBadge updatedAt={lastRefreshed} />}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchAll(true)}
                disabled={refreshing}
                className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
              <a
                href="/"
                className="flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                ← Back to app
              </a>
            </div>
          </header>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-700" />
              <div>
                <div className="font-semibold">Error loading dashboard</div>
                <div className="mt-0.5 text-red-700">{error}</div>
                {error.includes('service role') || error.includes('limited') ? (
                  <div className="mt-2 text-xs text-red-700/70">
                    Tip: Add{' '}
                    <code className="bg-red-500/10 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> to{' '}
                    <code className="bg-red-500/10 px-1 rounded">.env.local</code> for full admin DB
                    access.
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {section !== 'overview' && summaryBySection[section] && (
            <section
              aria-label={`${SECTION_DETAILS[section].title} summary`}
              className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {summaryBySection[section]?.map((item) => (
                <DetailStat key={item.label} {...item} />
              ))}
            </section>
          )}

          {!loading &&
            settingsStorageError &&
            ['overview', 'model-routing', 'feature-controls'].includes(section) && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-800">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <div className="font-semibold">Admin controls are read-only</div>
                  <p className="mt-1 text-amber-800">{settingsStorageError}</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Apply{' '}
                    <code className="rounded bg-amber-100 px-1">
                      supabase/migrations/20261011000000_admin_settings.sql
                    </code>{' '}
                    and configure the server-only service role key.
                  </p>
                </div>
              </div>
            )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* ── Stat Cards ─────────────────────────────────────────────────── */}
              {section === 'overview' && metrics && (
                <section
                  id="overview"
                  aria-label="Overview metrics"
                  className="mb-6 grid scroll-mt-24 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                  <StatCard
                    label="Total Users"
                    value={fmtNum(metrics.totalUsers)}
                    icon={Users}
                    accent="blue"
                    sub="Registered accounts in DB"
                  />
                  <StatCard
                    label="Active Users"
                    value={fmtNum(metrics.activeUsers)}
                    icon={Activity}
                    accent="default"
                    sub="Updated profile in last 30d"
                  />
                  <StatCard
                    label="Chat Sessions"
                    value={fmtNum(metrics.totalChatSessions)}
                    icon={MessageSquare}
                    accent="purple"
                    sub="All sessions in DB"
                  />
                  <StatCard
                    label="Notebooks"
                    value={fmtNum(metrics.totalNotebooks)}
                    icon={NotebookPen}
                    accent="amber"
                    sub="User notebooks saved"
                  />
                </section>
              )}

              {/* ── Two-col: Activity + Users ───────────────────────────────────── */}
              <section
                className={`mb-6 grid gap-6 ${section === 'overview' ? 'xl:grid-cols-2' : 'grid-cols-1'}`}
              >
                {(section === 'overview' || section === 'activity') && (
                  <Panel
                    title="Live Activity Feed"
                    action={<LiveBadge updatedAt={lastRefreshed} />}
                  >
                    <div
                      id="activity"
                      className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200"
                    >
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Activity</th>
                            <th className="px-4 py-3 text-right">When</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {activity.length === 0 ? (
                            <EmptyRow cols={4} label="No activity yet — start a chat session" />
                          ) : (
                            activity.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                  <span
                                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                      item.type === 'chat'
                                        ? 'bg-blue-500/10 text-blue-700'
                                        : 'bg-violet-500/10 text-violet-700'
                                    }`}
                                  >
                                    {item.type}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[120px] truncate">
                                  {item.user}
                                </td>
                                <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">
                                  {item.description}
                                </td>
                                <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                                  {formatRelTime(item.time)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                )}

                {(section === 'overview' || section === 'users') && (
                  <Panel
                    title="Registered Users"
                    action={<span className="text-xs text-slate-500">{users.length} shown</span>}
                  >
                    <div
                      id="users"
                      className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200"
                    >
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3 text-right">Last Active</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {users.length === 0 ? (
                            <EmptyRow cols={3} label="No registered users yet" />
                          ) : (
                            users.map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                                      {(u.full_name || u.email || '?')[0].toUpperCase()}
                                    </div>
                                    <span className="text-slate-700 max-w-[100px] truncate">
                                      {u.full_name || '—'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[160px] truncate">
                                  {u.email || '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                                  {u.updated_at ? formatRelTime(u.updated_at) : '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                )}
              </section>

              {/* ── Health + Credits ────────────────────────────────────────────── */}
              {(section === 'overview' || section === 'system-health' || section === 'users') && (
                <section
                  className={`mb-6 grid gap-6 ${section === 'overview' ? 'xl:grid-cols-2' : 'grid-cols-1'}`}
                >
                  {(section === 'overview' || section === 'system-health') && (
                    <Panel title="System Health" action={<LiveBadge updatedAt={lastRefreshed} />}>
                      <div id="system-health" className="scroll-mt-24">
                        <div className="space-y-3">
                          {health.length === 0 ? (
                            <div className="py-6 text-center text-sm text-slate-500">
                              Checking services…
                            </div>
                          ) : (
                            health.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[item.status] ?? 'bg-slate-400'} ${item.status === 'healthy' ? 'shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]' : ''}`}
                                  />
                                  <div className="min-w-0">
                                    <div className="font-medium text-slate-900 text-sm">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-slate-600 truncate">
                                      {item.detail}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-mono text-blue-700">
                                    {item.value}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_RING[item.status]}`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </Panel>
                  )}

                  {(section === 'overview' || section === 'users') && (
                    <Panel
                      title="User Accounts"
                      action={
                        <span className="text-xs text-slate-500">{credits.length} loaded</span>
                      }
                    >
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-4 py-3">User</th>
                              <th className="px-4 py-3">Plan</th>
                              <th className="px-4 py-3 text-right">Last Active</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {credits.length === 0 ? (
                              <EmptyRow cols={3} label="No accounts yet" />
                            ) : (
                              credits.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="font-mono text-xs text-slate-700 max-w-[180px] truncate">
                                      {c.email}
                                    </div>
                                    {c.name && c.name !== c.email && (
                                      <div className="text-[11px] text-slate-500 truncate">
                                        {c.name}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                      {c.plan}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                                    {c.lastActive ? formatRelTime(c.lastActive) : '—'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  )}
                </section>
              )}

              {/* ── AI Model Switch & Routing Control ──────────────────────────── */}
              {section === 'model-routing' && (
                <section id="model-routing" className="mb-6 scroll-mt-24">
                  <Panel title="AI Model Switch & Routing Control">
                    {!settingsStorageAvailable && (
                      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <AlertTriangle
                          size={16}
                          className="mt-0.5 shrink-0 text-amber-700"
                          aria-hidden="true"
                        />
                        <p className="leading-5">
                          Model and feature controls are read-only until Supabase settings storage
                          is connected. Configure the server-only service role key, apply the admin
                          settings migration, then refresh this page.
                        </p>
                      </div>
                    )}
                    {modelFeedback && (
                      <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-xs text-emerald-700 font-medium animate-in fade-in">
                        <CheckCircle2 size={14} />
                        <span>{modelFeedback}</span>
                      </div>
                    )}

                    {/* Flagship engine switcher */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 mb-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-100">
                        <div className="flex items-center gap-3">
                          <img
                            src="/asset/images/e.svg"
                            alt="e-Mate logo"
                            width={38}
                            height={38}
                            className="h-[38px] w-[38px] shrink-0 rounded-xl border border-slate-200 object-contain"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">
                                e-Mate 17-Model Silent Auto-Mesh
                              </h3>
                              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                17 Models • Silent Failover
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              All 17 free OpenRouter models pool into a silent failover mesh. If any
                              crashes, e-Mate instantly switches — users never notice.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-600">Primary Engine:</span>
                          <span className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 text-xs font-mono font-medium text-blue-700">
                            {modelConfig.activeEngineForEmate}
                          </span>
                        </div>
                      </div>

                      {/* Engine presets */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          {
                            id: 'google/gemini-2.0-flash:free',
                            name: 'Gemini 2.0 Flash',
                            tag: 'Fastest • Multimodal',
                            desc: 'Sub-second answers, image recognition & study support',
                          },
                          {
                            id: 'deepseek/deepseek-r1:free',
                            name: 'DeepSeek R1',
                            tag: 'Math & STEM',
                            desc: 'Step-by-step proofs, derivations & logic chains',
                          },
                          {
                            id: 'meta-llama/llama-3.3-70b-instruct:free',
                            name: 'Llama 3.3 70B',
                            tag: 'High Intelligence',
                            desc: 'Frontier writing, summaries & debate analysis',
                          },
                          {
                            id: 'qwen/qwen-2.5-coder-32b-instruct:free',
                            name: 'Qwen 2.5 Coder',
                            tag: 'Code & Algorithms',
                            desc: 'Programming, debugging & syntax assistance',
                          },
                          {
                            id: 'mistralai/mistral-small-3:free',
                            name: 'Mistral Small 3',
                            tag: 'Compact Logic',
                            desc: 'Fast, concise explanations and flashcards',
                          },
                          {
                            id: 'openrouter/auto',
                            name: 'OpenRouter Auto',
                            tag: 'Live Auto Failover',
                            desc: 'Dynamic real-time routing to best free model',
                          },
                        ].map((opt) => {
                          const isActive = modelConfig.activeEngineForEmate === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => switchActiveEngine(opt.id)}
                              disabled={!settingsStorageAvailable || savingEngine}
                              aria-pressed={isActive}
                              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                                isActive
                                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                  : 'bg-white border-slate-200 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-semibold text-xs text-slate-900">
                                  {opt.name}
                                </span>
                                {isActive ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                    <Check size={9} /> Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    Switch
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-medium text-blue-700 mb-1">
                                {opt.tag}
                              </span>
                              <span className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {opt.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* User model selector toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 mb-5">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">
                          User Model Switcher
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600">
                          Let users switch between free models in the chat composer.
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={modelConfig.modelSelectorEnabled}
                        aria-label="User model switcher"
                        disabled={!settingsStorageAvailable || Boolean(savingFlagId)}
                        onClick={() =>
                          toggleModelSelectorVisibility(!modelConfig.modelSelectorEnabled)
                        }
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 ${
                          modelConfig.modelSelectorEnabled ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${modelConfig.modelSelectorEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                    {/* Connected free models grid */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Connected Free Models ({availableModels.length || ALL_FREE_MODELS.length})
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Toggle visibility in user dropdown
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                        {(availableModels.length > 0 ? availableModels : ALL_FREE_MODELS).map(
                          (m) => {
                            const isEmate = m.id === 'emate';
                            const isAllowed =
                              isEmate ||
                              modelConfig.enabledModelIds.length === 0 ||
                              modelConfig.enabledModelIds.includes(m.id);
                            return (
                              <div
                                key={m.id}
                                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-white transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                  {isEmate ? (
                                    <img
                                      src="/asset/images/e.svg"
                                      alt="e-Mate"
                                      width={24}
                                      height={24}
                                      className="h-6 w-6 max-h-6 max-w-6 object-contain rounded-lg shrink-0"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                                      {m.name[0]}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium text-xs text-slate-900 truncate">
                                        {m.name}
                                      </span>
                                      {m.badge && (
                                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                                          {m.badge}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 truncate block mt-0.5">
                                      {m.id}
                                    </span>
                                  </div>
                                </div>
                                {isEmate ? (
                                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                                    Core
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isAllowed}
                                    aria-label={`${m.name} model availability`}
                                    disabled={!settingsStorageAvailable || Boolean(savingModelId)}
                                    onClick={() => toggleModelPermitted(m.id, !isAllowed)}
                                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                                      isAllowed ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                  >
                                    <span
                                      className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${isAllowed ? 'translate-x-4' : 'translate-x-0'}`}
                                    />
                                  </button>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </Panel>
                </section>
              )}

              {/* ── Feature Flags ───────────────────────────────────────────────── */}
              {section === 'feature-controls' && (
                <section id="feature-controls" className="scroll-mt-24">
                  <Panel title="Feature Flags & Maintenance Controls">
                    <div className="space-y-3">
                      {flags.map((flag) => (
                        <div
                          key={flag.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 text-sm">{flag.label}</div>
                            <div className="mt-0.5 text-xs text-slate-600">{flag.description}</div>
                            <div className="mt-1.5 text-[11px] text-slate-500">
                              Updated {formatAbsTime(flag.updatedAt)}
                            </div>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={flag.enabled}
                            aria-label={flag.label}
                            disabled={!settingsStorageAvailable || savingFlagId !== null}
                            onClick={() => toggleFlag(flag.id, !flag.enabled)}
                            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 ${
                              flag.enabled ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${flag.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
