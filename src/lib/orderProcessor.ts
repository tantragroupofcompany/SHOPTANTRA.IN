import { prisma } from './prisma';
import { sendOrderConfirmationAlert } from './alerts';

interface ProcessOrderParams {
  gateway: 'RAZORPAY' | 'CASHFREE' | 'PHONEPE' | 'COD';
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

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Resolve the effective commission rate server-side with the documented priority:
 * 1. Product-specific commissionPercent
 * 2. CATEGORY CommissionRule
 * 3. GLOBAL CommissionRule
 * 4. GlobalSettings.defaultCommissionRate
 * 5. Seller commissionRate (fallback)
 * Lookups are wrapped so a not-yet-migrated production table degrades safely.
 */
async function resolveCommissionRate(tx: any, seller: any, category: string, products: any[]): Promise<number> {
  try {
    const productSpecific = products.find((p: any) => p.commissionPercent != null);
    if (productSpecific && productSpecific.commissionPercent != null) {
      return Number(productSpecific.commissionPercent);
    }
  } catch (e) {
    console.warn('Commission (product-specific) lookup fell back:', e);
  }
  try {
    const categoryRule = await tx.commissionRule.findFirst({
      where: { scope: 'CATEGORY', category, isActive: true },
    });
    if (categoryRule) return Number(categoryRule.rate);
  } catch (e) {
    console.warn('Commission (category) lookup fell back:', e);
  }
  try {
    const globalRule = await tx.commissionRule.findFirst({
      where: { scope: 'GLOBAL', isActive: true },
    });
    if (globalRule) return Number(globalRule.rate);
  } catch (e) {
    console.warn('Commission (global rule) lookup fell back:', e);
  }
  try {
    const settings = await tx.globalSettings.findUnique({ where: { id: 'settings' } });
    if (settings && settings.defaultCommissionRate != null) {
      return Number(settings.defaultCommissionRate);
    }
  } catch (e) {
    console.warn('Commission (global settings) lookup fell back:', e);
  }
  return Number(seller.commissionRate) || 10;
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

      // 2. Ensure Seller profile exists and warehouse is verified
      const seller = await tx.seller.findUnique({
        where: { id: sellerId },
        include: { pickupAddress: true }
      });
      if (!seller) {
        throw new Error(`Seller profile with ID ${sellerId} not found.`);
      }
      if (!seller.pickupAddress || seller.pickupAddress.verificationStatus !== 'VERIFIED') {
        throw new Error(`Order placement failed: Seller's warehouse address for "${seller.storeName}" is not verified yet. Current status is ${seller.pickupAddress?.verificationStatus || 'PENDING'}.`);
      }

      // 3. SECURITY: recompute line totals from the live product catalogue.
      //    NEVER trust frontend-supplied prices as the ledger truth.
      const productIds = items.map(i => i.productId).filter(Boolean);
      const dbProducts = productIds.length
        ? await tx.product.findMany({ where: { id: { in: productIds } } })
        : [];
      const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));

      for (const item of items) {
        const dbProduct = productMap.get(item.productId);
        if (!dbProduct) {
          throw new Error(`Product "${item.title}" was not found in the catalogue.`);
        }
        if (dbProduct.status === 'BLOCKED') {
          throw new Error(`Product "${dbProduct.title}" is currently unavailable.`);
        }
        if (item.quantity > dbProduct.stock) {
          throw new Error(`Insufficient stock for "${dbProduct.title}". Available: ${dbProduct.stock}.`);
        }
      }

      const computedSubtotal = round2(
        items.reduce((sum: number, item) => {
          const dbProduct = productMap.get(item.productId);
          const unitPrice = dbProduct ? dbProduct.price : item.price;
          return sum + unitPrice * item.quantity;
        }, 0)
      );

      // Reject any attempt to write a tampered subtotal/total.
      if (Math.abs(computedSubtotal - round2(subtotal)) > 0.49) {
        throw new Error(
          `Order subtotal mismatch. Server recomputed ₹${computedSubtotal} from the catalogue but received ₹${subtotal}.`
        );
      }
      const computedTotal = round2(computedSubtotal - discountAmount + shippingAmount + taxAmount);
      if (Math.round(computedTotal) !== Math.round(totalAmount)) {
        throw new Error(
          `Order total mismatch. Server recomputed ₹${computedTotal} but received ₹${totalAmount}.`
        );
      }

      // 4. Persist verified products / decrement stock within the transaction
      for (const item of items) {
        const dbProduct = productMap.get(item.productId);
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: dbProduct ? { decrement: item.quantity } : item.quantity },
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
          status: 'PAID',
          paymentStatus: finalPaymentStatus,
          paymentMethod: method || 'ONLINE_PAYMENT',
          subtotal: computedSubtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          totalAmount,
          shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress || {}),
          items: {
            create: items.map((item: any) => {
              const dbProduct = productMap.get(item.productId);
              const unitPrice = dbProduct ? dbProduct.price : item.price;
              return {
                productId: item.productId,
                title: item.title,
                price: unitPrice,
                quantity: item.quantity,
                total: unitPrice * item.quantity,
              };
            }),
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

      // 7. Calculate Commission fee (server-side resolution)
      const primaryCategory = items[0]?.category || 'General';
      const commissionRate = await resolveCommissionRate(tx, seller, primaryCategory, dbProducts);
      const commissionAmount = round2((totalAmount * commissionRate) / 100);
      const sellerPayout = round2(totalAmount - commissionAmount);

      // 8. Create Commission entry
      const commission = await tx.commission.create({
        data: {
          orderId: order.id,
          sellerId: seller.id,
          orderAmount: totalAmount,
          grossAmount: totalAmount,
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

      // 11. Payment split bookkeeping (platform amount vs seller transfer amount)
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          platformAmount: commissionAmount,
          sellerTransferAmount: sellerPayout,
        },
      });

      // 12. Seller Settlement ledger. A prepaid order is recorded as PENDING until the
      //     official Razorpay Route / linked-account transfer actually executes. The
      //     seller is NEVER silently marked paid when transfer is not possible.
      let settlementStatus = 'PENDING';
      let settlementReason: string | null = null;
      if (isPendingMethod) {
        settlementReason = 'Order payment not yet captured';
      } else if (process.env.RAZORPAY_ROUTE_ENABLED === 'true' && seller.razorpayLinkedAccountId) {
        settlementStatus = 'PROCESSING';
      } else {
        settlementReason = seller.razorpayLinkedAccountId
          ? 'AUTO_TRANSFER_NOT_CONFIGURED'
          : 'SELLER_LINKED_ACCOUNT_MISSING';
      }

      const settlement = await tx.sellerSettlement.create({
        data: {
          orderId: order.id,
          sellerId: seller.id,
          paymentId: payment.id,
          grossAmount: totalAmount,
          commissionPercent: commissionRate,
          commissionAmount,
          sellerAmount: sellerPayout,
          status: settlementStatus,
          failureReason: settlementReason,
        },
      });

      // 13. Create Admin Notification
      await tx.adminNotification.create({
        data: {
          title: isPendingMethod ? 'New Order Awaiting Verification' : 'New Paid Marketplace Order',
          message: isPendingMethod 
            ? `Order ${orderNumber} of ₹${totalAmount} placed via ${method || gateway} (Status: ${finalPaymentStatus}).`
            : `Order ${orderNumber} of ₹${totalAmount} paid. Platform commission ₹${commissionAmount}, seller payout ₹${sellerPayout}.`,
          type: 'ORDER',
        },
      });

      return { order, payment, commission, wallet, settlement };
    });

    // 14. Attempt automatic seller transfer using the official Razorpay Route API.
    //     Guarded: if the transfer fails, the settlement is marked FAILED (visible in
    //     seller/corporate dashboards) and the order remains intact.
    if (result.settlement.status === 'PROCESSING') {
      try {
        const Razorpay = (await import('razorpay')).default;
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });
        const sellerForTransfer = await prisma.seller.findUnique({
          where: { id: result.settlement.sellerId },
        });
        const transferRef = result.payment.razorpayPaymentId || result.payment.transactionReference;
        const transfer: any = await rzp.payments.transfer(transferRef, {
          transfers: [
            {
              account: sellerForTransfer?.razorpayLinkedAccountId,
              amount: Math.round(result.settlement.sellerAmount * 100),
              currency: 'INR',
            },
          ],
        });
        const transferId = transfer?.id;
        await prisma.sellerSettlement.update({
          where: { id: result.settlement.id },
          data: { status: 'TRANSFERRED', transferId, failureReason: null },
        });
        await prisma.commission.update({
          where: { orderId: result.order.id },
          data: { status: 'PROCESSED', transferId },
        });
        console.log(`[SELLER TRANSFER] Transfer ${transferId} executed for order ${result.order.orderNumber}`);
      } catch (transferError: any) {
        console.error('[SELLER TRANSFER] Automatic transfer failed:', transferError);
        await prisma.sellerSettlement.update({
          where: { id: result.settlement.id },
          data: {
            status: 'FAILED',
            failureReason: transferError?.message || 'Razorpay Route transfer failed',
          },
        });
      }
    }

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
