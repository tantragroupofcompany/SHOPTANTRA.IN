import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { processVerifiedOrder } from '../../../../lib/orderProcessor';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Signature header missing' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Webhook verification failed: missing configuration' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      console.error('Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature verification' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // We listen to payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount / 100; // convert paise to rupees
      const method = paymentEntity.method;

      // Extract notes/metadata for order details
      const notes = paymentEntity.notes || {};
      const orderData = notes.orderData ? JSON.parse(notes.orderData) : {
        buyerId: 'guest_buyer',
        sellerId: 'seller_placeholder',
        subtotal: amount,
        shippingAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: amount,
        items: [{ productId: 'prod_placeholder', title: 'Product Purchase', price: amount, quantity: 1 }],
        shippingAddress: { address: 'Address details from gateway', city: 'City', state: 'State', pincode: '000000' }
      };

      const result = await processVerifiedOrder({
        gateway: 'RAZORPAY',
        transactionReference: paymentId,
        amount,
        orderData,
        method,
        gatewayLogs: { event, payload },
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ success: true, message: `Event ${event} ignored` });
  } catch (error: any) {
    console.error('Error processing Razorpay webhook:', error);
    return NextResponse.json({ error: error.message || 'Webhook parsing failed' }, { status: 500 });
  }
}
