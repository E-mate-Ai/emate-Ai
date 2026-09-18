/**
 * GET /api/user/notebooks
 * Returns all notebook entries and the custom subjects list for the currently
 * authenticated user. Used by AuthListener on SIGNED_IN to hydrate a new device.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    // Fetch notebooks and subjects in parallel
    const [notebooksResult, subjectsResult] = await Promise.all([
      supabase
        .from('user_notebooks')
        .select('subject, notebook_data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('user_subjects')
        .select('subjects')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (notebooksResult.error) {
      console.error('[/api/user/notebooks] notebooks error:', notebooksResult.error.message);
    }
    if (subjectsResult.error) {
      console.error('[/api/user/notebooks] subjects error:', subjectsResult.error.message);
    }

    const notebooks = (notebooksResult.data ?? []).map((row) => ({
      subject: row.subject,
      notebook: row.notebook_data,
    }));

    const subjects = (subjectsResult.data?.subjects as any[]) ?? [];

    return NextResponse.json({ notebooks, subjects });
  } catch (err: any) {
    console.error('[/api/user/notebooks] unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
