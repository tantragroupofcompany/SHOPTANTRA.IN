import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, customerId, customerName, customerEmail, customerPhone } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount requested' }, { status: 400 });
    }

    const orderId = `CF-ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey || appId.includes('placeholder') || secretKey.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Cashfree gateway is not configured' },
        { status: 500 }
      );
    }

    // Call Cashfree PG API (Sandbox/Production check based on env)
    const isProd = process.env.NODE_ENV === 'production';
    const baseUrl = isProd 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: customerId || 'guest_customer_123',
          customer_name: customerName || 'Guest User',
          customer_email: customerEmail || 'guest@shoptantra.in',
          customer_phone: customerPhone || '9099985145',
        },
        order_meta: {
          return_url: `${request.headers.get('origin') || 'https://shoptantra.in'}/checkout?order_id={order_id}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Cashfree order');
    }

    return NextResponse.json({
      success: true,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      cfOrder: data,
    });
  } catch (error: any) {
    console.error('Error creating Cashfree Order:', error);
    return NextResponse.json(
      { error: error.message || 'Cashfree order creation failed' },
      { status: 500 }
    );
  }
}
