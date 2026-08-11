import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';

// Order payment states that count towards live marketplace revenue
const PAID_PAYMENT_STATUSES = ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING'];

export async function GET(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearlyStart = new Date(today.getFullYear(), 0, 1);
    const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);

    const paidFilter = { paymentStatus: { in: PAID_PAYMENT_STATUSES } };

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
      outOfStockProducts,
      sellerStatusRaw,
      productStatusRaw,
      orderStatusRaw,
      paymentStatusRaw,
      paidGatewayRaw,
      supportStatusRaw,
      shipmentStatusRaw,
      totalBuyers,
      newBuyersToday,
      activeBuyerRows,
      totalPayments,
      commissionCollected,
      lowStockProducts,
      totalInventoryAgg,
      categoryRows,
      topProducts,
      topCategories,
      monthlyRevenue,
      yearlyRevenue,
      monthlySeries,
      weeklySellers,
      monthlySellers,
      pendingApprovalSellers,
      recentOrders,
      recentSellers,
      recentProducts,
      topSellerRows,
      totalCoupons,
      totalReviews,
      corporateSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.seller.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.aggregate({ where: paidFilter, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: today }, ...paidFilter }, _sum: { totalAmount: true } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.seller.count({ where: { createdAt: { gte: today } } }),
      prisma.payment.count({ where: { createdAt: { gte: today }, status: 'PAID' } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.seller.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.product.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.payment.groupBy({ by: ['status'], _count: { _all: true }, _sum: { amount: true } }),
      prisma.payment.groupBy({ by: ['gateway'], where: { status: 'PAID' }, _count: { _all: true }, _sum: { amount: true } }),
      prisma.supportTicket.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.shipment.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.user.count({ where: { role: 'BUYER', createdAt: { gte: today } } }),
      prisma.order.groupBy({ by: ['buyerId'] }),
      prisma.payment.count(),
      prisma.commission.aggregate({ where: { status: 'PROCESSED' }, _sum: { commissionAmount: true } }),
      prisma.product.count({ where: { stock: { lte: 10 } } }),
      prisma.product.aggregate({ _sum: { stock: true } }),
      prisma.product.groupBy({ by: ['category'] }),
      prisma.orderItem.groupBy({
        by: ['title'],
        where: { order: { paymentStatus: { in: PAID_PAYMENT_STATUSES } } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      prisma.product.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.order.aggregate({ where: { createdAt: { gte: monthStart }, ...paidFilter }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: yearlyStart }, ...paidFilter }, _sum: { totalAmount: true } }),
      prisma.order.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: twelveMonthsAgo }, ...paidFilter },
        _sum: { totalAmount: true },
        _count: { _all: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.seller.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.seller.count({ where: { createdAt: { gte: monthStart } } }),
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
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          buyer: { select: { fullName: true, email: true } },
          seller: { select: { storeName: true } },
          items: { select: { title: true, quantity: true }, take: 2 },
        },
      }),
      prisma.seller.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          storeName: true,
          status: true,
          city: true,
          createdAt: true,
          user: { select: { fullName: true, email: true, phone: true } },
        },
      }),
      prisma.product.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          price: true,
          status: true,
          stock: true,
          category: true,
          createdAt: true,
          seller: { select: { storeName: true } },
        },
      }),
      prisma.order.groupBy({
        by: ['sellerId'],
        where: { sellerId: { not: null }, ...paidFilter },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5,
      }),
      prisma.coupon.count(),
      prisma.review.count(),
      prisma.user.count({ where: { role: { in: ['FOUNDER', 'CEO_MD', 'CHAIRMAN'] } } }),
    ]);
