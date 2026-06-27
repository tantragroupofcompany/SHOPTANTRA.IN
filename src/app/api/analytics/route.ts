import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId'); // Optional: filter by seller for vendor dashboard analytics

    // Resolve user ID or seller profile ID to seller profile ID
    let sellerId = sellerIdParam;
    if (sellerIdParam) {
      const associatedSeller = await prisma.seller.findFirst({
        where: {
          OR: [
            { id: sellerIdParam },
            { userId: sellerIdParam }
          ]
        }
      });
      if (associatedSeller) {
        sellerId = associatedSeller.id;
      }
    }

    // 1. Setup date ranges for aggregations
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Fix startOfWeek to avoid mutating the now object directly
    const tempDate = new Date(now);
    const startOfWeek = new Date(tempDate.setDate(tempDate.getDate() - tempDate.getDay()));
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const filter: any = {};
    if (sellerId) {
      filter.sellerId = sellerId;
    }

    // 2. Fetch active orders (paid or pending confirmation in launch mode)
    const orders = await prisma.order.findMany({
      where: {
        ...filter,
        paymentStatus: {
          in: ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING'],
        },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    // 3. Compute revenue metrics (daily, weekly, monthly, yearly, total)
    const metrics = orders.reduce(
      (acc, order) => {
        const orderDate = new Date(order.createdAt);
        acc.totalRevenue += order.totalAmount;
        acc.totalOrders += 1;

        if (orderDate >= startOfToday) {
          acc.dailyRevenue += order.totalAmount;
        }
        if (orderDate >= startOfWeek) {
          acc.weeklyRevenue += order.totalAmount;
        }
        if (orderDate >= startOfMonth) {
          acc.monthlyRevenue += order.totalAmount;
        }
        if (orderDate >= startOfYear) {
          acc.yearlyRevenue += order.totalAmount;
        }
        return acc;
      },
      {
        totalRevenue: 0,
        totalOrders: 0,
        dailyRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
      }
    );

    // 4. Fetch counts and statistics from database
    let totalCustomers = 0;
    let totalSellers = 0;
    let totalProducts = 0;

    let totalCommissionEarned = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let refundRequests = 0;
    let activeSellers = 0;
    let newSellersToday = 0;
    let totalWithdrawalsAmount = 0;

    const locationSalesMap: Record<string, any> = {};

    let codOrdersCount = 0;
    let codOrdersRevenue = 0;
    let onlineOrdersCount = 0;
    let onlineOrdersRevenue = 0;
    let pendingPaymentsCount = 0;
    let pendingPaymentsAmount = 0;
    let successfulPaymentsCount = 0;
    let successfulPaymentsAmount = 0;
    let failedPaymentsCount = 0;
    let failedPaymentsAmount = 0;
    let totalRefundsAmount = 0;

    if (sellerId) {
      totalProducts = await prisma.product.count({ where: { sellerId } });
      totalSellers = 1;
      const buyerGroup = await prisma.order.groupBy({
        by: ['buyerId'],
        where: { sellerId },
      });
      totalCustomers = buyerGroup.length;
    } else {
      totalCustomers = await prisma.user.count({ where: { role: 'BUYER' } });
      totalSellers = await prisma.seller.count();
      totalProducts = await prisma.product.count();
      activeSellers = await prisma.seller.count({ where: { status: 'ACTIVE' } });
      
      newSellersToday = await prisma.seller.count({
        where: {
          createdAt: { gte: startOfToday }
        }
      });

      refundRequests = await prisma.supportTicket.count({
        where: {
          type: { in: ['REFUND', 'RETURN'] },
          status: { notIn: ['RESOLVED', 'CLOSED'] }
        }
      });

      const totalWithdrawals = await prisma.payoutRequest.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true }
      });
      totalWithdrawalsAmount = totalWithdrawals._sum.amount || 0;

      const commissionsAgg = await prisma.commission.aggregate({
        _sum: { commissionAmount: true }
      });
      totalCommissionEarned = commissionsAgg._sum.commissionAmount || 0;
    }

    // 5. Loop over all orders to aggregate detailed statistics
    const allDbOrders = await prisma.order.findMany({
      where: sellerId ? { sellerId } : undefined,
      include: {
        commission: true,
        seller: {
          select: { storeName: true }
        },
        items: true,
      }
    });

    allDbOrders.forEach(order => {
      // Order status
      if (['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status)) {
        pendingOrders++;
      } else if (order.status === 'DELIVERED') {
        completedOrders++;
      } else if (order.status === 'CANCELLED') {
        cancelledOrders++;
      } else if (order.status === 'REFUNDED') {
        totalRefundsAmount += order.totalAmount;
      }

      // Payments breakdown
      if (order.isCod || order.paymentMethod?.toUpperCase() === 'COD') {
        codOrdersCount++;
        codOrdersRevenue += order.totalAmount;
      } else {
        onlineOrdersCount++;
        onlineOrdersRevenue += order.totalAmount;
      }

      if (order.paymentStatus === 'PAID') {
        successfulPaymentsCount++;
        successfulPaymentsAmount += order.totalAmount;
      } else if (order.paymentStatus === 'FAILED') {
        failedPaymentsCount++;
        failedPaymentsAmount += order.totalAmount;
      } else {
        pendingPaymentsCount++;
        pendingPaymentsAmount += order.totalAmount;
      }

      // Location Analytics (aggregate by shipping address details)
      let shipping: any = {};
      try {
        shipping = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress || {});
      } catch (e) {
        console.warn('Failed to parse shipping address JSON in analytics route:', e);
      }

      const country = shipping.country || 'India';
      const state = shipping.state || 'N/A';
      const city = shipping.city || 'N/A';
      const pincode = shipping.pincode || 'N/A';
      const district = shipping.district || city;

      const locationKey = `${country}_${state}_${city}_${pincode}`.toLowerCase();
      if (!locationSalesMap[locationKey]) {
        locationSalesMap[locationKey] = {
          country,
          state,
          district,
          city,
          pincode,
          ordersCount: 0,
          revenue: 0,
          commission: 0,
          sellers: {},
          products: {}
        };
      }

      const loc = locationSalesMap[locationKey];
      loc.ordersCount++;
      loc.revenue += order.totalAmount;
      if (order.commission) {
        loc.commission += order.commission.commissionAmount;
      }

      if (order.sellerId && order.seller) {
        const storeName = order.seller.storeName;
        loc.sellers[storeName] = (loc.sellers[storeName] || 0) + order.totalAmount;
      }

      order.items.forEach(item => {
        loc.products[item.title] = (loc.products[item.title] || 0) + item.quantity;
      });
    });

    const locationAnalytics = Object.values(locationSalesMap).map(loc => {
      let topSellerName = 'N/A';
      let maxSellerSales = 0;
      Object.keys(loc.sellers).forEach(store => {
        if (loc.sellers[store] > maxSellerSales) {
          maxSellerSales = loc.sellers[store];
          topSellerName = store;
        }
      });

      let topProductName = 'N/A';
      let maxProductUnits = 0;
      Object.keys(loc.products).forEach(prod => {
        if (loc.products[prod] > maxProductUnits) {
          maxProductUnits = loc.products[prod];
          topProductName = prod;
        }
      });

      return {
        country: loc.country,
        state: loc.state,
        district: loc.district,
        city: loc.city,
        pincode: loc.pincode,
        ordersCount: loc.ordersCount,
        revenue: Math.round(loc.revenue),
        commission: Math.round(loc.commission),
        topSeller: topSellerName,
        topProduct: topProductName
      };
    });

    // 6. Fetch Top Performing Products
    const items = await prisma.orderItem.findMany({
      where: sellerId ? { order: { sellerId } } : undefined,
      select: {
        title: true,
        price: true,
        quantity: true,
        total: true,
      },
    });

    const productSalesMap = items.reduce((acc: any, item) => {
      if (!acc[item.title]) {
        acc[item.title] = { name: item.title, sales: 0, units: 0 };
      }
      acc[item.title].sales += item.total;
      acc[item.title].units += item.quantity;
      return acc;
    }, {});

    const topProducts = Object.values(productSalesMap)
      .sort((a: any, b: any) => b.sales - a.sales)
      .slice(0, 5);

    // 7. Fetch Top Performing Vendors (only relevant for admin dashboard)
    let topVendors: any[] = [];
    if (!sellerId) {
      const commissions = await prisma.commission.findMany({
        select: {
          orderAmount: true,
          commissionAmount: true,
          sellerPayout: true,
          seller: {
            select: {
              storeName: true,
            },
          },
        },
      });

      const vendorMap = commissions.reduce((acc: any, comm) => {
        if (!comm.seller) return acc;
        const storeName = comm.seller.storeName;
        if (!acc[storeName]) {
          acc[storeName] = { name: storeName, sales: 0, platformCommission: 0 };
        }
        acc[storeName].sales += comm.orderAmount;
        acc[storeName].platformCommission += comm.commissionAmount;
        return acc;
      }, {});

      topVendors = Object.values(vendorMap)
        .sort((a: any, b: any) => b.sales - a.sales)
        .slice(0, 5);
    }

    // 8. Fetch Seller Payout History (recent withdrawals)
    const payoutHistory = await prisma.payoutRequest.findMany({
      where: sellerId ? { sellerId } : undefined,
      take: 10,
      include: {
        seller: {
          select: { storeName: true }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        revenue: metrics,
        totalCustomers,
        totalSellers,
        totalProducts,
        topProducts,
        topVendors: sellerId ? undefined : topVendors,
        payoutHistory,
        locationAnalytics: sellerId ? undefined : locationAnalytics,
        extra: sellerId ? undefined : {
          totalCommissionEarned,
          pendingOrders,
          completedOrders,
          cancelledOrders,
          refundRequests,
          activeSellers,
          newSellersToday,
          totalWithdrawalsAmount,
          payments: {
            codCount: codOrdersCount,
            codRevenue: codOrdersRevenue,
            onlineCount: onlineOrdersCount,
            onlineRevenue: onlineOrdersRevenue,
            pendingCount: pendingPaymentsCount,
            pendingAmount: pendingPaymentsAmount,
            successfulCount: successfulPaymentsCount,
            successfulAmount: successfulPaymentsAmount,
            failedCount: failedPaymentsCount,
            failedAmount: failedPaymentsAmount,
            refundsAmount: totalRefundsAmount
          }
        }
      },
    });
  } catch (error: any) {
    console.error('Error generating platform analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate analytics data' },
      { status: 500 }
    );
  }
}

