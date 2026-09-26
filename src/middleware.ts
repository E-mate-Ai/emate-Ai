import { NextResponse, type NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-up-login-screen',
  '/auth(.*)',
  '/api/auth(.*)',
  '/privacy',
  '/terms',
  '/thank-you',
  '/upgrade',
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
  '/_not-found',
]);

// Routes that should always be accessible (static assets, Clerk routes)
const isIgnoredRoute = createRouteMatcher([
  '/_next(.*)',
  '/__clerk(.*)',
  '/favicon.ico',
  '/.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?|ttf|ico)$',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  try {
    const pathname = request.nextUrl.pathname;

    // Skip middleware for ignored routes
    if (isIgnoredRoute(request)) {
      return NextResponse.next();
    }

    const { userId } = await auth();

    const isGuestMode =
      request.cookies.get('guest_mode')?.value === 'true' ||
      request.cookies.get('is_guest_user')?.value === 'true';

    const hasOpenRouterKey = Boolean(request.cookies.get('user_openrouter_key')?.value);
    const isAuthenticated = Boolean(userId) || hasOpenRouterKey;
    const isAllowedUser = isAuthenticated || isGuestMode;

    const isSandboxRoute = pathname.startsWith('/sandbox');

    // If a guest lands on sandbox, route to workspace
    if (isSandboxRoute && isGuestMode) {
      const url = request.nextUrl.clone();
      url.pathname = '/ai-topper-chat';
      return NextResponse.redirect(url);
    }

    // Skip auth check for public routes
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }

    // Unauthenticated non-guest user trying to access protected routes -> redirect to '/'
    if (!isAllowedUser && pathname.startsWith('/ai-topper-chat')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Authenticated user landing on root -> redirect to chat workspace
    if (isAuthenticated && pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/ai-topper-chat';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    // Log error but don't block the request - allow it to proceed
    console.error('[Middleware] Error:', error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
