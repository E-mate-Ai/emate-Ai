/**
 * Credit limits for the dual-tier access system.
 *
 * - Guests get a fixed, non-refillable trial allowance of 20 queries (`GUEST_LIMIT`).
 * - Connected (authenticated) users get a daily refillable allowance
 *   (`DAILY_LIMIT`) tracked client-side by calendar date.
 *
 * All helpers are browser-only (guarded on `typeof window`) so this module can
 * be imported safely from server route handlers without touching localStorage.
 */

export const GUEST_LIMIT = 50;
export const DAILY_LIMIT = 5;

const GUEST_KEY = 'nk-guest-credits';
const AUTH_KEY = 'nk-auth-credits';

/* ── Guest (non-refillable) credits ──────────────────────────────────────── */

/** Remaining guest credits; initializes to GUEST_LIMIT on first visit. */
export function getGuestCredits(): number {
  if (typeof window === 'undefined') return GUEST_LIMIT;
  const raw = localStorage.getItem(GUEST_KEY);
  if (!raw) {
    localStorage.setItem(GUEST_KEY, String(GUEST_LIMIT));
    return GUEST_LIMIT;
  }
  const saved = parseInt(raw, 10);
  if (Number.isNaN(saved)) {
    localStorage.setItem(GUEST_KEY, String(GUEST_LIMIT));
    return GUEST_LIMIT;
  }
  // Upgrade users who had the old 20 limit to the 50 free credits limit
  if (saved === 20) {
    localStorage.setItem(GUEST_KEY, String(GUEST_LIMIT));
    return GUEST_LIMIT;
  }
  return Math.max(0, Math.min(saved, GUEST_LIMIT));
}

/** Decrement one guest credit (floors at 0); returns the remaining count. */
export function spendGuestCredit(): number {
  const next = Math.max(0, getGuestCredits() - 1);
  if (typeof window !== 'undefined') localStorage.setItem(GUEST_KEY, String(next));
  return next;
}

/** Explicitly set the guest credit level (used when granting/top-ups). */
export function setGuestCredits(n: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_KEY, String(Math.max(0, n)));
}

/** True when the guest allowance is fully consumed. */
export function guestCreditsExhausted(): boolean {
  return getGuestCredits() <= 0;
}

/* ── Authenticated (daily refillable) credits ────────────────────────────── */

interface AuthCreditState {
  used: number;
  date: string; // 'YYYY-MM-DD' local date
}

function today(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Current daily credit usage. If the stored date is not today, the counter is
 * reset to 0 (daily refill) and persisted.
 */
export function getAuthCredits(): { used: number; remaining: number } {
  if (typeof window === 'undefined') return { used: 0, remaining: DAILY_LIMIT };

  let state: AuthCreditState = { used: 0, date: today() };
  const raw = localStorage.getItem(AUTH_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthCreditState;
      if (parsed && typeof parsed.used === 'number' && typeof parsed.date === 'string') {
        // Refill when the stored date is not today.
        if (parsed.date !== today()) {
          state = { used: 0, date: today() };
        } else {
          state = { used: parsed.used, date: parsed.date };
        }
      }
    } catch {
      state = { used: 0, date: today() };
    }
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  return { used: state.used, remaining: Math.max(0, DAILY_LIMIT - state.used) };
}

/** Spend one daily credit; returns the remaining daily allowance. */
export function spendAuthCredit(): number {
  if (typeof window === 'undefined') return DAILY_LIMIT;
  const cur = getAuthCredits().used + 1;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ used: cur, date: today() }));
  return Math.max(0, DAILY_LIMIT - cur);
}

/** True when today's daily allowance is fully consumed. */
export function authCreditsExhausted(): boolean {
  return getAuthCredits().remaining <= 0;
}
