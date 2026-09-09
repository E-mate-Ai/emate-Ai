import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Read session token from multiple possible cookie names
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value ||
    request.cookies.get('sb-access-token')?.value ||
    request.cookies.get('user_openrouter_key')?.value ||
    request.cookies.get('is_guest_user')?.value;

  // Read saved last visited route from cookie
  const lastVisitedPage = request.cookies.get('last_visited_page')?.value;

  // When logged-in / guest user lands on root '/', redirect to their last visited page
  if (sessionToken && pathname === '/') {
    const targetRoute = lastVisitedPage
      ? decodeURIComponent(lastVisitedPage)
      : '/ai-topper-chat';
    return NextResponse.redirect(new URL(targetRoute, request.url));
  }

  // Redirect unauthenticated user away from protected routes to landing page '/'
  if (!sessionToken && pathname.startsWith('/ai-topper-chat')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

