import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FREE_PLAN_MAX_SEARCHES = 50;
const DEFAULT_TOKENS = 1_000_000_000;
const DEFAULT_WALLET = 100.0;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch or initialize user quota record
    let { data: quota, error: fetchError } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !quota) {
      // Initialize quota record for new users
      const newQuota = {
        user_id: user.id,
        searches_used: 0,
        additional_tokens: DEFAULT_TOKENS,
        wallet_balance: DEFAULT_WALLET,
        auto_recharge: false,
        week_start: getWeekStart(),
        last_used_at: null,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('user_quotas')
        .upsert(newQuota, { onConflict: 'user_id' })
        .select()
        .single();

      if (insertError) {
        console.error('Error initializing user quota:', insertError);
        return NextResponse.json(
          { error: 'Failed to initialize quota' },
          { status: 500 }
        );
      }
      quota = inserted;
    }

    // Check if weekly reset is needed
    const currentWeekStart = getWeekStart();
    if (quota.week_start !== currentWeekStart) {
      const { data: updated, error: resetError } = await supabase
        .from('user_quotas')
        .update({ searches_used: 0, week_start: currentWeekStart })
        .eq('user_id', user.id)
        .select()
        .single();

      if (!resetError && updated) {
        quota = updated;
      }
    }

    const searchesUsed = quota.searches_used || 0;
    const freeSearchesLeft = Math.max(0, FREE_PLAN_MAX_SEARCHES - searchesUsed);

    return NextResponse.json({
      success: true,
      data: {
        freePlan: {
          total: FREE_PLAN_MAX_SEARCHES,
          used: searchesUsed,
          remaining: freeSearchesLeft,
          resetPeriod: 'Weekly limit resets every Sunday',
        },
        additionalTokens: quota.additional_tokens || 0,
        walletBalance: quota.wallet_balance || 0,
        autoRecharge: quota.auto_recharge || false,
        lastUsedAt: quota.last_used_at,
      },
    });
  } catch (error) {
    console.error('Error fetching user quota:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

/** Returns the ISO date string of the most recent Sunday (week start). */
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - day;
  const sunday = new Date(now);
  sunday.setDate(diff);
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().split('T')[0];
}
