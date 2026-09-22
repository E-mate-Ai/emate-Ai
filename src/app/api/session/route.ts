import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { sessionId, isGuest, userAgent } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from('user_sessions').upsert(
        {
          session_id: sessionId,
          user_id: user?.id || null,
          is_guest: isGuest ?? !user,
          user_agent: userAgent || '',
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      );
    } catch {
      // Table may not exist or RLS might not be configured - ignore silently
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
