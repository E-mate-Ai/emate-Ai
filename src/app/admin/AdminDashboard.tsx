'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  Globe,
  MessageSquare,
  NotebookPen,
  RefreshCw,
  Server,
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
  healthy: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-300 border border-amber-500/25',
  critical: 'bg-red-500/10 text-red-300 border border-red-500/25',
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
    default: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-violet-400',
    amber: 'text-amber-400',
  };
  const bgMap: Record<string, string> = {
    default: 'bg-emerald-500/10',
    blue: 'bg-blue-500/10',
    purple: 'bg-violet-500/10',
    amber: 'bg-amber-500/10',
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-zinc-950/30 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgMap[accent]}`}>
          <Icon size={16} className={accentMap[accent]} />
        </span>
      </div>
      <div className="text-3xl font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function LiveBadge({ updatedAt }: { updatedAt: string | null }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {updatedAt ? `Updated ${formatRelTime(updatedAt)}` : 'Live'}
    </div>
  );
}

function EmptyRow({ cols, label }: { cols: number; label?: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-sm text-zinc-600">
        {label ?? 'No data yet'}
      </td>
    </tr>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const safeJson = async (res: Response | null) => {
        if (!res || !res.ok) return null;
        try { return await res.json(); } catch { return null; }
      };

      const [
        overviewRes, usersRes, activityRes, creditsRes, healthRes, flagsRes, modelConfigRes,
      ] = await Promise.all([
        fetch('/api/admin?action=overview').catch(() => null),
        fetch('/api/admin?action=recent-users').catch(() => null),
        fetch('/api/admin?action=activity').catch(() => null),
        fetch('/api/admin?action=credits').catch(() => null),
        fetch('/api/admin?action=health').catch(() => null),
        fetch('/api/admin?action=flags').catch(() => null),
        fetch('/api/admin?action=model-config').catch(() => null),
      ]);

      const [overviewData, usersData, activityData, creditsData, healthData, flagsData, modelConfigData] =
        await Promise.all([
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleFlag = async (flagId: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-flag', flagId, enabled }),
      });
      if (!res.ok) throw new Error('Unable to update feature flag');
      const data = await res.json();
      setFlags((cur) =>
        cur.map((f) => (f.id === flagId ? { ...f, enabled: data.flag.enabled, updatedAt: data.flag.updatedAt } : f))
      );
    } catch (err: any) {
      setError(err?.message ?? 'Unable to update feature flag');
    }
  };

  const switchActiveEngine = async (engineId: string) => {
    setModelConfig((p) => ({ ...p, activeEngineForEmate: engineId }));
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'switch-active-model', modelId: engineId }),
    });
    if (!res.ok) { setError('Failed to switch engine'); return; }
    const data = await res.json();
    if (data.config) setModelConfig(data.config);
    setModelFeedback(`e-Mate engine → ${engineId}`);
    setTimeout(() => setModelFeedback(null), 3500);
  };

  const toggleModelPermitted = async (modelId: string, enabled: boolean) => {
    const nextList = enabled
      ? [...new Set([...modelConfig.enabledModelIds, modelId])]
      : modelConfig.enabledModelIds.filter((id) => id !== modelId);
    setModelConfig((p) => ({ ...p, enabledModelIds: nextList }));
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-model-config', config: { enabledModelIds: nextList } }),
    });
    if (!res.ok) { setError('Failed to update model'); return; }
    const data = await res.json();
    if (data.config) setModelConfig(data.config);
    setModelFeedback(`Model ${modelId} ${enabled ? 'enabled' : 'hidden'}`);
    setTimeout(() => setModelFeedback(null), 3000);
  };

  const toggleModelSelectorVisibility = async (enabled: boolean) => {
    setModelConfig((p) => ({ ...p, modelSelectorEnabled: enabled }));
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-model-config', config: { modelSelectorEnabled: enabled } }),
    });
    await toggleFlag('openrouterModelSelector', enabled);
    setModelFeedback(`User model switcher ${enabled ? 'enabled' : 'disabled'}`);
    setTimeout(() => setModelFeedback(null), 3000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-400">
              e-Mate Admin
            </p>
            <h1 className="mt-1.5 text-2xl font-bold">Operational Control Centre</h1>
            <div className="mt-1 flex items-center gap-3">
              {mode && (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  mode: {mode}
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
              className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-blue-500 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <a
              href="/"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            >
              ← Back to app
            </a>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <div className="font-semibold">Error loading dashboard</div>
              <div className="mt-0.5 text-red-300/80">{error}</div>
              {error.includes('service role') || error.includes('limited') ? (
                <div className="mt-2 text-xs text-red-400/70">
                  Tip: Add <code className="bg-red-500/10 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> to{' '}
                  <code className="bg-red-500/10 px-1 rounded">.env.local</code> for full admin DB access.
                </div>
              ) : null}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl border border-zinc-800 bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Stat Cards ─────────────────────────────────────────────────── */}
            {metrics && (
              <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total Users" value={fmtNum(metrics.totalUsers)} icon={Users} accent="blue" sub="Registered accounts in DB" />
                <StatCard label="Active Users" value={fmtNum(metrics.activeUsers)} icon={Activity} accent="default" sub="Updated profile in last 30d" />
                <StatCard label="Chat Sessions" value={fmtNum(metrics.totalChatSessions)} icon={MessageSquare} accent="purple" sub="All sessions in DB" />
                <StatCard label="Notebooks" value={fmtNum(metrics.totalNotebooks)} icon={NotebookPen} accent="amber" sub="User notebooks saved" />
              </section>
            )}

            {/* ── Two-col: Activity + Users ───────────────────────────────────── */}
            <section className="mb-6 grid gap-6 xl:grid-cols-2">
              <Panel
                title="Live Activity Feed"
                action={<LiveBadge updatedAt={lastRefreshed} />}
              >
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                    <thead className="bg-zinc-900/80 text-[11px] uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Activity</th>
                        <th className="px-4 py-3 text-right">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 bg-zinc-950/40">
                      {activity.length === 0 ? (
                        <EmptyRow cols={4} label="No activity yet — start a chat session" />
                      ) : (
                        activity.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                item.type === 'chat'
                                  ? 'bg-blue-500/10 text-blue-300'
                                  : 'bg-violet-500/10 text-violet-300'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-zinc-400 max-w-[120px] truncate">{item.user}</td>
                            <td className="px-4 py-3 text-zinc-300 max-w-[200px] truncate">{item.description}</td>
                            <td className="px-4 py-3 text-right text-xs text-zinc-500 whitespace-nowrap">{formatRelTime(item.time)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Registered Users" action={<span className="text-xs text-zinc-500">{users.length} shown</span>}>
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                    <thead className="bg-zinc-900/80 text-[11px] uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3 text-right">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 bg-zinc-950/40">
                      {users.length === 0 ? (
                        <EmptyRow cols={3} label="No registered users yet" />
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <span className="text-zinc-200 max-w-[100px] truncate">{u.full_name || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-zinc-400 max-w-[160px] truncate">{u.email || '—'}</td>
                            <td className="px-4 py-3 text-right text-xs text-zinc-500 whitespace-nowrap">
                              {u.updated_at ? formatRelTime(u.updated_at) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </section>

            {/* ── Health + Credits ────────────────────────────────────────────── */}
            <section className="mb-6 grid gap-6 xl:grid-cols-2">
              <Panel title="System Health" action={<LiveBadge updatedAt={lastRefreshed} />}>
                <div className="space-y-3">
                  {health.length === 0 ? (
                    <div className="py-6 text-center text-sm text-zinc-600">Checking services…</div>
                  ) : (
                    health.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[item.status] ?? 'bg-zinc-500'} ${item.status === 'healthy' ? 'shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]' : ''}`} />
                          <div className="min-w-0">
                            <div className="font-medium text-white text-sm">{item.name}</div>
                            <div className="text-xs text-zinc-400 truncate">{item.detail}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono text-blue-300">{item.value}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_RING[item.status]}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>

              <Panel title="User Accounts" action={<span className="text-xs text-zinc-500">{credits.length} loaded</span>}>
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                    <thead className="bg-zinc-900/80 text-[11px] uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3 text-right">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 bg-zinc-950/40">
                      {credits.length === 0 ? (
                        <EmptyRow cols={3} label="No accounts yet" />
                      ) : (
                        credits.map((c) => (
                          <tr key={c.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-mono text-xs text-zinc-300 max-w-[180px] truncate">{c.email}</div>
                              {c.name && c.name !== c.email && (
                                <div className="text-[11px] text-zinc-500 truncate">{c.name}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                {c.plan}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-zinc-500 whitespace-nowrap">
                              {c.lastActive ? formatRelTime(c.lastActive) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </section>

            {/* ── AI Model Switch & Routing Control ──────────────────────────── */}
            <section className="mb-6">
              <Panel title="AI Model Switch & Routing Control">
                {modelFeedback && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-xs text-emerald-300 font-medium animate-in fade-in">
                    <CheckCircle2 size={14} />
                    <span>{modelFeedback}</span>
                  </div>
                )}

                {/* Flagship engine switcher */}
                <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-5 mb-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-900/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center rounded-xl font-black text-white shadow-md shrink-0"
                        style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#10a37f 0%,#2563eb 100%)', fontSize: 16 }}
                      >
                        eM
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">e-Mate 17-Model Silent Auto-Mesh</h3>
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            17 Models • Silent Failover
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          All 17 free OpenRouter models pool into a silent failover mesh. If any crashes, e-Mate instantly switches — users never notice.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-zinc-400">Primary Engine:</span>
                      <span className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 text-xs font-mono font-medium text-blue-300">
                        {modelConfig.activeEngineForEmate}
                      </span>
                    </div>
                  </div>

                  {/* Engine presets */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { id: 'google/gemini-2.0-flash:free', name: 'Gemini 2.0 Flash', tag: 'Fastest • Multimodal', desc: 'Sub-second answers, image recognition & study support' },
                      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', tag: 'Math & STEM', desc: 'Step-by-step proofs, derivations & logic chains' },
                      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', tag: 'High Intelligence', desc: 'Frontier writing, summaries & debate analysis' },
                      { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder', tag: 'Code & Algorithms', desc: 'Programming, debugging & syntax assistance' },
                      { id: 'mistralai/mistral-small-3:free', name: 'Mistral Small 3', tag: 'Compact Logic', desc: 'Fast, concise explanations and flashcards' },
                      { id: 'openrouter/auto', name: 'OpenRouter Auto', tag: 'Live Auto Failover', desc: 'Dynamic real-time routing to best free model' },
                    ].map((opt) => {
                      const isActive = modelConfig.activeEngineForEmate === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => switchActiveEngine(opt.id)}
                          className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500'
                              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-semibold text-xs text-white">{opt.name}</span>
                            {isActive ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">
                                <Check size={9} /> Active
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">Switch</span>
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-blue-300 mb-1">{opt.tag}</span>
                          <span className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* User model selector toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/80 mb-5">
                  <div>
                    <div className="font-medium text-white text-sm">User Model Switcher</div>
                    <div className="mt-0.5 text-xs text-zinc-400">
                      Let users switch between free models in the chat composer.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleModelSelectorVisibility(!modelConfig.modelSelectorEnabled)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      modelConfig.modelSelectorEnabled
                        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700'
                    }`}
                  >
                    {modelConfig.modelSelectorEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Connected free models grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Connected Free Models ({(availableModels.length || ALL_FREE_MODELS.length)})
                    </h4>
                    <span className="text-[11px] text-zinc-500">Toggle visibility in user dropdown</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {(availableModels.length > 0 ? availableModels : ALL_FREE_MODELS).map((m) => {
                      const isEmate = m.id === 'emate';
                      const isAllowed = isEmate || modelConfig.enabledModelIds.length === 0 || modelConfig.enabledModelIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-900 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-3">
                            {isEmate ? (
                              <img
                                src="/asset/images/e.svg"
                                alt="e-Mate"
                                className="w-6.5 h-6.5 object-contain rounded-lg shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                                {m.name[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-xs text-white truncate">{m.name}</span>
                                {m.badge && (
                                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded shrink-0">{m.badge}</span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500 truncate block mt-0.5">{m.id}</span>
                            </div>
                          </div>
                          {isEmate ? (
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">Core</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleModelPermitted(m.id, !isAllowed)}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition shrink-0 ${
                                isAllowed
                                  ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {isAllowed ? 'Active' : 'Hidden'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            </section>

            {/* ── Feature Flags ───────────────────────────────────────────────── */}
            <section>
              <Panel title="Feature Flags & Maintenance Controls">
                <div className="space-y-3">
                  {flags.map((flag) => (
                    <div key={flag.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                      <div className="min-w-0">
                        <div className="font-medium text-white text-sm">{flag.label}</div>
                        <div className="mt-0.5 text-xs text-zinc-400">{flag.description}</div>
                        <div className="mt-1.5 text-[11px] text-zinc-600">Updated {formatAbsTime(flag.updatedAt)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFlag(flag.id, !flag.enabled)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          flag.enabled
                            ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700'
                        }`}
                      >
                        {flag.enabled ? 'On' : 'Off'}
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
