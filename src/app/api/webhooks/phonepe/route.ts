import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { processVerifiedOrder } from '../../../../lib/orderProcessor';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const xVerify = request.headers.get('x-verify');

    if (!xVerify) {
      return NextResponse.json({ error: 'Signature header missing' }, { status: 400 });
    }

    const saltKey = process.env.PHONEPE_SALT_KEY || 'phonepe_secret_placeholder';
    const saltIndex = '1';

    // Parse the JSON request body which contains base64 encoded response
    const bodyJson = JSON.parse(rawBody);
    const base64Response = bodyJson.response;

    // Verify PhonePe Webhook Checksum: SHA256(base64Response + saltKey) + "###" + saltIndex
    const signatureInput = base64Response + saltKey;
    const hash = crypto.createHash('sha256').update(signatureInput).digest('hex');
    const expectedXVerify = `${hash}###${saltIndex}`;

    const isValid = expectedXVerify === xVerify;

    if (!isValid) {
      console.error('Invalid PhonePe webhook signature');
      return NextResponse.json({ error: 'Checksum verification failed' }, { status: 400 });
    }

    // Decode response payload
    const decodedBytes = Buffer.from(base64Response, 'base64').toString('utf-8');
    const payload = JSON.parse(decodedBytes);

    if (payload.success && payload.code === 'PAYMENT_SUCCESS') {
      const data = payload.data;
      const orderId = data.merchantTransactionId;
      const transactionId = data.transactionId;
      const amount = data.amount / 100; // convert paise to rupees
      const method = data.paymentInstrument.type;

      // Extract custom metadata or generate placeholder
      const orderData = {
        buyerId: 'guest_buyer',
        sellerId: 'seller_placeholder',
        subtotal: amount,
        shippingAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: amount,
        items: [{ productId: 'prod_placeholder', title: 'Product Purchase', price: amount, quantity: 1 }],
        shippingAddress: { address: 'Address details from PhonePe', city: 'City', state: 'State', pincode: '000000' }
      };

      const result = await processVerifiedOrder({
        gateway: 'PHONEPE',
        transactionReference: String(transactionId),
        amount,
        orderData,
        method,
        gatewayLogs: { payload },
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ success: true, message: 'Payment failed or pending code ignored' });
  } catch (error: any) {
    console.error('Error processing PhonePe webhook:', error);
    return NextResponse.json({ error: error.message || 'Webhook parsing failed' }, { status: 500 });
  }
}
