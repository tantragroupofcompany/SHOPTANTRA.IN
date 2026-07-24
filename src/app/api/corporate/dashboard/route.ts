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

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearlyStart = new Date(today.getFullYear(), 0, 1);

    const [
      totalUsers,
      totalSellers,
      totalOrders,
      totalProducts,
      totalRevenue,
      todayOrders,
      todayRevenue,
      todayNewUsers,
      todayNewSellers,
      todayPayments,
      pendingSellers,
      pendingProducts,
      completedOrders,
      cancelledOrders,
      refundOrders,
      outOfStockProducts,
      shippingReady,
      shippingShipped,
      shippingDelivered,
      openTickets,
      resolvedTickets,
      totalBuyers,
      activeBuyers,
      newBuyersToday,
      totalPayments,
      pendingPayments,
      failedPayments,
      refundPayments,
      razorpayRevenue,
      cashfreeRevenue,
      phonepeRevenue,
      codRevenue,
      commissionCollected,
      shippedOrders,
      inTransitOrders,
      returnedOrders,
      cancelledShipping,
      packedOrders,
      pendingTickets,
      totalBranches,
      totalEmployees,
      totalAdvertisements,
      totalCoupons,
      blockedProducts,
      draftProducts,
      rejectedProductsCount,
      blockedSellers,
      rejectedSellers,
      suspendedSellers,
      topProducts,
      topCategories,
      monthlyRevenue,
      yearlyRevenue,
      pendingApprovalSellers,
      visitorsToday,
      visitorsWeek,
      visitorsMonth,
      totalReviews,
      totalInventory,
      lowStockProducts,
      totalCategories,
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
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.user.count({ where: { role: 'BUYER', isActive: true } }),
      prisma.user.count({ where: { role: 'BUYER', createdAt: { gte: today } } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.count({ where: { status: 'REFUNDED' } }),
      prisma.payment.aggregate({ where: { gateway: 'Razorpay', status: 'PAID' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { gateway: 'Cashfree', status: 'PAID' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { gateway: 'PhonePe', status: 'PAID' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { gateway: 'COD', status: 'PAID' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
      prisma.order.count({ where: { status: 'RETURNED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.count({ where: { status: 'PACKED' } }),
      prisma.supportTicket.count({ where: { status: 'PENDING' } }),
      prisma.branch.count(),
      prisma.employee.count(),
      prisma.advertisement.count(),
      prisma.coupon.count(),
      prisma.product.count({ where: { status: 'blocked' } }),
      prisma.product.count({ where: { status: 'draft' } }),
      prisma.product.count({ where: { status: 'rejected' } }),
      prisma.seller.count({ where: { status: 'BLOCKED' } }),
      prisma.seller.count({ where: { status: 'REJECTED' } }),
      prisma.seller.count({ where: { status: 'SUSPENDED' } }),
      prisma.product.findMany({
        orderBy: { soldCount: 'desc' },
        take: 5,
        select: { id: true, title: true, soldCount: true, price: true },
      }),
      prisma.category.findMany({
        orderBy: { productCount: 'desc' },
        take: 5,
        select: { id: true, name: true, productCount: true },
      }),
      prisma.order.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: yearlyStart } }, _sum: { totalAmount: true } }),
      prisma.seller.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          storeName: true,
          status: true,
          createdAt: true,
          user: { select: { email: true, phone: true, fullName: true } },
        },
      }),
      prisma.visitor.count({ where: { createdAt: { gte: today } } }),
      prisma.visitor.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.visitor.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.review.count(),
      prisma.product.count({ where: { stock: { gt: 0 } } }),
      prisma.product.count({ where: { stock: { lte: 10 } } }),
      prisma.category.count(),
    ]);

    const productStatusRaw = await prisma.product.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const approvedProducts = productStatusRaw.find(p => p.status === 'active')?._count.id || 0;
    const rejectedProductsCountFinal = productStatusRaw.find(p => p.status === 'rejected')?._count.id || rejectedProductsCount;

    const sellerStatusRaw = await prisma.seller.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const approvedSellers = sellerStatusRaw.find(s => s.status === 'APPROVED')?._count.id || totalSellers - pendingSellers;
    const rejectedSellersFinal = sellerStatusRaw.find(s => s.status === 'REJECTED')?._count.id || rejectedSellers;

    const sellerNewWeek = await prisma.seller.count({ where: { createdAt: { gte: weekStart } } });
    const sellerNewMonth = await prisma.seller.count({ where: { createdAt: { gte: monthStart } } });

    const data = {
      today: {
        revenue: Number(todayRevenue._sum.totalAmount || 0),
        orders: todayOrders,
        payments: todayPayments,
        newUsers: todayNewUsers,
        newSellers: todayNewSellers,
        newBuyers: newBuyersToday,
      },
      company: {
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        monthlyRevenue: Number(monthlyRevenue._sum.totalAmount || 0),
        yearlyRevenue: Number(yearlyRevenue._sum.totalAmount || 0),
        totalOrders,
        completedOrders,
        pendingOrders: totalOrders - completedOrders - cancelledOrders - refundOrders,
        cancelledOrders,
        refundOrders,
      },
      marketplace: {
        totalProducts,
        approvedProducts,
        pendingProducts,
        blockedProducts,
        rejectedProducts: rejectedProductsCountFinal,
        outOfStockProducts,
        draftProducts,
        totalCategories,
        lowStockProducts,
        totalInventory,
      },
      sellers: {
        total: totalSellers,
        approved: approvedSellers,
        pending: pendingSellers,
        rejected: rejectedSellersFinal,
        suspended: suspendedSellers,
        blocked: blockedSellers,
        newToday: todayNewSellers,
        newThisWeek: sellerNewWeek,
        newThisMonth: sellerNewMonth,
        pendingApprovalSellers: pendingApprovalSellers || [],
        topSellers: [],
      },
      buyers: {
        total: totalBuyers,
        newToday: newBuyersToday,
        active: activeBuyers,
        inactive: totalBuyers - activeBuyers,
        topBuyers: [],
      },
      payments: {
        totalCollected: Number(totalRevenue._sum.totalAmount || 0),
        pendingSettlement: Number(pendingPayments || 0),
        failedPayments: Number(failedPayments || 0),
        refunds: Number(refundPayments || 0),
        razorpay: Number(razorpayRevenue._sum.amount || 0),
        cashfree: Number(cashfreeRevenue._sum.amount || 0),
        phonepe: Number(phonepeRevenue._sum.amount || 0),
        cod: Number(codRevenue._sum.amount || 0),
        commissionCollected: Number(commissionCollected._sum.amount || 0),
        totalPayments: totalPayments,
      },
      shipping: {
        ready: shippingReady,
        packed: packedOrders,
        shipped: shippedOrders,
        inTransit: inTransitOrders,
        delivered: shippingDelivered,
        returned: returnedOrders,
        cancelled: cancelledShipping,
      },
      support: {
        open: openTickets,
        resolved: resolvedTickets,
        pending: pendingTickets,
      },
      analytics: {
        topProducts: topProducts || [],
        topCategories: topCategories || [],
        revenueByMonth: [],
        ordersByMonth: [],
      },
      visitors: {
        today: visitorsToday,
        weekly: visitorsWeek,
        monthly: visitorsMonth,
      },
      business: {
        totalBranches,
        totalEmployees,
        totalAdvertisements,
        totalCoupons,
        totalReviews,
      },
      security: {
        failedLogins: 0,
        blockedAccounts: 0,
        corporateSessions: 0,
        recentLogins: 0,
        jwtStatus: 'Active',
      },
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Corporate dashboard error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to load dashboard data',
      data: {
        today: { revenue: 0, orders: 0, payments: 0, newUsers: 0, newSellers: 0, newBuyers: 0 },
        company: { totalRevenue: 0, monthlyRevenue: 0, yearlyRevenue: 0, totalOrders: 0, completedOrders: 0, pendingOrders: 0, cancelledOrders: 0, refundOrders: 0 },
        marketplace: { totalProducts: 0, approvedProducts: 0, pendingProducts: 0, blockedProducts: 0, rejectedProducts: 0, outOfStockProducts: 0, draftProducts: 0, totalCategories: 0, lowStockProducts: 0, totalInventory: 0 },
        sellers: { total: 0, approved: 0, pending: 0, rejected: 0, suspended: 0, blocked: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0, pendingApprovalSellers: [], topSellers: [] },
        buyers: { total: 0, newToday: 0, active: 0, inactive: 0, topBuyers: [] },
        payments: { totalCollected: 0, pendingSettlement: 0, failedPayments: 0, refunds: 0, razorpay: 0, cashfree: 0, phonepe: 0, cod: 0, commissionCollected: 0, totalPayments: 0 },
        shipping: { ready: 0, packed: 0, shipped: 0, inTransit: 0, delivered: 0, returned: 0, cancelled: 0 },
        support: { open: 0, resolved: 0, pending: 0 },
        analytics: { topProducts: [], topCategories: [], revenueByMonth: [], ordersByMonth: [] },
        visitors: { today: 0, weekly: 0, monthly: 0 },
        business: { totalBranches: 0, totalEmployees: 0, totalAdvertisements: 0, totalCoupons: 0, totalReviews: 0 },
        security: { failedLogins: 0, blockedAccounts: 0, corporateSessions: 0, recentLogins: 0, jwtStatus: 'Unknown' },
      }
    }, { status: 200 });
  }
}