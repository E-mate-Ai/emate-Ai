import { NextResponse, type NextRequest } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  const { userId } = await auth();

  const isGuestMode =
    request.cookies.get('guest_mode')?.value === 'true' ||
    request.cookies.get('is_guest_user')?.value === 'true';

  const hasOpenRouterKey = Boolean(request.cookies.get('user_openrouter_key')?.value);
  const isAuthenticated = Boolean(userId) || hasOpenRouterKey;
  const isAllowedUser = isAuthenticated || isGuestMode;

  const isAuthPage =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/sign-up-login-screen') ||
    pathname.startsWith('/auth');
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
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
