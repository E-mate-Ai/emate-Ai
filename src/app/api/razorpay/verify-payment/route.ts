import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { grantEntitlement } from '@/lib/payments/entitlement';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planTier, userId } =
      (await req.json()) as {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        planTier?: string;
        userId?: string;
      };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification fields' },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay secret key not configured' },
        { status: 500 }
      );
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature);
    const receivedBuf = Buffer.from(razorpay_signature);

    if (expectedBuf.length !== receivedBuf.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature length' },
        { status: 401 }
      );
    }

    const isAuthentic = crypto.timingSafeEqual(expectedBuf, receivedBuf);
    if (!isAuthentic) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 401 }
      );
    }

    // Resolve target userId: authenticated session ALWAYS takes priority
    let targetUserId: string | undefined;
    let userEmail: string | undefined;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        targetUserId = user.id;
        userEmail = user.email;
      }
    } catch (authErr) {
      console.warn('[razorpay/verify] Could not resolve session user:', authErr);
    }

    // Fall back to body userId only if no active session exists
    if (!targetUserId && userId) {
      targetUserId = userId;
    }

    if (!targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Payment verified, but user session not found. Please log in or contact support with Payment ID: ' +
            razorpay_payment_id,
        },
        { status: 401 }
      );
    }

    // Perform idempotent database entitlement grant via Service Role client
    try {
      const entitlementResult = await grantEntitlement({
        userId: targetUserId,
        userEmail,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        planTier: planTier || 'growth',
        source: 'verify_payment',
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified and entitlement granted successfully',
        entitlement: entitlementResult,
      });
    } catch (dbError: unknown) {
      const dbMessage = dbError instanceof Error ? dbError.message : 'Database update failed';
      console.error(
        `[CRITICAL_PAYMENT_ERROR] Signature verified for Payment ${razorpay_payment_id} / Order ${razorpay_order_id}, but database entitlement update failed:`,
        dbMessage
      );

      return NextResponse.json(
        {
          success: false,
          critical: true,
          error:
            'Payment received, but entitlement activation failed. Please contact support with Payment ID: ' +
            razorpay_payment_id,
          details: dbMessage,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    console.error('[razorpay/verify]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
