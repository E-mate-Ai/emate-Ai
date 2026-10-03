import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/ai-topper-chat';
  const canonicalOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://emate-ai.runs-on.dev';

  if (!code) {
    return NextResponse.redirect(
      new URL('/sign-up-login-screen?error=missing_oauth_code', canonicalOrigin)
    );
  }

  // Pre-create the response so setAll can write Set-Cookie headers directly to it
  const response = NextResponse.redirect(new URL(next, canonicalOrigin));
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOpts = {
                ...options,
                maxAge: 60 * 60 * 24 * 30, // 30 days persistence
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
              };
              cookieStore.set(name, value, cookieOpts);
              response.cookies.set(name, value, cookieOpts);
            });
          } catch {
            // Server component fallback
          }
        },
      },
    }
  );

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error('[auth/callback] exchange failed:', sessionError.message);
    return NextResponse.redirect(
      new URL(`/sign-up-login-screen?error=${encodeURIComponent(sessionError.message)}`, canonicalOrigin)
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('[auth/callback] getUser failed:', userError.message);
  }

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
      console.error('[auth/callback] Profile sync error:', err);
    }
  }

  response.cookies.delete('is_guest_user');
  response.cookies.delete('guest_mode');
  return response;
}
