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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');
    const fromDateParam = searchParams.get('fromDate');
    const toDateParam = searchParams.get('toDate');

    if (!sellerIdParam) {
      return NextResponse.json({ error: 'sellerId or userId query parameter is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(sellerIdParam);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Default to last 30 days if dates not provided
    const toDate = toDateParam ? new Date(`${toDateParam}T23:59:59.999Z`) : new Date();
    const fromDate = fromDateParam ? new Date(`${fromDateParam}T00:00:00.000Z`) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch orders within date range for this seller
    const orders = await prisma.order.findMany({
      where: {
        sellerId,
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    let revenue = 0;
    let totalUnits = 0;
    const categoryMap = new Map<string, number>();
    const productMap = new Map<string, { title: string; units: number; revenue: number }>();
    const statusMap = new Map<string, number>();

    orders.forEach(order => {
      // Only count paid or non-cancelled orders for revenue if appropriate,
      // but let's calculate based on order total for general sales report.
      const orderAmount = order.totalAmount || 0;
      if (order.status !== 'CANCELLED') {
        revenue += orderAmount;
      }

      order.items.forEach(item => {
        if (order.status !== 'CANCELLED') {
          totalUnits += item.quantity || 0;
        }
        const itemRevenue = (item.price || 0) * (item.quantity || 0);

        // Category breakdown
        const categoryName = item.product?.category || 'Uncategorized';
        if (order.status !== 'CANCELLED') {
          categoryMap.set(
            categoryName,
            (categoryMap.get(categoryName) || 0) + itemRevenue
          );
        }

        // Top products
        const productId = item.productId;
        if (productId && order.status !== 'CANCELLED') {
          const existing = productMap.get(productId) || { title: item.title || 'Unknown', units: 0, revenue: 0 };
          productMap.set(productId, {
            title: existing.title,
            units: existing.units + (item.quantity || 0),
            revenue: existing.revenue + itemRevenue
          });
        }
      });

      // Order status count
      const statusKey = order.status.toLowerCase();
      statusMap.set(statusKey, (statusMap.get(statusKey) || 0) + 1);
    });

    // Process category sales
    const totalCategoryRevenue = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
    const categorySales = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      revenue: amount,
      percentage: totalCategoryRevenue > 0 ? (amount / totalCategoryRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);

    // Process top products
    const topProducts = Array.from(productMap.entries()).map(([id, data]) => ({
      id,
      title: data.title,
      unitsSold: data.units,
      revenue: data.revenue
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Process status counts
    const orderStatusData = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count
    }));

    const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;

    const data = {
      revenue,
      orders: orders.length,
      productsSold: totalUnits,
      avgOrderValue,
      categorySales,
      topProducts,
      orderStatusData
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error generating sales report:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
