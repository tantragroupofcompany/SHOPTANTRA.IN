import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';
import { classifyDbError } from '../../../../lib/authUtils';

/**
 * Corporate: live filtered order list.
 * Supports ?status=all|pending|completed|cancelled|refunded
 */
export async function GET(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    const url = new URL(request.url || '/');
    const status = String(url.searchParams.get('status') || 'all').toLowerCase();

    let where: any = {};
    switch (status) {
      case 'completed':
        where = { status: 'DELIVERED' };
        break;
      case 'pending':
        where = {
          status: {
            in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'],
          },
        };
        break;
      case 'cancelled':
        where = { status: 'CANCELLED' };
        break;
      case 'refunded':
        where = { status: 'REFUNDED' };
        break;
      case 'all':
      default:
        where = {};
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          totalAmount: true,
          isCod: true,
          createdAt: true,
          buyer: { select: { fullName: true, email: true, phone: true } },
          seller: { select: { storeName: true } },
          items: { select: { title: true, quantity: true, price: true }, take: 3 },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { status, total, items } });
  } catch (error: any) {
    console.error('Corporate orders error:', error);
    // Do not ship the raw Prisma/driver message to the browser, and do not
    // answer 200 with an empty list - that is indistinguishable from a genuinely
    // empty table and hides a database outage. Detail stays in the server log.
    const classified = classifyDbError(error);
    if (classified) {
      console.error('[corporate/orders] DB error:', error?.code || error?.message);
      return NextResponse.json(
        { success: false, error: 'Unable to load orders. Please try again.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Unable to load orders. Please try again.' },
      { status: 500 }
    );
  }
}