import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FREE_PLAN_MAX_SEARCHES = 50;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const costInTokens = body.cost || 1;

    // Fetch current quota
    const { data: quota, error: fetchError } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !quota) {
      return NextResponse.json(
        { error: 'User quota not found. Visit settings to initialize.' },
        { status: 404 }
      );
    }

    // Check weekly reset
    const currentWeekStart = getWeekStart();
    let searchesUsed = quota.searches_used || 0;
    if (quota.week_start !== currentWeekStart) {
      searchesUsed = 0;
      await supabase
        .from('user_quotas')
        .update({ searches_used: 0, week_start: currentWeekStart })
        .eq('user_id', user.id);
    }

    const additionalTokens = quota.additional_tokens || 0;

    if (searchesUsed < FREE_PLAN_MAX_SEARCHES) {
      // Consume from free plan
      const { error: updateError } = await supabase
        .from('user_quotas')
        .update({
          searches_used: searchesUsed + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error consuming free credit:', updateError);
        return NextResponse.json(
          { error: 'Failed to consume credit' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        planUsed: 'free',
        remaining: FREE_PLAN_MAX_SEARCHES - searchesUsed - 1,
      });
    } else if (additionalTokens >= costInTokens) {
      // Consume from additional tokens
      const { error: updateError } = await supabase
        .from('user_quotas')
        .update({
          additional_tokens: additionalTokens - costInTokens,
          last_used_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error consuming tokens:', updateError);
        return NextResponse.json(
          { error: 'Failed to consume tokens' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        planUsed: 'additional',
        tokensRemaining: additionalTokens - costInTokens,
      });
    } else {
      return NextResponse.json(
        {
          error: 'Quota exceeded. Please upgrade or add tokens.',
          code: 'QUOTA_EXCEEDED',
        },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error('Error consuming token:', error);
    return NextResponse.json(
      { error: 'Failed to process token consumption' },
      { status: 500 }
    );
  }
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const sunday = new Date(now);
  sunday.setDate(diff);
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().split('T')[0];
}
