import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { processVerifiedOrder } from '../../../../lib/orderProcessor';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-cf-signature');
    const timestamp = request.headers.get('x-cf-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Verification headers missing' }, { status: 400 });
    }

    const secretKey = process.env.CASHFREE_SECRET_KEY || 'cashfree_secret_placeholder';
    
    // Cashfree Signature calculation: HMAC-SHA256(body + timestamp, secretKey)
    const dataToSign = rawBody + timestamp;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(dataToSign)
      .digest('base64');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      console.error('Invalid Cashfree webhook signature');
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.type; // e.g. ORDER_PAID, ORDER_FAILED

    if (event === 'ORDER_PAID') {
      const orderDataRaw = payload.data.order;
      const paymentData = payload.data.payment;
      const orderId = orderDataRaw.order_id;
      const referenceId = paymentData.cf_payment_id;
      const amount = orderDataRaw.order_amount;
      const method = paymentData.payment_group;

      // Extract custom metadata or generate placeholder
      const notes = orderDataRaw.order_tags || {};
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
        gateway: 'CASHFREE',
        transactionReference: String(referenceId),
        amount,
        orderData,
        method,
        gatewayLogs: { event, payload },
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ success: true, message: `Event ${event} ignored` });
  } catch (error: any) {
    console.error('Error processing Cashfree webhook:', error);
    return NextResponse.json({ error: error.message || 'Webhook parsing failed' }, { status: 500 });
  }
}
