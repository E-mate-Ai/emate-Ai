/**
 * User quota utilities — fetch and manage real-time quota from Supabase backend
 */

export interface UserQuota {
  freePlan: {
    total: number;
    used: number;
    remaining: number;
    resetPeriod: string;
  };
  additionalTokens: number;
  walletBalance: number;
  autoRecharge: boolean;
  lastUsedAt: string | null;
}

/**
 * Fetch current user quota from API
 */
export async function fetchUserQuota(): Promise<UserQuota | null> {
  try {
    const response = await fetch('/api/user/quota', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to fetch quota:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching user quota:', error);
    return null;
  }
}

/**
 * Consume a token (either free search or additional tokens)
 */
export async function consumeToken(costInTokens: number = 1): Promise<{
  success: boolean;
  planUsed?: 'free' | 'additional';
  remaining?: number;
  tokensRemaining?: number;
  error?: string;
}> {
  try {
    const response = await fetch('/api/user/consume-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost: costInTokens }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to consume token',
      };
    }

    return {
      success: true,
      planUsed: result.planUsed,
      remaining: result.remaining,
      tokensRemaining: result.tokensRemaining,
    };
  } catch (error) {
    console.error('Error consuming token:', error);
    return {
      success: false,
      error: 'Network error consuming token',
    };
  }
}

/**
 * Set up real-time subscription to quota changes (optional, for future enhancement)
 */
export function subscribeToQuotaUpdates(
  callback: (quota: UserQuota) => void
): () => void {
  // TODO: Implement Supabase real-time subscriptions when database schema is ready
  const unsubscribe = () => {};
  return unsubscribe;
}
