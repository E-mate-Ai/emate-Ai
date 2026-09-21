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

/* ── Additional Token & Wallet Balance System ────────────────────────────── */

export const DEFAULT_AUTH_TOKENS = 1_000_000_000; // 1 Billion tokens for authenticated users
export const DEFAULT_AUTH_WALLET = 100.0; // $100 USD initial balance for authenticated users

const TOKENS_KEY = 'nk-user-tokens';
const WALLET_KEY = 'nk-wallet-balance';
const AUTO_RECHARGE_KEY = 'nk-auto-recharge';

/** Get remaining Muse tokens balance (0 for guest unless specified) */
export function getUserTokens(isGuest: boolean = false): number {
  if (isGuest) return 0;
  if (typeof window === 'undefined') return DEFAULT_AUTH_TOKENS;
  const raw = localStorage.getItem(TOKENS_KEY);
  if (!raw) {
    localStorage.setItem(TOKENS_KEY, String(DEFAULT_AUTH_TOKENS));
    return DEFAULT_AUTH_TOKENS;
  }
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? DEFAULT_AUTH_TOKENS : Math.max(0, parsed);
}

/** Spend specified amount of tokens */
export function spendUserTokens(amount: number): number {
  const current = getUserTokens(false);
  const next = Math.max(0, current - amount);
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKENS_KEY, String(next));
  }
  return next;
}

/** Add tokens to user's token balance */
export function addUserTokens(amount: number): number {
  const current = getUserTokens(false);
  const next = current + amount;
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKENS_KEY, String(next));
  }
  return next;
}

/** Get user's wallet USD balance ($0.00 for guest unless signed in) */
export function getWalletBalance(isGuest: boolean = false): number {
  if (isGuest) return 0.0;
  if (typeof window === 'undefined') return DEFAULT_AUTH_WALLET;
  const raw = localStorage.getItem(WALLET_KEY);
  if (!raw) {
    localStorage.setItem(WALLET_KEY, String(DEFAULT_AUTH_WALLET));
    return DEFAULT_AUTH_WALLET;
  }
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? DEFAULT_AUTH_WALLET : Math.max(0, parsed);
}

/** Add USD funds to user wallet */
export function addWalletBalance(amount: number): number {
  const current = getWalletBalance(false);
  const next = current + amount;
  if (typeof window !== 'undefined') {
    localStorage.setItem(WALLET_KEY, String(next.toFixed(2)));
  }
  return next;
}

/** Spend USD funds from user wallet */
export function spendWalletBalance(amount: number): number {
  const current = getWalletBalance();
  const next = Math.max(0, current - amount);
  if (typeof window !== 'undefined') {
    localStorage.setItem(WALLET_KEY, String(next.toFixed(2)));
  }
  return next;
}

/** Get auto-recharge enabled status (OFF by default) */
export function getAutoRechargeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(AUTO_RECHARGE_KEY);
  return raw === 'true';
}

/** Set auto-recharge status */
export function setAutoRechargeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTO_RECHARGE_KEY, String(enabled));
}
