import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { grantEntitlement } from '@/lib/payments/entitlement';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    const rawBody = await req.text();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature);
    const receivedBuf = Buffer.from(signature);

    if (expectedBuf.length !== receivedBuf.length) {
      console.warn('[razorpay/webhook] Signature length mismatch.');
      return NextResponse.json(
        { error: 'Invalid webhook signature length' },
        { status: 401 }
      );
    }

    const isAuthentic = crypto.timingSafeEqual(expectedBuf, receivedBuf);
    if (!isAuthentic) {
      console.warn('[razorpay/webhook] Signature verification failed.');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const eventData = JSON.parse(rawBody);
    const { event, payload } = eventData;

    console.log(`[razorpay/webhook] Received verified event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;

      const paymentId = paymentEntity?.id || '';
      const orderId = paymentEntity?.order_id || orderEntity?.id || '';
      const planTier =
        paymentEntity?.notes?.planTier ||
        orderEntity?.notes?.planTier ||
        'growth';
      const userId =
        paymentEntity?.notes?.userId ||
        orderEntity?.notes?.userId ||
        null;
      const userEmail =
        paymentEntity?.email ||
        paymentEntity?.notes?.userEmail ||
        orderEntity?.notes?.userEmail ||
        null;
      const amount = paymentEntity?.amount || orderEntity?.amount;
      const currency = paymentEntity?.currency || orderEntity?.currency;

      if (!paymentId && !orderId) {
        console.warn('[razorpay/webhook] Missing paymentId or orderId in event payload.');
        return NextResponse.json({ received: true, warning: 'Missing identifiers' });
      }

      try {
        const result = await grantEntitlement({
          userId,
          userEmail,
          orderId,
          paymentId: paymentId || `order_${orderId}`,
          planTier,
          amount,
          currency,
          source: 'webhook',
        });

        console.log('[razorpay/webhook] Webhook entitlement processed successfully:', result);
        return NextResponse.json({ received: true, status: 'processed', result });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Database update failed';
        console.error(
          `[CRITICAL_WEBHOOK_FAILURE] Failed to grant entitlement for event ${event} on Payment ${paymentId}:`,
          message
        );
        // Return 500 so Razorpay retries the webhook
        return NextResponse.json(
          { error: 'Entitlement grant failed', details: message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ received: true, status: 'ignored' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handling failed';
    console.error('[razorpay/webhook] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
