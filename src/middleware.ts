import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const canonicalOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://emate-ai.runs-on.dev';

  // 1. Permanently redirect old preview domain to canonical domain
  const host = request.headers.get('host') || '';
  if (host.includes('isachinbishts-projects.vercel.app')) {
    const redirectUrl = new URL(pathname + request.nextUrl.search, canonicalOrigin);
    return NextResponse.redirect(redirectUrl, 301);
  }

  // 2. Intercept OAuth auth code if Supabase redirected to /ai-topper-chat or / directly
  // Route it to /auth/callback so the code is properly exchanged for persistent session cookies
  const code = request.nextUrl.searchParams.get('code');
  if (code && !pathname.startsWith('/auth/callback')) {
    const callbackUrl = new URL('/auth/callback', canonicalOrigin);
    callbackUrl.searchParams.set('code', code);
    callbackUrl.searchParams.set('next', pathname.startsWith('/auth') ? '/ai-topper-chat' : pathname);
    return NextResponse.redirect(callbackUrl);
  }

  // The OAuth callback is a transient exchange step. Never redirect it away while
  // exchanging the code for a session.
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  // 3. Always refresh Supabase session cookie and retrieve authenticated user
  const { supabaseResponse, user } = await updateSession(request);

  // Helper: attach all refreshed cookies to any redirect response so session is never lost
  const redirectWithCookies = (url: URL) => {
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => {
      res.cookies.set(c);
    });
    return res;
  };

  // Inspect cookies for active authentication or guest sessions
  const allCookies = request.cookies.getAll();
  const hasSupabaseAuth =
    Boolean(user) ||
    allCookies.some(
      (c) =>
        c.name.startsWith('sb-') &&
        (c.name.includes('-auth-token') || c.name.includes('access-token')) &&
        Boolean(c.value)
    );

  const hasNextAuth =
    Boolean(request.cookies.get('next-auth.session-token')?.value) ||
    Boolean(request.cookies.get('__Secure-next-auth.session-token')?.value);

  const hasOpenRouterKey = Boolean(request.cookies.get('user_openrouter_key')?.value);

  const isGuestMode =
    request.cookies.get('guest_mode')?.value === 'true' ||
    request.cookies.get('is_guest_user')?.value === 'true';

  const isAuthenticated = hasSupabaseAuth || hasNextAuth || hasOpenRouterKey;
  const isAllowedUser = isAuthenticated || isGuestMode;

  const isAuthPage =
    pathname.startsWith('/sign-up-login-screen') || pathname.startsWith('/auth');
  const isSandboxRoute = pathname.startsWith('/sandbox');

  // If a guest lands on sandbox, route to workspace
  if (isSandboxRoute && isGuestMode) {
    const url = request.nextUrl.clone();
    url.pathname = '/ai-topper-chat';
    return redirectWithCookies(url);
  }

  // Unauthenticated non-guest user trying to access /ai-topper-chat -> redirect to '/'
  if (!isAllowedUser && pathname.startsWith('/ai-topper-chat')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return redirectWithCookies(url);
  }

  // Authenticated user landing on auth pages or root landing -> redirect to chat workspace
  if (isAuthenticated && (isAuthPage || pathname === '/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/ai-topper-chat';
    return redirectWithCookies(url);
  }

  // Return supabaseResponse to persist any refreshed tokens in the browser
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
