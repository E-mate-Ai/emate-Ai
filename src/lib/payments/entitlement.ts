import { createClient } from '@supabase/supabase-js';

export interface GrantEntitlementParams {
  userId?: string | null;
  userEmail?: string | null;
  orderId: string;
  paymentId: string;
  planTier: string;
  amount?: number;
  currency?: string;
  source: 'verify_payment' | 'webhook';
}

export interface GrantEntitlementResult {
  success: boolean;
  alreadyProcessed: boolean;
  userId?: string;
  planTier: string;
  creditsAdded: number;
  expiryDate?: string;
  error?: string;
}

/**
 * Creates an elevated Supabase Service Role client for trusted server-to-server operations.
 */
export function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase service role credentials not configured.');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Maps plan tiers to credit allotments.
 */
function getCreditsForPlan(planTier: string): number {
  const tier = planTier.toLowerCase();
  if (tier === 'scale') return 2000;
  if (tier === 'growth') return 500;
  if (tier === 'starter' || tier === 'pro') return 250;
  return 100;
}

/**
 * Idempotently grants subscription tier and credits to a user upon verified payment.
 * Shared source-of-truth between /api/razorpay/verify-payment and /api/razorpay/webhook.
 */
export async function grantEntitlement(
  params: GrantEntitlementParams
): Promise<GrantEntitlementResult> {
  const { userId, userEmail, orderId, paymentId, planTier, source } = params;
  const supabase = getServiceSupabase();

  let targetUserId = userId;

  // Resolve user by email if userId not provided in webhook payload
  if (!targetUserId && userEmail) {
    const { data: userByEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    if (userByEmail?.id) {
      targetUserId = userByEmail.id;
    }
  }

  if (!targetUserId) {
    throw new Error(
      `Cannot grant entitlement: No user identified for Order ${orderId} / Payment ${paymentId}.`
    );
  }

  // 1. Check idempotency against profiles.last_payment_id
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, plan_tier, paid_credits, subscription_status, subscription_expiry, last_payment_id')
    .eq('id', targetUserId)
    .maybeSingle();

  if (fetchError) {
    console.error(`[grantEntitlement] Error fetching profile for ${targetUserId}:`, fetchError.message);
  }

  // If already credited with this exact payment ID, exit cleanly without double-counting
  if (profile?.last_payment_id === paymentId) {
    console.log(`[grantEntitlement] Payment ${paymentId} was already processed for user ${targetUserId} (${source}).`);
    return {
      success: true,
      alreadyProcessed: true,
      userId: targetUserId,
      planTier: profile.plan_tier || planTier,
      creditsAdded: 0,
      expiryDate: profile.subscription_expiry,
    };
  }

  // 2. Compute credits and expiry (30 days default)
  const creditsToAdd = getCreditsForPlan(planTier);
  const currentCredits = typeof profile?.paid_credits === 'number' ? profile.paid_credits : 0;
  const newCredits = currentCredits + creditsToAdd;
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // 3. Upsert / Update user profile
  const updatePayload: Record<string, any> = {
    id: targetUserId,
    plan_tier: planTier,
    subscription_status: 'active',
    subscription_expiry: expiryDate,
    paid_credits: newCredits,
    last_payment_id: paymentId,
    last_order_id: orderId,
    updated_at: new Date().toISOString(),
  };

  if (userEmail && !profile?.email) {
    updatePayload.email = userEmail;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .upsert(updatePayload, { onConflict: 'id' });

  if (updateError) {
    console.error(
      `[CRITICAL_PAYMENT_FAILURE] Failed to update user profile entitlement for user ${targetUserId} on payment ${paymentId}:`,
      updateError
    );
    throw new Error(`Database entitlement write failed: ${updateError.message}`);
  }

  // 4. Log successful entitlement grant
  console.log('[grantEntitlement] Entitlement granted successfully:', {
    userId: targetUserId,
    orderId,
    paymentId,
    planTier,
    creditsAdded: creditsToAdd,
    totalCredits: newCredits,
    source,
  });

  return {
    success: true,
    alreadyProcessed: false,
    userId: targetUserId,
    planTier,
    creditsAdded: creditsToAdd,
    expiryDate,
  };
}
