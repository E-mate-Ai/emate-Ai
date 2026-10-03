import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { getAdminModelConfig, updateAdminModelConfig, ALL_FREE_MODELS } from '@/lib/modelConfig';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_API_KEY = (process.env.ADMIN_API_KEY || '').trim();

const FEATURE_FLAGS = {
  maintenanceMode: {
    id: 'maintenanceMode',
    label: 'Maintenance mode',
    enabled: false,
    description: 'Temporarily block public access to the app.',
    updatedAt: new Date().toISOString(),
  },
  referralProgram: {
    id: 'referralProgram',
    label: 'Referral program',
    enabled: true,
    description: 'Allow invite links and rewards to be active.',
    updatedAt: new Date().toISOString(),
  },
  openrouterModelSelector: {
    id: 'openrouterModelSelector',
    label: 'OpenRouter model selector',
    enabled: true,
    description: 'Allow users to change the OpenRouter model in the chat input.',
    updatedAt: new Date().toISOString(),
  },
  newStudyMode: {
    id: 'newStudyMode',
    label: 'New study mode',
    enabled: true,
    description: 'Enable the enhanced study workflow.',
    updatedAt: new Date().toISOString(),
  },
  experimentalAI: {
    id: 'experimentalAI',
    label: 'Experimental AI features',
    enabled: false,
    description: 'Expose beta features behind staging controls.',
    updatedAt: new Date().toISOString(),
  },
};

/** Build a Supabase client using the service role key (if available), else the anon/publishable key. */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const key = serviceKey || anonKey;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function authorizeAdmin(request: Request) {
  const isDev = process.env.NODE_ENV !== 'production';

  // In development, or if ADMIN_EMAILS is not configured, allow access
  if (isDev || ADMIN_EMAILS.length === 0) {
    return { mode: 'dev' as const, db: getSupabaseClient() };
  }

  const headerKey = request.headers.get('x-admin-key');
  if (ADMIN_API_KEY && headerKey === ADMIN_API_KEY) {
    return { mode: 'api-key' as const, db: getSupabaseClient() };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) return null;

    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) return null;

    return { mode: 'session' as const, db: getSupabaseClient() };
  } catch {
    return null;
  }
}

/** Safely query count from a table. Returns 0 on error. */
async function getCount(db: ReturnType<typeof getSupabaseClient>, table: string): Promise<number> {
  if (!db) return 0;
  try {
    const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
    return error ? 0 : Number(count ?? 0);
  } catch {
    return 0;
  }
}

/** Safely query rows from a table. */
async function queryRows<T = any>(
  db: ReturnType<typeof getSupabaseClient>,
  table: string,
  select: string,
  options?: { orderBy?: string; limit?: number; eq?: [string, string] }
): Promise<T[]> {
  if (!db) return [];
  try {
    let q = db.from(table).select(select);
    if (options?.eq) q = q.eq(options.eq[0], options.eq[1]);
    if (options?.orderBy) q = q.order(options.orderBy, { ascending: false });
    if (options?.limit) q = q.limit(options.limit);
    const { data, error } = await q;
    return (error ? [] : data ?? []) as T[];
  } catch {
    return [];
  }
}

/** Ping a URL, return latency in ms and whether it succeeded. */
async function pingUrl(url: string, opts?: { headers?: Record<string, string>; timeoutMs?: number }): Promise<{ ok: boolean; latencyMs: number; status: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 5000);
    const res = await fetch(url, { headers: opts?.headers, signal: controller.signal });
    clearTimeout(tid);
    return { ok: res.ok, latencyMs: Date.now() - start, status: res.status };
  } catch {
    return { ok: false, latencyMs: Date.now() - start, status: 0 };
  }
}

