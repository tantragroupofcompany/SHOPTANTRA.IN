import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '../../../../middleware/index';
import { prisma } from '../../../../lib/prisma';

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
      prisma.product.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { totalAmount: true } }),
      prisma.product.count({ where: { status: 'active' } }),
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
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to load dashboard',
      metrics: {
        users: 0, sellers: 0, pendingSellers: 0, approvedSellers: 0,
        products: 0, pendingProducts: 0, approvedProducts: 0,
        orders: 0, todayOrders: 0, revenue: 0, todayRevenue: 0,
      },
    }, { status: 200 });
  }
}