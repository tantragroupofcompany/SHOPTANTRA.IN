import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';

export async function GET(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;
  const { userId } = guard;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers, totalSellers, totalOrders, totalProducts, totalRevenue,
      todayOrders, todayRevenue, todayNewUsers, todayNewSellers, todayPayments,
      pendingSellers, pendingProducts, completedOrders, cancelledOrders,
      refundOrders, outOfStockProducts,
      shippingReady, shippingShipped, shippingDelivered,
      openTickets, resolvedTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.seller.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { totalAmount: true } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.seller.count({ where: { createdAt: { gte: today } } }),
      prisma.payment.count({ where: { createdAt: { gte: today }, status: 'PAID' } }),
      prisma.seller.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.count({ where: { status: 'REFUNDED' } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    ]);

    const monthlyStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearlyStart = new Date(today.getFullYear(), 0, 1);

    const [monthlyRevenue, yearlyRevenue] = await Promise.all([
      prisma.order.aggregate({ where: { createdAt: { gte: monthlyStart } }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: yearlyStart } }, _sum: { totalAmount: true } }),
    ]);

    const topSellers = await prisma.seller.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, storeName: true, status: true, user: { select: { email: true } } },
    });

    const data = {
      today: {
        revenue: todayRevenue._sum.totalAmount || 0,
        orders: todayOrders,
        payments: todayPayments,
        newUsers: todayNewUsers,
        newSellers: todayNewSellers,
      },
      company: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
        yearlyRevenue: yearlyRevenue._sum.totalAmount || 0,
        totalOrders,
        completedOrders,
        pendingOrders: totalOrders - completedOrders - cancelledOrders - refundOrders,
        cancelledOrders,
        refundOrders,
      },
      marketplace: {
        totalProducts,
        approvedProducts: totalProducts - pendingProducts,
        pendingProducts,
        blockedProducts: 0,
        outOfStockProducts,
      },
      sellers: {
        total: totalSellers,
        approved: totalSellers - pendingSellers,
        pending: pendingSellers,
        rejected: 0,
        topSellers,
      },
      buyers: {
        total: totalUsers - totalSellers,
        newToday: todayNewUsers,
        active: 0,
      },
      payments: {
        totalCollected: totalRevenue._sum.totalAmount || 0,
        pendingSettlement: 0,
      },
      shipping: {
        ready: shippingReady,
        shipped: shippingShipped,
        delivered: shippingDelivered,
      },
      support: {
        open: openTickets,
        resolved: resolvedTickets,
      },
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Corporate dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Failed to load dashboard data' }, { status: 500 });
  }
}