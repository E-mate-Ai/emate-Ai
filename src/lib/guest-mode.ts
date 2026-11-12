const GUEST_MODE_KEY = 'guest_mode';
const GUEST_MODE_COOKIE = 'guest_mode';

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null;

  try {
    return (
      document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1] || null
    );
  } catch {
    return null;
  }
}

export function isGuestModeEnabled() {
  if (typeof window === 'undefined') return false;

  try {
    const fromStorage = window.localStorage?.getItem(GUEST_MODE_KEY) === 'true';
    if (fromStorage) return true;
  } catch {
    // Safari Private Browsing blocks localStorage
  }

  return getCookieValue(GUEST_MODE_COOKIE) === 'true';
}

export function setGuestModeEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isHttps ? '; Secure' : '';

  try {
    if (enabled) {
      try {
        window.localStorage?.setItem(GUEST_MODE_KEY, 'true');
      } catch {}
      document.cookie = `${GUEST_MODE_COOKIE}=true; path=/; max-age=31536000; SameSite=Lax${secureFlag}`;
    } else {
      try {
        window.localStorage?.removeItem(GUEST_MODE_KEY);
      } catch {}
      document.cookie = `${GUEST_MODE_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureFlag}`;
    }
    window.dispatchEvent(new Event('nk-guest-mode-change'));
  } catch {}
}

export function clearGuestModeEnabled() {
  setGuestModeEnabled(false);
}

