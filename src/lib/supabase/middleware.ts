import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT add any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith('/sign-up-login-screen') ||
    request.nextUrl.pathname.startsWith('/auth');
  const isGuestMode =
    request.cookies.get('guest_mode')?.value === 'true' ||
    request.cookies.get('is_guest_user')?.value === 'true';
  const isGuestAccessibleRoute = request.nextUrl.pathname.startsWith('/ai-topper-chat');
  const isSandboxRoute = request.nextUrl.pathname.startsWith('/sandbox');

  if (isSandboxRoute && isGuestMode) {
    const url = request.nextUrl.clone();
    url.pathname = '/ai-topper-chat';
    return NextResponse.redirect(url);
  }

  const isApiRoute = request.nextUrl.pathname.startsWith('/api');


  const isLandingPage = request.nextUrl.pathname.startsWith('/landing');

  // Redirect authenticated users away from auth pages to home chat workspace.
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Safety net: if the user IS authenticated and lands on an unexpected
  // protected page, let them through — never bounce authenticated users
  // back to the login screen.  (The earlier guard already handles the
  // unauthenticated → login redirect, so reaching here means the user
  // has a valid session.)
  return supabaseResponse;
}
