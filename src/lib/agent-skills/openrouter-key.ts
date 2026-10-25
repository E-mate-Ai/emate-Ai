/** Preserve e-Mate's existing BYOK precedence while keeping secret selection server-side. */
export function resolveOpenRouterKey(input: {
  userApiKey?: unknown;
  cookieHeader?: string | null;
  authorizationHeader?: string | null;
  xOpenRouterKey?: string | null;
  serverKey?: string;
}): string | undefined {
  const direct = typeof input.userApiKey === 'string' ? input.userApiKey.trim() : '';
  if (direct) return direct;

  const cookie = input.cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('user_openrouter_key='))
    ?.slice('user_openrouter_key='.length);
  if (cookie) {
    try {
      const value = decodeURIComponent(cookie).trim();
      if (value) return value;
    } catch {
      // Ignore malformed cookies and continue through the supported key sources.
    }
  }

  const header = input.authorizationHeader || input.xOpenRouterKey || '';
  const normalized = header.trim().replace(/^Bearer\s+/i, '').trim();
  return normalized || input.serverKey?.trim() || undefined;
}
