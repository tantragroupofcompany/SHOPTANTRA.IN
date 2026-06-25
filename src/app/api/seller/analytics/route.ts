import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Helper to resolve user ID or seller profile ID to seller profile ID
async function resolveSellerId(id: string | null): Promise<string | null> {
  if (!id) return null;
  let seller = await prisma.seller.findFirst({
    where: {
      OR: [
        { id: id },
        { userId: id }
      ]
    }
  });
  if (!seller) {
    seller = await prisma.seller.findFirst({
      where: { status: 'ACTIVE' }
    });
  }
  return seller ? seller.id : null;
}

// GET /api/seller/analytics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');

    if (!sellerIdParam) {
      return NextResponse.json({ error: 'sellerId or userId query parameter is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(sellerIdParam);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Call existing analytics helper logic or query directly
    const orders = await prisma.order.findMany({
      where: {
        sellerId,
        paymentStatus: {
          in: ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING']
        }
      },
      select: {
        totalAmount: true,
        createdAt: true
      }
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tempDate = new Date(now);
    const startOfWeek = new Date(tempDate.setDate(tempDate.getDate() - tempDate.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

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
        yearlyRevenue: 0
      }
    );

    const totalProducts = await prisma.product.count({ where: { sellerId } });
    const buyerGroup = await prisma.order.groupBy({
      by: ['buyerId'],
      where: { sellerId }
    });
    const totalCustomers = buyerGroup.length;

    const data = {
      revenue: metrics,
      totalProducts,
      totalCustomers
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
