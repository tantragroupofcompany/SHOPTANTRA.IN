import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'revenue';
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const fromDate = fromStr ? new Date(fromStr) : new Date(new Date().setDate(new Date().getDate() - 30));
    const toDate = toStr ? new Date(toStr) : new Date();
    toDate.setHours(23, 59, 59, 999);

    // Fetch all orders within range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        buyer: true,
        seller: true,
        commission: true,
        items: true,
        shipments: {
          include: {
            courierPartner: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (type === 'revenue') {
      // Group by daily date
      const dailyMap: Record<string, any> = {};
      orders.forEach(order => {
        const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = {
            date: dateKey,
            revenue: 0,
            ordersCount: 0,
            commissionEarned: 0,
            avgOrderValue: 0,
          };
        }
        
        // Count paid/pending verification orders in revenue
        const isValid = ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING'].includes(order.paymentStatus);
        if (isValid) {
          dailyMap[dateKey].revenue += order.totalAmount;
          dailyMap[dateKey].ordersCount += 1;
          if (order.commission) {
            dailyMap[dateKey].commissionEarned += order.commission.commissionAmount;
          }
        }
      });

      const reportData = Object.values(dailyMap).map((row: any) => {
        row.avgOrderValue = row.ordersCount > 0 ? Math.round(row.revenue / row.ordersCount) : 0;
        row.commissionEarned = Math.round(row.commissionEarned);
        return row;
      }).sort((a, b) => b.date.localeCompare(a.date));

      return NextResponse.json({ success: true, data: reportData });
    }

    if (type === 'sellers') {
      const dailyMap: Record<string, any> = {};
      orders.forEach(order => {
        const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = {
            date: dateKey,
            sellersCount: 0,
            revenue: 0,
            commissionEarned: 0,
            sellersSet: new Set<string>(),
          };
        }

        const isValid = ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING'].includes(order.paymentStatus);
        if (isValid && order.sellerId) {
          dailyMap[dateKey].revenue += order.totalAmount;
          dailyMap[dateKey].sellersSet.add(order.sellerId);
          if (order.commission) {
            dailyMap[dateKey].commissionEarned += order.commission.commissionAmount;
          }
        }
      });

      const reportData = Object.values(dailyMap).map((row: any) => {
        row.sellersCount = row.sellersSet.size;
        row.commissionEarned = Math.round(row.commissionEarned);
        delete row.sellersSet;
        return row;
      }).sort((a, b) => b.date.localeCompare(a.date));

      return NextResponse.json({ success: true, data: reportData });
    }

    if (type === 'customers') {
      const customerMap: Record<string, any> = {};
      orders.forEach(order => {
        const buyerId = order.buyerId;
        if (!buyerId) return;

        if (!customerMap[buyerId]) {
          customerMap[buyerId] = {
            id: buyerId,
            name: order.buyer?.fullName || 'N/A',
            email: order.buyer?.email || 'N/A',
            phone: order.buyer?.phone || 'N/A',
            ordersCount: 0,
            totalSpent: 0,
          };
        }

        const isValid = ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING'].includes(order.paymentStatus);
        if (isValid) {
          customerMap[buyerId].ordersCount += 1;
          customerMap[buyerId].totalSpent += order.totalAmount;
        }
      });

      const reportData = Object.values(customerMap).sort((a: any, b: any) => b.totalSpent - a.totalSpent);
      return NextResponse.json({ success: true, data: reportData });
    }

    if (type === 'orders') {
      const reportData = orders.map(order => {
        const shipment = order.shipments[0];
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          date: new Date(order.createdAt).toISOString().split('T')[0],
          customerName: order.buyer?.fullName || 'N/A',
          customerEmail: order.buyer?.email || 'N/A',
          customerMobile: order.buyer?.phone || 'N/A',
          sellerName: order.seller?.storeName || 'N/A',
          itemsCount: order.items.length,
          totalAmount: order.totalAmount,
          commissionAmount: order.commission?.commissionAmount || Math.round(order.totalAmount * 0.10),
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod || 'COD',
          trackingNumber: shipment?.trackingNumber || order.shipments.find(s => s.trackingNumber)?.trackingNumber || 'N/A',
          carrier: shipment?.courierPartner?.name || 'Manual Speed Post',
        };
      });

      return NextResponse.json({ success: true, data: reportData });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate reports' },
      { status: 500 }
    );
  }
}
