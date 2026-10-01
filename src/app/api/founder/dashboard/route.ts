import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '../../../../middleware/index';
import { prisma } from '../../../../lib/prisma';
import { classifyDbError } from '../../../../lib/authUtils';

export async function GET(request: NextRequest) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingSellers,
      pendingProducts,
      todayOrders,
      todayRevenue,
      approvedProducts,
      approvedSellers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.seller.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.seller.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { totalAmount: true } }),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.seller.count({ where: { status: 'ACTIVE' } }),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        users: totalUsers,
        sellers: totalSellers,
        pendingSellers,
        approvedSellers,
        products: totalProducts,
        pendingProducts,
        approvedProducts,
        orders: totalOrders,
        todayOrders,
        revenue: Number(totalRevenue._sum.totalAmount || 0),
        todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
      },
    });
  } catch (error: any) {
    console.error('Founder dashboard error:', error);

    // Same defect as the corporate dashboard handler, fixed the same way: this
    // used to return HTTP 200 with all zeroes and the raw `error.message`. A
    // database outage therefore rendered as a real "0 users / 0 orders" board
    // (the silent-zero failure), and the Prisma/driver text reached the browser.
    // A known DB outage is 503; anything else is a generic 500. Detail stays in
    // the server log.
    const classified = classifyDbError(error);
    if (classified) {
      console.error('[founder/dashboard] DB error:', error?.code || error?.message);
      return NextResponse.json(
        { success: false, error: 'Dashboard data is temporarily unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unable to load dashboard data. Please try again.' },
      { status: 500 }
    );
  }
}