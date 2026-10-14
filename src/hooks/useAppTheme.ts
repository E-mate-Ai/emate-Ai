import { useEffect, useState } from 'react';

/**
 * useAppTheme — syncs with the app's theme system.
 *
 * The app stores the active theme in localStorage under `nk-theme` ('light' | 'dark').
 * When the user toggles the theme (via Sidebar or Settings), the app:
 *   1. Updates localStorage
 *   2. Toggles `document.documentElement.classList` (adds/removes 'dark')
 *   3. Dispatches a custom `nk-theme` Event on window (same-tab notification)
 *
 * This hook listens to all three signals so it stays in sync instantly.
 */
export function useAppTheme(): { isDark: boolean; theme: 'light' | 'dark' } {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const read = () => {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('nk-theme');
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(saved === 'dark' || hasDarkClass);
    };

    // Read on mount
    read();

    // Listen for same-tab changes (custom event dispatched by Sidebar/Settings)
    window.addEventListener('nk-theme', read as EventListener);

    // Listen for cross-tab changes (storage event)
    window.addEventListener('storage', read);

    return () => {
      window.removeEventListener('nk-theme', read as EventListener);
      window.removeEventListener('storage', read);
    };
  }, []);

  return { isDark, theme: isDark ? 'dark' : 'light' };
}
