const GUEST_MODE_KEY = 'guest_mode';
const GUEST_MODE_COOKIE = 'guest_mode';

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null;

  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1] || null
  );
}

export function isGuestModeEnabled() {
  if (typeof window === 'undefined') return false;

  const fromStorage = window.localStorage.getItem(GUEST_MODE_KEY) === 'true';
  if (fromStorage) return true;

  return getCookieValue(GUEST_MODE_COOKIE) === 'true';
}

export function setGuestModeEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;

  if (enabled) {
    window.localStorage.setItem(GUEST_MODE_KEY, 'true');
    document.cookie = `${GUEST_MODE_COOKIE}=true; path=/; max-age=31536000; SameSite=Lax`;
  } else {
    window.localStorage.removeItem(GUEST_MODE_KEY);
    document.cookie = `${GUEST_MODE_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
  window.dispatchEvent(new Event('nk-guest-mode-change'));
}

export function clearGuestModeEnabled() {
  setGuestModeEnabled(false);
}
