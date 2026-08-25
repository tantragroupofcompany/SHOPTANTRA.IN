import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Generic gateway path (Cashfree / PhonePe / COD / UPI) - delegate to processVerifiedOrder.
    if (body.gateway && body.transactionReference) {
      const { processVerifiedOrder } = await import('../../../../lib/orderProcessor');
      const result = await processVerifiedOrder({
        gateway: body.gateway,
        transactionReference: body.transactionReference,
        amount: body.amount,
        orderData: body.orderData,
        method: body.method || body.gateway,
      });
      return NextResponse.json(result);
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData, // contains buyerId, sellerId, subtotal, shippingAmount, taxAmount, discountAmount, totalAmount, items, shippingAddress
    } = body;

    // 2. Server-side cryptographic verification of the Razorpay payment signature.
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Payment verification failed: missing configuration' },
        { status: 500 }
      );
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const isSignatureValid = generated_signature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: 'Payment signature verification failed' },
        { status: 400 }
      );
    }

    const {
      totalAmount,
    } = orderData;

    // 3. Delegate all order/payment/commission/settlement creation to the single shared
    //    processor. This guarantees idempotency (duplicate webhook/retries cannot create
    //    duplicate orders or transfers) and server-side amount recomputation - the
    //    frontend-supplied price is never trusted as the ledger truth.
    const { processVerifiedOrder } = await import('../../../../lib/orderProcessor');
    const result = await processVerifiedOrder({
      gateway: 'RAZORPAY',
      transactionReference: razorpay_payment_id,
      amount: Number(totalAmount),
      orderData,
      method: 'RAZORPAY',
      gatewayLogs: { razorpay_order_id, razorpay_payment_id, razorpay_signature, verifiedAt: new Date().toISOString() },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Payment signature verification failed' },
      { status: 500 }
    );
  }
}