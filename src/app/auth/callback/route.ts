import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 1. Get user data and persist to Supabase profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'User';
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

          await supabase.from('profiles').upsert(
            {
              id: user.id,
              email: user.email,
              full_name: fullName,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (err) {
          console.error('[auth/callback] Profile sync error (continuing):', err);
        }
      }

      // 2. Build redirect base URL
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      let baseUrl: string;
      if (isLocalEnv) {
        baseUrl = origin;
      } else if (forwardedHost) {
        baseUrl = `https://${forwardedHost}`;
      } else {
        baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
      }

      const response = NextResponse.redirect(`${baseUrl}${next}`);
      // Clear guest mode cookies
      response.cookies.delete('is_guest_user');
      response.cookies.delete('guest_mode');
      return response;
    }
  }

  // Code exchange failed — send to login with error
  return NextResponse.redirect(
    `${origin}/sign-up-login-screen?error=auth_callback_failed`
  );
}
