import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'INR', planTier } = (await req.json()) as {
      amount?: number;
      currency?: string;
      planTier?: string;
    };

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!planTier || !['growth', 'scale'].includes(planTier)) {
      return NextResponse.json({ error: 'Invalid planTier' }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: { planTier },
    });

    return NextResponse.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Order creation failed';
    console.error('[razorpay/create-order]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
