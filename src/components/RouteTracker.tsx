'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function RouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Exclude root, API routes, and static assets
    if (
      pathname !== '/' &&
      !pathname.startsWith('/api') &&
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/static') &&
      !pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/i)
    ) {
      // Write current pathname to cookie with safe encoding
      document.cookie = `last_visited_page=${encodeURIComponent(pathname)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }
  }, [pathname]);

  return null;
}
