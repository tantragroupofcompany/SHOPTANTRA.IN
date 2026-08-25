import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '../../../../lib/prisma';

// Initialize Razorpay SDK
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error('Razorpay credentials are not configured');
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currency = 'INR', orderData } = body;

    // SECURITY: compute the payable amount server-side from the product catalogue.
    // Never accept a client-supplied total directly.
    if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    const productIds = orderData.items.map((i: any) => i.productId).filter(Boolean);
    const dbProducts = productIds.length
      ? await prisma.product.findMany({ where: { id: { in: productIds } } })
      : [];
    const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));

    let subtotal = 0;
    for (const item of orderData.items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product "${item.title}" was not found in the catalogue.` },
          { status: 400 }
        );
      }
      if (item.quantity > dbProduct.stock) {
        return NextResponse.json(
          { error: `Insufficient stock for "${dbProduct.title}". Available: ${dbProduct.stock}.` },
          { status: 400 }
        );
      }
      subtotal += dbProduct.price * item.quantity;
    }

    const computedSubtotal = round2(subtotal);
    if (Math.abs(computedSubtotal - round2(Number(orderData.subtotal) || 0)) > 0.49) {
      return NextResponse.json(
        { error: 'Order subtotal mismatch. Amounts are computed server-side.' },
        { status: 400 }
      );
    }

    const shippingAmount = round2(Number(orderData.shippingAmount) || 0);
    const taxAmount = round2(Number(orderData.taxAmount) || 0);
    const discountAmount = round2(Number(orderData.discountAmount) || 0);
    const totalAmount = round2(computedSubtotal + shippingAmount + taxAmount - discountAmount);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount requested' }, { status: 400 });
    }

    const receipt = `rcpt_${Date.now()}`;

    // Razorpay accepts amounts in paise (multiply by 100)
    const options = {
      amount: Math.round(totalAmount * 100),
      currency,
      receipt,
      notes: {
        orderData: JSON.stringify({
          ...orderData,
          subtotal: computedSubtotal,
          totalAmount,
        }),
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      totalAmount,
      subtotal: computedSubtotal,
      shippingAmount,
      taxAmount,
      discountAmount,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay Order:', error);
    return NextResponse.json(
      { error: error.message || 'Razorpay order creation failed' },
      { status: 500 }
    );
  }
}