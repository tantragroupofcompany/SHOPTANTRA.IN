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

    // 4. Fetch counts from database
    let totalCustomers = 0;
    let totalSellers = 0;
    let totalProducts = 0;

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
    }

    // 5. Fetch Top Performing Products
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

    // 6. Fetch Top Performing Vendors (only relevant for admin dashboard)
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

    return NextResponse.json({
      success: true,
      data: {
        revenue: metrics,
        totalCustomers,
        totalSellers,
        totalProducts,
        topProducts,
        topVendors: sellerId ? undefined : topVendors,
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

