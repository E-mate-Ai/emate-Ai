import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Always refresh the Supabase session cookie first so server-side
  // auth clients in API routes can call getUser() without an extra round-trip.
  await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Inspect cookies for active authentication or guest sessions
  const allCookies = request.cookies.getAll();
  const hasSupabaseAuth = allCookies.some(
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
    return NextResponse.redirect(url);
  }

  // Unauthenticated non-guest user trying to access /ai-topper-chat -> redirect to '/'
  if (!isAllowedUser && pathname.startsWith('/ai-topper-chat')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Authenticated user landing on auth pages or root landing -> redirect to chat workspace
  if (isAuthenticated && (isAuthPage || pathname === '/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/ai-topper-chat';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
