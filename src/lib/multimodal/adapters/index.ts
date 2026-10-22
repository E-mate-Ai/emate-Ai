// ─────────────────────────────────────────────────────────────────────────────
// Direct Provider Adapters & Provider Adapter Factory
// ─────────────────────────────────────────────────────────────────────────────

import { ProviderAdapter } from './base';
import { OpenRouterProviderAdapter } from './openrouter';
import { ProviderId } from '../types';

export * from './base';
export * from './openrouter';

const openRouterAdapter = new OpenRouterProviderAdapter();

/**
 * Returns the appropriate provider adapter for the requested provider ID.
 */
export function getProviderAdapter(providerId: ProviderId): ProviderAdapter {
  switch (providerId) {
    case 'openrouter':
      return openRouterAdapter;
    default:
      // OpenRouter handles multiple upstream providers via its universal gateway
      return openRouterAdapter;
  }
}
