'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RouteTracker() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 1. Save user activity path into cookie on navigation
    if (pathname && pathname !== '/' && !pathname.startsWith('/api')) {
      document.cookie = `last_visited_page=${encodeURIComponent(
        pathname
      )}; path=/; max-age=604800; SameSite=Lax`;
    }

    // 2. Direct landing redirection when visiting root domain
    if (typeof document !== 'undefined') {
      const cookies = Object.fromEntries(
        document.cookie.split('; ').map((c) => {
          const parts = c.split('=');
          return [parts[0].trim(), parts[1]];
        })
      );

      if (
        pathname === '/' &&
        (cookies.is_guest_user ||
          cookies['next-auth.session-token'] ||
          cookies['sb-access-token'] ||
          cookies['user_openrouter_key'])
      ) {
        const target = cookies.last_visited_page
          ? decodeURIComponent(cookies.last_visited_page)
          : '/ai-topper-chat';
        router.push(target);
      }
    }
  }, [pathname, router]);

  return null;
}

export default RouteTracker;
