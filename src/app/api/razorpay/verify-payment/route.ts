import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: 'Razorpay secret key not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // TODO: Update user record in database
      // e.g. await db.user.update({ where: { id: userId }, data: { tier: planTier, status: 'active' } })
      console.log('[razorpay/verify] Payment verified:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        planTier,
        userId,
      });

      return NextResponse.json({ success: true, message: 'Payment verified successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    console.error('[razorpay/verify]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
