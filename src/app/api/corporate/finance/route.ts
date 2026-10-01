import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';
import { classifyDbError } from '../../../../lib/authUtils';

/**
 * Corporate: live financial detail for the dashboard's revenue / payments /
 * commission cards.
 *
 * WHY THIS EXISTS: /api/corporate/dashboard returns financial SUMMARY numbers,
 * and the orders/sellers/products endpoints return lists of those entities. There
 * was no endpoint returning the underlying Payment / Commission /
 * SellerSettlement records, so the finance cards had nothing real to open. This
 * fills that gap rather than inventing data.
 *
 * MONEY RULES - identical to the dashboard aggregate, so the detail can never
 * disagree with the headline figure:
 *  - collected  = Payment rows with status PAID
 *  - COD is reported SEPARATELY as expected collection, never added into
 *    "collected" and never double-counted
 *  - failed payments are counted, not summed into revenue
 *  - refunds come from Payment REFUNDED
 *  - commission comes from the Commission table, and payouts from
 *    SellerSettlement, which are distinct records
 *
 * Supports ?view=payments|commission|settlements and ?status=<gateway or
 * settlement status>. Never returns a card/UPI/bank value or any credential.
 */

// Payment statuses that represent money actually taken.
const PAID = 'PAID';

export async function GET(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    const url = new URL(request.url || '/');
    const view = String(url.searchParams.get('view') || 'payments').toLowerCase();
    const status = String(url.searchParams.get('status') || 'all').toLowerCase();

    if (view === 'commission') {
      const where: any = {};
      if (status !== 'all') where.status = status.toUpperCase();

      const [items, total, agg] = await Promise.all([
        prisma.commission.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            orderId: true,
            orderAmount: true,
            commissionRate: true,
            commissionAmount: true,
            sellerPayout: true,
            status: true,
            createdAt: true,
            seller: { select: { storeName: true } },
          },
        }),
        prisma.commission.count({ where }),
        prisma.commission.aggregate({ where, _sum: { commissionAmount: true, sellerPayout: true } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          view,
          total,
          totals: {
            commission: Number(agg._sum.commissionAmount || 0),
            sellerPayout: Number(agg._sum.sellerPayout || 0),
          },
          items,
        },
      });
    }

    if (view === 'settlements') {
      const where: any = {};
      if (status !== 'all') where.status = status.toUpperCase();

      const [items, total, agg] = await Promise.all([
        prisma.sellerSettlement.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            orderId: true,
            sellerId: true,
            grossAmount: true,
            commissionAmount: true,
            sellerAmount: true,
            status: true,
            failureReason: true,
            createdAt: true,
            seller: { select: { storeName: true } },
          },
        }),
        prisma.sellerSettlement.count({ where }),
        prisma.sellerSettlement.aggregate({ where, _sum: { sellerAmount: true } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          view,
          total,
          totals: { sellerAmount: Number(agg._sum.sellerAmount || 0) },
          items,
        },
      });
    }

    // Default: payments.
    //
    // COD is a property of the ORDER, not the Payment row, so the COD / online
    // filters must go through the relation. Filtering `Payment.isCod` would be a
    // runtime "unknown argument" error.
    let where: any = {};
    if (status !== 'all') {
      if (status === 'cod') where = { order: { isCod: true } };
      else if (status === 'online') where = { order: { isCod: false } };
      else where = { status: status.toUpperCase() };
    }

    const [items, total, agg] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        // Deliberately excludes gatewayLogs, razorpaySignature, razorpayPaymentId
        // and any bank/UPI identifier: this panel is for executives, and none of
        // those fields are needed to read a payment.
        select: {
          id: true,
          orderId: true,
          gateway: true,
          method: true,
          status: true,
          amount: true,
          createdAt: true,
          order: { select: { orderNumber: true, isCod: true, totalAmount: true } },
        },
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        view: 'payments',
        total,
        totals: { amount: Number(agg._sum.amount || 0) },
        items,
      },
    });
  } catch (error: any) {
    console.error('Corporate finance error:', error);
    const classified = classifyDbError(error);
    if (classified) {
      console.error('[corporate/finance] DB error:', error?.code || error?.message);
      return NextResponse.json(
        { success: false, error: 'Unable to load this data. Please try again.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Unable to load this data. Please try again.' },
      { status: 500 }
    );
  }
}