// ---- Normalize grouping results into lookup maps ----
    const byStatus = (rows: any[]) => {
      const map: Record<string, number> = {};
      rows.forEach((row: any) => {
        map[row.status] = row._count._all || 0;
      });
      return map;
    };

    const sellerCounts = byStatus(sellerStatusRaw);
    const productCounts = byStatus(productStatusRaw);
    const orderCounts = byStatus(orderStatusRaw);
    const supportCounts = byStatus(supportStatusRaw);

    const paymentStatusCounts: Record<string, number> = {};
    const paymentStatusAmounts: Record<string, number> = {};
    paymentStatusRaw.forEach((p: any) => {
      paymentStatusCounts[p.status] = p._count._all || 0;
      paymentStatusAmounts[p.status] = p._sum.amount || 0;
    });

    // Gateway-wise collected amounts (case-insensitive on stored gateway names)
    const gatewaySums = { razorpay: 0, cashfree: 0, phonepe: 0, cod: 0, other: 0 };
    paidGatewayRaw.forEach((g: any) => {
      const key = (g.gateway || '').toUpperCase();
      const amount = g._sum.amount || 0;
      if (key.includes('RAZORPAY')) gatewaySums.razorpay += amount;
      else if (key.includes('CASHFREE')) gatewaySums.cashfree += amount;
      else if (key.includes('PHONEPE')) gatewaySums.phonepe += amount;
      else if (key.includes('COD')) gatewaySums.cod += amount;
      else gatewaySums.other += amount;
    });
    const totalCollected = Object.values(gatewaySums).reduce((acc, v) => acc + v, 0);

    const approvedProducts = productCounts['active'] || 0;
    const pendingProducts = productCounts['pending'] || 0;
    const blockedProducts = productCounts['blocked'] || 0;
    const rejectedProducts = productCounts['rejected'] || 0;
    const draftProducts = productCounts['draft'] || 0;

    const approvedSellers = (sellerCounts['ACTIVE'] || 0) + (sellerCounts['APPROVED'] || 0);
    const pendingSellers = sellerCounts['PENDING'] || 0;
    const rejectedSellers = sellerCounts['REJECTED'] || 0;
    const suspendedSellers = sellerCounts['SUSPENDED'] || 0;
    const blockedSellers = sellerCounts['BLOCKED'] || 0;

    const completedOrders = orderCounts['DELIVERED'] || 0;
    const cancelledOrders = orderCounts['CANCELLED'] || 0;
    const refundOrders = orderCounts['REFUNDED'] || 0;
    const readyOrders = (orderCounts['CONFIRMED'] || 0) + (orderCounts['PROCESSING'] || 0);
    const packedOrders = orderCounts['PACKED'] || 0;
    const shippedOrders = orderCounts['SHIPPED'] || 0;
    const inTransitOrders = orderCounts['OUT_FOR_DELIVERY'] || 0;
    const returnedOrders = orderCounts['RETURNED'] || 0;
    const deliveredOrders = completedOrders;

    const totalCategories = categoryRows.length;
    const totalInventory = Number(totalInventoryAgg._sum.stock || 0);
    const activeBuyers = activeBuyerRows.length;

    // Top selling stores (join store names for the top-seller ids)
    const topSellerIds = topSellerRows.map((t: any) => t.sellerId).filter(Boolean);
    const topSellerStores = topSellerIds.length
      ? await prisma.seller.findMany({
          where: { id: { in: topSellerIds } },
          select: { id: true, storeName: true },
        })
      : [];
    const storeNameById = new Map(topSellerStores.map((s) => [s.id, s.storeName]));
    const topSellers = topSellerRows
      .filter((t: any) => t.sellerId)
      .map((t: any) => ({
        id: t.sellerId,
        storeName: storeNameById.get(t.sellerId) || 'Unknown Store',
        sales: t._sum.totalAmount || 0,
      }));

    // Monthly revenue / order series (last 12 months)
    const monthBuckets: Record<string, { revenue: number; orders: number }> = {};
    monthlySeries.forEach((row: any) => {
      const d = new Date(row.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthBuckets[key]) monthBuckets[key] = { revenue: 0, orders: 0 };
      monthBuckets[key].revenue += row._sum.totalAmount || 0;
      monthBuckets[key].orders += row._count._all || 0;
    });
    const revenueByMonth = Object.entries(monthBuckets)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => ({
        month: new Date(`${key}-01`).toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: value.revenue,
        orders: value.orders,
      }));

    const pendingApprovals = {
      sellers: pendingSellers,
      products: pendingProducts,
      total: pendingSellers + pendingProducts,
    };
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
        rejectedProducts,
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
        rejected: rejectedSellers,
        suspended: suspendedSellers,
        blocked: blockedSellers,
        newToday: todayNewSellers,
        newThisWeek: weeklySellers,
        newThisMonth: monthlySellers,
        pendingApprovalSellers: pendingApprovalSellers || [],
        topSellers,
      },
      buyers: {
        total: totalBuyers,
        newToday: newBuyersToday,
        active: activeBuyers,
        inactive: Math.max(totalBuyers - activeBuyers, 0),
        topBuyers: [],
      },
      customers: {
        total: totalBuyers,
        newToday: newBuyersToday,
        active: activeBuyers,
        inactive: Math.max(totalBuyers - activeBuyers, 0),
      },
      payments: {
        totalCollected,
        pendingSettlement: paymentStatusCounts['PENDING'] || 0,
        failedPayments: paymentStatusCounts['FAILED'] || 0,
        refunds: paymentStatusAmounts['REFUNDED'] || 0,
        razorpay: gatewaySums.razorpay,
        cashfree: gatewaySums.cashfree,
        phonepe: gatewaySums.phonepe,
        cod: gatewaySums.cod,
        commissionCollected: Number(commissionCollected._sum.commissionAmount || 0),
        totalPayments,
      },
      shipping: {
        ready: readyOrders,
        packed: packedOrders,
        shipped: shippedOrders,
        inTransit: inTransitOrders,
        delivered: deliveredOrders,
        returned: returnedOrders,
        cancelled: cancelledOrders,
      },
      shipments: {
        total: shipmentStatusRaw.reduce((acc: number, s: any) => acc + (s._count._all || 0), 0),
        byStatus: Object.fromEntries(shipmentStatusRaw.map((s: any) => [s.status, s._count._all || 0])),
      },
      support: {
        open: supportCounts['OPEN'] || 0,
        resolved: supportCounts['RESOLVED'] || 0,
        pending: supportCounts['PENDING'] || 0,
      },
      analytics: {
        topProducts: topProducts.map((p: any) => ({
          id: p.title,
          title: p.title,
          soldCount: p._sum.quantity || 0,
          sales: p._sum.total || 0,
        })),
        topCategories: topCategories.map((c: any) => ({ name: c.category, productCount: c._count.id || 0 })),
        revenueByMonth,
        ordersByMonth: revenueByMonth.map((r) => ({ month: r.month, orders: r.orders })),
      },
      visitors: { today: 0, weekly: 0, monthly: 0 },
      business: {
        totalBranches: 0,
        totalEmployees: 0,
        totalAdvertisements: 0,
        totalCoupons,
        totalReviews,
      },
      security: {
        failedLogins: 0,
        blockedAccounts: 0,
        corporateSessions,
        recentLogins: 0,
        jwtStatus: 'Active',
      },
      pendingApprovals,
      recentOrders,
      recentSellers,
      recentProducts,
      totalUsers,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Corporate dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to load dashboard data',
        data: {
          today: { revenue: 0, orders: 0, payments: 0, newUsers: 0, newSellers: 0, newBuyers: 0 },
          company: { totalRevenue: 0, monthlyRevenue: 0, yearlyRevenue: 0, totalOrders: 0, completedOrders: 0, pendingOrders: 0, cancelledOrders: 0, refundOrders: 0 },
          marketplace: { totalProducts: 0, approvedProducts: 0, pendingProducts: 0, blockedProducts: 0, rejectedProducts: 0, outOfStockProducts: 0, draftProducts: 0, totalCategories: 0, lowStockProducts: 0, totalInventory: 0 },
          sellers: { total: 0, approved: 0, pending: 0, rejected: 0, suspended: 0, blocked: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0, pendingApprovalSellers: [], topSellers: [] },
          buyers: { total: 0, newToday: 0, active: 0, inactive: 0, topBuyers: [] },
          customers: { total: 0, newToday: 0, active: 0, inactive: 0 },
          payments: { totalCollected: 0, pendingSettlement: 0, failedPayments: 0, refunds: 0, razorpay: 0, cashfree: 0, phonepe: 0, cod: 0, commissionCollected: 0, totalPayments: 0 },
          shipping: { ready: 0, packed: 0, shipped: 0, inTransit: 0, delivered: 0, returned: 0, cancelled: 0 },
          shipments: { total: 0, byStatus: {} },
          support: { open: 0, resolved: 0, pending: 0 },
          analytics: { topProducts: [], topCategories: [], revenueByMonth: [], ordersByMonth: [] },
          visitors: { today: 0, weekly: 0, monthly: 0 },
          business: { totalBranches: 0, totalEmployees: 0, totalAdvertisements: 0, totalCoupons: 0, totalReviews: 0 },
          security: { failedLogins: 0, blockedAccounts: 0, corporateSessions: 0, recentLogins: 0, jwtStatus: 'Unknown' },
          pendingApprovals: { sellers: 0, products: 0, total: 0 },
          recentOrders: [],
          recentSellers: [],
          recentProducts: [],
          totalUsers: 0,
        },
      },
      { status: 200 }
    );
  }
}