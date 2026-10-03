import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';
import { classifyDbError } from '../../../../lib/authUtils';

// Order payment states that count towards live marketplace revenue
const PAID_PAYMENT_STATUSES = ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING'];

export async function GET(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    // Ensure additive marketplace schema exists before aggregations
    const { ensureSchema } = await import('../../../../lib/dbBootstrap');
    await ensureSchema();

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
      settlementStatusRaw,
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
      prisma.sellerSettlement.groupBy({ by: ['status'], _sum: { sellerAmount: true, commissionAmount: true, grossAmount: true } }).catch(() => []),
    ]);
// ---- Normalize grouping results into lookup maps ----
    // CASE NORMALISATION (why this is not cosmetic):
    //
    // `Product.status` is written UPPER-CASE by every writer in the app - the
    // corporate approval endpoint writes 'ACTIVE'/'REJECTED'/'BLOCKED'/'DRAFT',
    // the polyfill upper-cases on insert and update, and the Admin product
    // screen writes status: 'ACTIVE'. Sellers, orders and tickets are written
    // upper-case too.
    //
    // This map used to be keyed by the RAW stored string, while the product
    // lookups below asked for 'active' / 'pending' / 'draft' / 'rejected' /
    // 'blocked' (lower-case). Because Prisma's groupBy is case-SENSITIVE, every
    // one of those lookups missed and the dashboard reported a hard 0 for
    // approved / pending / rejected / blocked / draft products - and, because
    // `pendingApprovals.products` is derived from the same value, the
    // "Product approvals" card always read 0 even when products were awaiting
    // review. That is exactly the silent fake-zero this dashboard must never
    // show.
    //
    // Keys are now upper-cased so a legacy lower-case row (written before the
    // casing was standardised, or by a seller form posting 'draft') is counted
    // the same as its upper-case twin instead of vanishing from the metrics.
    const byStatus = (rows: any[]) => {
      const map: Record<string, number> = {};
      rows.forEach((row: any) => {
        const key = String(row.status ?? '').toUpperCase();
        if (!key) return;
        map[key] = (map[key] || 0) + (row._count._all || 0);
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

    // Gateway-wise collected amounts (case-insensitive on stored gateway names).
    // ShopTantra accepts payments through Razorpay and Cash on Delivery ONLY —
    // Cashfree and PhonePe were removed. Any legacy Payment row still carrying
    // one of those gateway strings is counted under `other` so the collected
    // total stays truthful instead of being silently dropped.
    const gatewaySums = { razorpay: 0, cod: 0, other: 0 };
    paidGatewayRaw.forEach((g: any) => {
      const key = (g.gateway || '').toUpperCase();
      const amount = g._sum.amount || 0;
      if (key.includes('RAZORPAY')) gatewaySums.razorpay += amount;
      else if (key.includes('COD')) gatewaySums.cod += amount;
      else gatewaySums.other += amount;
    });
    const totalCollected = Object.values(gatewaySums).reduce((acc, v) => acc + v, 0);

    // Seller settlement ledger aggregates (from SellerSettlement records)
    const settlementAmounts: Record<string, number> = {};
    const settlementCommission: Record<string, number> = {};
    (settlementStatusRaw || []).forEach((s: any) => {
      const st = s.status || 'PENDING';
      settlementAmounts[st] = (settlementAmounts[st] || 0) + (s._sum.sellerAmount || 0);
      settlementCommission[st] = (settlementCommission[st] || 0) + (s._sum.commissionAmount || 0);
    });
    const pendingSettlementTotal = (settlementAmounts['PENDING'] || 0) + (settlementAmounts['PROCESSING'] || 0);
    const settledTotal = settlementAmounts['TRANSFERRED'] || 0;
    const failedTransferTotal = settlementAmounts['FAILED'] || 0;
    const cancelledSettlementTotal = settlementAmounts['CANCELLED'] || 0;

    // Keys are UPPER-CASE (see byStatus above). 'APPROVED' is accepted as a
    // synonym of 'ACTIVE' so a row stored under either spelling is counted as
    // live rather than silently disappearing from the marketplace figures.
    const approvedProducts = (productCounts['ACTIVE'] || 0) + (productCounts['APPROVED'] || 0);
    const pendingProducts = productCounts['PENDING'] || 0;
    const blockedProducts = productCounts['BLOCKED'] || 0;
    const rejectedProducts = productCounts['REJECTED'] || 0;
    const draftProducts = productCounts['DRAFT'] || 0;

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
        cod: gatewaySums.cod,
        other: gatewaySums.other,
        commissionCollected: Number(commissionCollected._sum.commissionAmount || 0),
        totalPayments,
        sellerPayable: settledTotal + pendingSettlementTotal + failedTransferTotal + cancelledSettlementTotal,
        sellerSettled: settledTotal,
        pendingSettlementTotal,
        failedTransferTotal,
      },
      finance: {
        grossSales: Number(totalRevenue._sum.totalAmount || 0),
        platformCommission: Number(commissionCollected._sum.commissionAmount || 0) + (settlementCommission['PENDING'] || 0) + (settlementCommission['TRANSFERRED'] || 0),
        sellerPayable: settledTotal + pendingSettlementTotal + failedTransferTotal + cancelledSettlementTotal,
        sellerSettled: settledTotal,
        pendingSettlement: pendingSettlementTotal,
        failedTransfers: failedTransferTotal,
        refunds: paymentStatusAmounts['REFUNDED'] || 0,
        paymentGatewayFees: 0, // available only from Razorpay dashboard settlement statements
        commissionCollected: Number(commissionCollected._sum.commissionAmount || 0),
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

    // SECURITY / CORRECTNESS
    // This handler used to answer HTTP 200 with `success: false` and a body of
    // all zeroes. Two problems:
    //
    // 1. It shipped the raw Prisma/driver message (`error.message`) to the
    //    browser, which can disclose table names, the connection host and the
    //    shape of the schema.
    // 2. HTTP 200 + zeros is indistinguishable from a genuinely empty
    //    marketplace, so a database outage rendered as a real "0 users,
    //    0 orders" board. That is exactly the silent-zero failure the
    //    dashboards are required to avoid.
    //
    // It now answers a real 5xx with a generic message, and a known DB outage is
    // reported as 503 so an operator can tell it apart from a code defect. The
    // detail stays in the server log.
    const classified = classifyDbError(error);
    if (classified) {
      console.error('[corporate/dashboard] DB error:', error?.code || error?.message);
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