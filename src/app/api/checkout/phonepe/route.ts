import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { amount, customerId, customerPhone } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount requested' }, { status: 400 });
    }

    const orderId = `PP-ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = '1';

    if (!merchantId || !saltKey || merchantId.includes('placeholder') || saltKey.includes('placeholder')) {
      return NextResponse.json(
        { error: 'PhonePe gateway is not configured' },
        { status: 500 }
      );
    }

    // PhonePe accepts amount in paise (multiply by 100)
    const amountInPaise = Math.round(amount * 100);
    const origin = request.headers.get('origin') || 'https://shoptantra.in';

    const payload = {
      merchantId,
      merchantTransactionId: orderId,
      merchantUserId: customerId || 'guest_user_123',
      amount: amountInPaise,
      redirectUrl: `${origin}/checkout?order_id=${orderId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${origin}/api/webhooks/phonepe`,
      mobileNumber: customerPhone || '9099985145',
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    // Calculate PhonePe Checksum: SHA256(base64Payload + "/pg/v1/pay" + saltKey) + "###" + saltIndex
    const payloadStr = JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadStr).toString('base64');
    const signatureInput = base64Payload + '/pg/v1/pay' + saltKey;
    const hash = crypto.createHash('sha256').update(signatureInput).digest('hex');
    const xVerifyHeader = `${hash}###${saltIndex}`;

    // Call PhonePe PG API (Sandbox/Production check based on env)
    const isProd = process.env.NODE_ENV === 'production';
    const hostUrl = isProd 
      ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

    const response = await fetch(hostUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerifyHeader,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'PhonePe payment session creation failed');
    }

    return NextResponse.json({
      success: true,
      orderId,
      redirectUrl: data.data.instrumentResponse.redirectInfo.url,
      phonepeData: data,
    });
  } catch (error: any) {
    console.error('Error creating PhonePe Order:', error);
    return NextResponse.json(
      { error: error.message || 'PhonePe order creation failed' },
      { status: 500 }
    );
  }
}
