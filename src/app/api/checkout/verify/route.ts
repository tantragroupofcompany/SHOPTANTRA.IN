import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check for generic gateway checkout verification (Cashfree / PhonePe sandbox fallbacks)
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

    // Verify cryptographic signature
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
      buyerId,
      sellerId,
      subtotal,
      shippingAmount,
      taxAmount,
      discountAmount,
      totalAmount,
      items,
      shippingAddress,
    } = orderData;

    // Database transactions: Create Order, Payment, Commission entries, and update Wallet
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ensure user and seller profiles exist in the DB (for production strictness)
      const user = await tx.user.findUnique({
        where: { id: buyerId },
      });
      if (!user) {
        throw new Error(`Customer with ID ${buyerId} not found in database.`);
      }

      const seller = await tx.seller.findUnique({
        where: { id: sellerId },
      });
      if (!seller) {
        throw new Error(`Seller with ID ${sellerId} not found in database.`);
      }

      // Ensure products exist in DB
      for (const item of items) {
        await tx.product.upsert({
          where: { id: item.productId },
          update: { stock: { decrement: item.quantity } },
          create: {
            id: item.productId,
            sellerId: seller.id,
            title: item.title,
            price: item.price,
            category: item.category || 'General',
            stock: 100 - item.quantity,
          },
        });
      }

      // Generate order number
      const orderNumber = `ST-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Create Order record
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId: user.id,
          sellerId: seller.id,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: 'ONLINE_PAYMENT',
          subtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          totalAmount,
          shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress || {}),
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
            })),
          },
        },
      });

      // 3. Create Payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          amount: totalAmount,
          status: 'PAID',
          method: 'RAZORPAY',
          gatewayLogs: { verifiedAt: new Date().toISOString() },
        },
      });

      // 4. Calculate Commission
      // Commission rate hierarchy: Vendor specific commission -> default global commission
      const commissionRate = seller.commissionRate;
      const commissionAmount = (totalAmount * commissionRate) / 100;
      const sellerPayout = totalAmount - commissionAmount;

      // 5. Create Commission entry
      const commission = await tx.commission.create({
        data: {
          orderId: order.id,
          sellerId: seller.id,
          orderAmount: totalAmount,
          commissionRate,
          commissionAmount,
          sellerPayout,
          status: 'PROCESSED',
        },
      });

      // 6. Update Vendor Wallet
      const wallet = await tx.vendorWallet.upsert({
        where: { sellerId: seller.id },
        update: {
          balance: { increment: sellerPayout },
          pendingEarnings: { increment: 0.0 }, // If return window active, increment here instead
        },
        create: {
          sellerId: seller.id,
          balance: sellerPayout,
          pendingEarnings: 0.0,
        },
      });

      // Log wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: sellerPayout,
          type: 'CREDIT',
          description: `Earnings credited for Order ${orderNumber}`,
        },
      });

      return { order, payment, commission, wallet };
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and transaction logged successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Payment signature verification failed' },
      { status: 500 }
    );
  }
}
