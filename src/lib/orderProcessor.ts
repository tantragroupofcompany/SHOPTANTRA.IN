import { prisma } from './prisma';
import { sendOrderConfirmationAlert } from './alerts';

interface ProcessOrderParams {
  gateway: 'RAZORPAY' | 'CASHFREE' | 'PHONEPE';
  transactionReference: string;
  amount: number;
  orderData: {
    buyerId: string;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    sellerId: string;
    subtotal: number;
    shippingAmount: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    items: Array<{
      productId: string;
      title: string;
      price: number;
      quantity: number;
      category?: string;
    }>;
    shippingAddress: any;
  };
  method?: string;
  gatewayLogs?: any;
}

export async function processVerifiedOrder(params: ProcessOrderParams) {
  const { gateway, transactionReference, amount, orderData, method, gatewayLogs } = params;

  try {
    // 1. Check for duplicate payments in the DB
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionReference },
    });

    if (existingPayment && existingPayment.status === 'PAID') {
      console.warn(`Payment with reference ${transactionReference} already processed. Skipping duplicate.`);
      return { success: true, message: 'Duplicate payment skipped', alreadyProcessed: true };
    }

    const {
      buyerId,
      buyerName = 'Customer Account',
      buyerEmail = 'customer@my-shop.in',
      buyerPhone = '9999999999',
      sellerId,
      subtotal,
      shippingAmount,
      taxAmount,
      discountAmount,
      totalAmount,
      items,
      shippingAddress,
    } = orderData;

    // Validate that the payment amount matches the order total
    if (Math.round(amount) !== Math.round(totalAmount)) {
      throw new Error(`Amount mismatch: gateway amount is ${amount}, order total is ${totalAmount}`);
    }

    // Run order fulfillment inside a single atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ensure User profile exists
      const user = await tx.user.upsert({
        where: { id: buyerId },
        update: {
          fullName: buyerName,
          phone: buyerPhone,
        },
        create: {
          id: buyerId,
          email: buyerEmail,
          fullName: buyerName,
          phone: buyerPhone,
        },
      });

      // 2. Ensure Seller profile exists
      const seller = await tx.seller.upsert({
        where: { id: sellerId },
        update: {},
        create: {
          id: sellerId,
          userId: user.id,
          storeName: 'Partner Merchant',
          commissionRate: 10.0,
          status: 'ACTIVE',
        },
      });

      // 3. Ensure Products exist and update stock
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

      // 4. Generate Order Number: SHP-YYYY-000001
      const currentYear = new Date().getFullYear();
      const lastOrder = await tx.order.findFirst({
        where: {
          orderNumber: {
            startsWith: `SHP-${currentYear}-`,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      let nextSequence = 1;
      if (lastOrder) {
        const parts = lastOrder.orderNumber.split('-');
        if (parts.length === 3) {
          const seq = parseInt(parts[2], 10);
          if (!isNaN(seq)) {
            nextSequence = seq + 1;
          }
        }
      }

      const paddedSequence = String(nextSequence).padStart(6, '0');
      const orderNumber = `SHP-${currentYear}-${paddedSequence}`;

      const isPendingMethod = gateway === 'COD' || gateway === 'MANUAL_UPI' || method === 'COD' || method === 'UPI';
      const finalPaymentStatus = isPendingMethod 
        ? (method === 'COD' || gateway === 'COD' ? 'COD_PENDING' : 'UPI_VERIFICATION_PENDING') 
        : 'PAID';
      const finalPaymentRecordStatus = isPendingMethod ? 'PENDING' : 'PAID';
      const finalCommissionStatus = isPendingMethod ? 'PENDING' : 'PROCESSED';

      // 5. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId: user.id,
          sellerId: seller.id,
          status: 'CONFIRMED',
          paymentStatus: finalPaymentStatus,
          paymentMethod: method || 'ONLINE_PAYMENT',
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

      // 6. Create/Upsert Payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          gateway,
          amount: totalAmount,
          status: finalPaymentRecordStatus,
          method: method || gateway,
          webhookVerified: !isPendingMethod,
          transactionReference,
          gatewayLogs: gatewayLogs || { verifiedAt: new Date().toISOString() },
        },
      });

      // 7. Calculate Commission fee
      const commissionRate = seller.commissionRate;
      const commissionAmount = (totalAmount * commissionRate) / 100;
      const sellerPayout = totalAmount - commissionAmount;

      // 8. Create Commission entry
      const commission = await tx.commission.create({
        data: {
          orderId: order.id,
          sellerId: seller.id,
          orderAmount: totalAmount,
          commissionRate,
          commissionAmount,
          sellerPayout,
          status: finalCommissionStatus,
        },
      });

      // 9. Update Vendor Wallet (route to pendingEarnings for pending payments)
      const walletUpdate = isPendingMethod
        ? { pendingEarnings: { increment: sellerPayout } }
        : { balance: { increment: sellerPayout } };

      const walletCreate = isPendingMethod
        ? { sellerId: seller.id, balance: 0.0, pendingEarnings: sellerPayout }
        : { sellerId: seller.id, balance: sellerPayout, pendingEarnings: 0.0 };

      const wallet = await tx.vendorWallet.upsert({
        where: { sellerId: seller.id },
        update: walletUpdate,
        create: walletCreate,
      });

      // 10. Log Wallet Transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: sellerPayout,
          type: 'CREDIT',
          description: isPendingMethod
            ? `Pending earnings logged for Order ${orderNumber} (${finalPaymentStatus})`
            : `Earnings credited for Order ${orderNumber}`,
        },
      });

      // 11. Create Admin Notification
      await tx.adminNotification.create({
        data: {
          title: isPendingMethod ? 'New Order Awaiting Verification' : 'New Order Received',
          message: isPendingMethod 
            ? `Order ${orderNumber} of ₹${totalAmount} placed via ${method || gateway} (Status: ${finalPaymentStatus}).`
            : `Order ${orderNumber} of ₹${totalAmount} paid via ${gateway}.`,
          type: 'ORDER',
        },
      });

      return { order, payment, commission, wallet };
    });

    try {
      sendOrderConfirmationAlert(buyerEmail, buyerPhone, buyerName, result.order.orderNumber, totalAmount);
    } catch (e) {
      console.error('Failed to trigger customer alerts:', e);
    }

    return {
      success: true,
      message: 'Payment verified and transaction logged successfully',
      data: result,
    };
  } catch (error: any) {
    console.error('Error verifying payment in database:', error);
    throw error;
  }
}
