'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function RouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Save user activity path into cookie on navigation
    if (pathname && pathname !== '/' && !pathname.startsWith('/api')) {
      document.cookie = `last_visited_page=${encodeURIComponent(
        pathname
      )}; path=/; max-age=604800; SameSite=Lax`;
    }
  }, [pathname]);

  return null;
}

export default RouteTracker;
