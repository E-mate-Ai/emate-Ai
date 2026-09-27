'use client';

import React, { useEffect, useState } from 'react';

type OverviewData = {
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
  created_at?: string | null;
  last_sign_in_at?: string | null;
};

type ReferralRow = {
  id: string;
  referrer: string;
  referred: string;
  code: string;
  status: 'redeemed' | 'pending' | 'expired';
  reward: string;
  createdAt: string;
};

type CreditRow = {
  id: string;
  email: string;
  tokens: number;
  wallet: number;
  plan: string;
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

const statusStyles: Record<string, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  critical: 'bg-red-500/10 text-red-300 border border-red-500/20',
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [credits, setCredits] = useState<CreditRow[]>([]);
  const [health, setHealth] = useState<HealthRow[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [overviewRes, usersRes, activityRes, referralsRes, creditsRes, healthRes, flagsRes] = await Promise.all([
          fetch('/api/admin?action=overview'),
          fetch('/api/admin?action=users'),
          fetch('/api/admin?action=activity'),
          fetch('/api/admin?action=referrals'),
          fetch('/api/admin?action=credits'),
          fetch('/api/admin?action=health'),
          fetch('/api/admin?action=flags'),
        ]);

        if (
          !overviewRes.ok ||
          !usersRes.ok ||
          !activityRes.ok ||
          !referralsRes.ok ||
          !creditsRes.ok ||
          !healthRes.ok ||
          !flagsRes.ok
        ) {
          throw new Error('Failed to load admin dashboard data.');
        }

        const [overviewData, usersData, activityData, referralsData, creditsData, healthData, flagsData] = await Promise.all([
          overviewRes.json(),
          usersRes.json(),
          activityRes.json(),
          referralsRes.json(),
          creditsRes.json(),
          healthRes.json(),
          flagsRes.json(),
        ]);

        setOverview(overviewData.metrics || null);
        setUsers(usersData.users || []);
        setActivity(activityData.activity || []);
        setReferrals(referralsData.referrals || []);
        setCredits(creditsData.credits || []);
        setHealth(healthData.health || []);
        setFlags(flagsData.flags || []);
      } catch (err: any) {
        setError(err?.message || 'Unable to fetch admin data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const toggleFlag = async (flagId: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-flag', flagId, enabled }),
      });

      if (!res.ok) {
        throw new Error('Unable to update feature flag');
      }

      const data = await res.json();
      setFlags((current) =>
        current.map((flag) =>
          flag.id === flagId ? { ...flag, enabled: data.flag.enabled, updatedAt: data.flag.updatedAt } : flag
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to update feature flag');
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-blue-400">e-Mate Admin</p>
            <h1 className="mt-2 text-3xl font-bold">Operational control centre</h1>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-blue-500 hover:text-white"
            >
              Back to app
            </a>
            <button
              type="button"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Run health check
            </button>
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-zinc-300">
            Loading dashboard…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && overview && (
          <>
            <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total users" value={overview.totalUsers} />
              <StatCard label="Active users" value={overview.activeUsers} />
              <StatCard label="Chat sessions" value={overview.totalChatSessions} />
              <StatCard label="Referrals" value={overview.referrals} />
            </section>

            <section className="mb-8 grid gap-4 md:grid-cols-3">
              <StatCard label="Notebooks" value={overview.totalNotebooks} />
              <StatCard label="Guest users" value={overview.guestUsers} />
              <StatCard label="Health issues" value={overview.healthIssues} accent="warning" />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Panel title="User activity log">
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                    <thead className="bg-zinc-900/80 text-zinc-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Activity</th>
                        <th className="px-4 py-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                      {activity.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                            No recent activity
                          </td>
                        </tr>
                      ) : (
                        activity.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-300">
                                {item.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-200">{item.user}</td>
                            <td className="px-4 py-3 text-zinc-300">{item.description}</td>
                            <td className="px-4 py-3 text-zinc-500">{formatDate(item.time)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Referral management">
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                    <thead className="bg-zinc-900/80 text-zinc-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Code</th>
                        <th className="px-4 py-3 font-medium">Referrer</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Reward</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                      {referrals.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                            No referrals found
                          </td>
                        </tr>
                      ) : (
                        referrals.map((referral) => (
                          <tr key={referral.id}>
                            <td className="px-4 py-3 font-mono text-blue-300">{referral.code}</td>
                            <td className="px-4 py-3 text-zinc-200">{referral.referrer}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${statusStyles[referral.status] || 'bg-zinc-800 text-zinc-300'}`}>
                                {referral.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-300">{referral.reward}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <Panel title="Token / credits editor">
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                    <thead className="bg-zinc-900/80 text-zinc-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Tokens</th>
                        <th className="px-4 py-3 font-medium">Wallet</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                      {credits.map((credit) => (
                        <tr key={credit.id}>
                          <td className="px-4 py-3 text-zinc-200">{credit.email}</td>
                          <td className="px-4 py-3 text-zinc-300">{formatNumber(credit.tokens)}</td>
                          <td className="px-4 py-3 text-zinc-300">${credit.wallet.toFixed(2)}</td>
                          <td className="px-4 py-3 text-zinc-300">{credit.plan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="System health">
                <div className="space-y-3">
                  {health.map((item) => (
                    <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{item.name}</div>
                          <div className="mt-1 text-sm text-zinc-400">{item.detail}</div>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${statusStyles[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-blue-300">{item.value}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <section className="mt-6">
              <Panel title="Feature flags and maintenance controls">
                <div className="space-y-3">
                  {flags.map((flag) => (
                    <div key={flag.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                      <div>
                        <div className="font-medium text-white">{flag.label}</div>
                        <div className="mt-1 text-sm text-zinc-400">{flag.description}</div>
                        <div className="mt-2 text-[11px] text-zinc-500">Updated {formatDate(flag.updatedAt)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFlag(flag.id, !flag.enabled)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
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

function StatCard({ label, value, accent = 'default' }: { label: string; value: number; accent?: 'default' | 'warning' }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-zinc-950/30">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className={`mt-4 text-3xl font-bold ${accent === 'warning' ? 'text-amber-300' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
