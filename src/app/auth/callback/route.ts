import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/ai-topper-chat";

  if (code) {
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, {
                  ...options,
                  // Required for Safari cookie persistence across OAuth redirects
                  sameSite: "lax",
                  secure: process.env.NODE_ENV === "production",
                  path: "/",
                })
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 1. Fetch user & sync profile
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
          console.error('[auth/callback] Profile sync error:', err);
        }
      }

      const response = NextResponse.redirect(new URL(next, request.url));
      response.cookies.delete('is_guest_user');
      response.cookies.delete('guest_mode');
      return response;
    }
  }

  // Return user to login page if code exchange fails
  return NextResponse.redirect(new URL("/sign-up-login-screen?error=auth_callback_failed", request.url));
}
