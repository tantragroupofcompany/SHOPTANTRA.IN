import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR', receipt = 'receipt_123' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount requested' },
        { status: 400 }
      );
    }

    // Razorpay accepts amounts in paise (multiply by 100)
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay Order:', error);
    return NextResponse.json(
      { error: error.message || 'Razorpay order creation failed' },
      { status: 500 }
    );
  }
}