export async function GET(request: Request) {
  const admin = await authorizeAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized. Add ADMIN_EMAILS or ADMIN_API_KEY to .env.local.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'overview';

  try {
    // ── Overview ────────────────────────────────────────────────────────────────
    if (action === 'overview') {
      const [totalUsers, totalChatSessions, totalNotebooks] = await Promise.all([
        getCount(admin.db, 'profiles'),
        getCount(admin.db, 'chat_sessions'),
        getCount(admin.db, 'user_notebooks'),
      ]);

      // Active users: signed in within last 30 days
      let activeUsers = 0;
      if (admin.db) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        try {
          const { count } = await admin.db
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('updated_at', thirtyDaysAgo);
          activeUsers = Number(count ?? 0);
        } catch {}
      }

      return NextResponse.json({
        ok: true,
        mode: admin.mode,
        timestamp: new Date().toISOString(),
        metrics: {
          totalUsers,
          totalChatSessions,
          totalNotebooks,
          activeUsers,
          guestUsers: 0, // guests aren't stored in DB by design
          referrals: 0,
          healthIssues: 0,
        },
      });
    }

    // ── Users ────────────────────────────────────────────────────────────────────
    if (action === 'users') {
      const users = await queryRows(
        admin.db,
        'profiles',
        'id, email, full_name, avatar_url, updated_at',
        { orderBy: 'updated_at', limit: 50 }
      );
      return NextResponse.json({ ok: true, users });
    }

    // ── Activity ─────────────────────────────────────────────────────────────────
    if (action === 'activity') {
      const [sessions, notebooks] = await Promise.all([
        queryRows(
          admin.db,
          'chat_sessions',
          'id, user_id, title, subject, timestamp, updated_at',
          { orderBy: 'updated_at', limit: 15 }
        ),
        queryRows(
          admin.db,
          'user_notebooks',
          'id, user_id, subject, updated_at',
          { orderBy: 'updated_at', limit: 10 }
        ),
      ]);

      // Also get recent profiles for join
      const profileMap: Record<string, string> = {};
      if (admin.db && sessions.length > 0) {
        const userIds = [...new Set(sessions.map((s: any) => s.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          try {
            const { data: profileRows } = await admin.db
              .from('profiles')
              .select('id, email, full_name')
              .in('id', userIds.slice(0, 20));
            (profileRows ?? []).forEach((p: any) => {
              profileMap[p.id] = p.email || p.full_name || p.id.slice(0, 8);
            });
          } catch {}
        }
      }

      const activity = [
        ...sessions.map((s: any) => ({
          id: s.id,
          type: 'chat',
          user: profileMap[s.user_id] || s.user_id?.slice(0, 8) || 'unknown',
          description: s.title ? `Chat: ${s.title}` : `Chat session (${s.subject || 'General'})`,
          time: s.updated_at || new Date(s.timestamp).toISOString() || new Date().toISOString(),
        })),
        ...notebooks.map((n: any) => ({
          id: n.id,
          type: 'notebook',
          user: n.user_id?.slice(0, 8) || 'unknown',
          description: `Notebook updated: ${n.subject || 'General'}`,
          time: n.updated_at || new Date().toISOString(),
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 20);

      return NextResponse.json({ ok: true, activity });
    }

    // ── Recent Users ─────────────────────────────────────────────────────────────
    if (action === 'recent-users') {
      const users = await queryRows(
        admin.db,
        'profiles',
        'id, email, full_name, avatar_url, updated_at',
        { orderBy: 'updated_at', limit: 20 }
      );
      return NextResponse.json({ ok: true, users });
    }

    // ── Referrals ────────────────────────────────────────────────────────────────
    if (action === 'referrals') {
      // Try real table first, gracefully fallback to empty
      const rows = await queryRows(
        admin.db,
        'referrals',
        'id, referrer_id, referred_id, code, status, reward, created_at',
        { orderBy: 'created_at', limit: 25 }
      );
      return NextResponse.json({ ok: true, referrals: rows });
    }

    // ── Credits (real users with activity) ───────────────────────────────────────
    if (action === 'credits') {
      const users = await queryRows(
        admin.db,
        'profiles',
        'id, email, full_name, updated_at',
        { orderBy: 'updated_at', limit: 30 }
      );

      const credits = users.map((u: any) => ({
        id: u.id,
        email: u.email || `user-${u.id.slice(0, 6)}`,
        name: u.full_name || u.email?.split('@')[0] || 'Unknown',
        plan: 'Free',
        lastActive: u.updated_at,
        status: 'active',
      }));

      return NextResponse.json({ ok: true, credits });
    }

    // ── Health ───────────────────────────────────────────────────────────────────
    if (action === 'health') {
      const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_SERVER_FREE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const [orPing, sbPing] = await Promise.all([
        openrouterKey
          ? pingUrl('https://openrouter.ai/api/v1/auth/key', {
              headers: { Authorization: `Bearer ${openrouterKey}` },
              timeoutMs: 6000,
            })
          : Promise.resolve({ ok: false, latencyMs: 0, status: 0 }),
        supabaseUrl
          ? pingUrl(`${supabaseUrl}/rest/v1/`, {
              headers: {
                apikey:
                  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                  '',
              },
              timeoutMs: 5000,
            })
          : Promise.resolve({ ok: false, latencyMs: 0, status: 0 }),
      ]);

      const health = [
        {
          id: 'openrouter',
          name: 'OpenRouter API',
          status: openrouterKey
            ? orPing.ok
              ? 'healthy'
              : 'warning'
            : 'critical',
          detail: openrouterKey
            ? orPing.ok
              ? `Connected • ${orPing.latencyMs}ms response`
              : `Reachable but returned ${orPing.status ?? 'error'}`
            : 'No API key configured',
          value: orPing.ok ? `${orPing.latencyMs}ms` : 'unreachable',
        },
        {
          id: 'supabase',
          name: 'Supabase Database',
          status: supabaseUrl
            ? sbPing.ok || sbPing.status === 401 // 401 = reachable, just no anon access
              ? 'healthy'
              : 'warning'
            : 'critical',
          detail: supabaseUrl
            ? sbPing.ok || sbPing.status === 401
              ? `Connected • ${sbPing.latencyMs}ms response`
              : `Returned ${sbPing.status ?? 'error'} (${sbPing.latencyMs}ms)`
            : 'NEXT_PUBLIC_SUPABASE_URL not set',
          value: sbPing.ok || sbPing.status === 401 ? `${sbPing.latencyMs}ms` : 'unreachable',
        },
        {
          id: 'service-role',
          name: 'Service Role Access',
          status: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'healthy' : 'warning',
          detail: process.env.SUPABASE_SERVICE_ROLE_KEY
            ? 'Service role key present — full admin DB access'
            : 'Using anon key — add SUPABASE_SERVICE_ROLE_KEY for full admin access',
          value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'full access' : 'limited',
        },
      ];

      return NextResponse.json({ ok: true, health });
    }

    // ── Feature Flags ─────────────────────────────────────────────────────────────
    if (action === 'flags') {
      return NextResponse.json({ ok: true, flags: Object.values(FEATURE_FLAGS) });
    }

    // ── Model Config ──────────────────────────────────────────────────────────────
    if (action === 'model-config') {
      return NextResponse.json({
        ok: true,
        config: getAdminModelConfig(),
        allModels: ALL_FREE_MODELS,
      });
    }

    // ── Stats (aggregated metrics) ────────────────────────────────────────────────
    if (action === 'stats') {
      const [totalUsers, totalSessions, totalNotebooks] = await Promise.all([
        getCount(admin.db, 'profiles'),
        getCount(admin.db, 'chat_sessions'),
        getCount(admin.db, 'user_notebooks'),
      ]);

      // Active in last 7 days
      let weeklyActive = 0;
      if (admin.db) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        try {
          const { count } = await admin.db
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true })
            .gte('updated_at', sevenDaysAgo);
          weeklyActive = Number(count ?? 0);
        } catch {}
      }

      return NextResponse.json({
        ok: true,
        stats: { totalUsers, totalSessions, totalNotebooks, weeklyActive },
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Unknown action.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Admin API failure' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await authorizeAdmin(request);

  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body?.action;

    if (action === 'ping') {
      return NextResponse.json({
        ok: true,
        message: 'Admin API is active.',
        mode: admin.mode,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'toggle-flag') {
      const flagId = body?.flagId;
      if (!flagId || !(flagId in FEATURE_FLAGS)) {
        return NextResponse.json({ ok: false, error: 'Unknown flag id.' }, { status: 400 });
      }
      const nextEnabled = Boolean(body?.enabled);
      FEATURE_FLAGS[flagId as keyof typeof FEATURE_FLAGS] = {
        ...FEATURE_FLAGS[flagId as keyof typeof FEATURE_FLAGS],
        enabled: nextEnabled,
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ ok: true, flag: FEATURE_FLAGS[flagId as keyof typeof FEATURE_FLAGS] });
    }

    if (action === 'update-model-config') {
      const patch = body?.config;
      if (!patch || typeof patch !== 'object') {
        return NextResponse.json({ ok: false, error: 'Invalid config payload.' }, { status: 400 });
      }
      const updated = updateAdminModelConfig(patch);
      return NextResponse.json({ ok: true, config: updated });
    }

    if (action === 'switch-active-model') {
      const activeModelId = body?.modelId;
      if (!activeModelId) {
        return NextResponse.json({ ok: false, error: 'modelId is required.' }, { status: 400 });
      }
      const updated = updateAdminModelConfig({ activeEngineForEmate: activeModelId });
      return NextResponse.json({ ok: true, config: updated });
    }

    return NextResponse.json(
      { ok: false, error: 'Unknown POST action.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Invalid request payload' },
      { status: 400 }
    );
  }
}
