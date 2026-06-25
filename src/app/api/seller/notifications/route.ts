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

    if (!sellerIdParam) {
      return NextResponse.json({ error: 'sellerId or userId query parameter is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(sellerIdParam);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Fetch seller settings to get read & deleted notification lists
    let settings = await prisma.sellerSettings.findUnique({
      where: { sellerId }
    });

    if (!settings) {
      settings = await prisma.sellerSettings.create({
        data: {
          sellerId,
          notificationPrefs: JSON.stringify({
            newOrders: true,
            lowStock: true,
            payments: true,
            reviews: true,
            emailNotifications: true,
            smsNotifications: false,
            readNotifications: [],
            deletedNotifications: []
          }),
          twoFaEnabled: false
        }
      });
    }

    // notificationPrefs holds readNotifications and deletedNotifications lists to avoid schema modifications
    let prefsObj: any = {};
    try {
      prefsObj = JSON.parse(settings.notificationPrefs);
    } catch (e) {
      prefsObj = {};
    }

    const readList: string[] = prefsObj.readNotifications || [];
    const deleteList: string[] = prefsObj.deletedNotifications || [];

    // 1. Fetch orders for this seller
    const orders = await prisma.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // 2. Fetch reviews for products belonging to this seller
    const products = await prisma.product.findMany({
      where: { sellerId },
      select: { id: true, title: true }
    });
    const productIds = products.map(p => p.id);

    const reviews = await prisma.review.findMany({
      where: { productId: { in: productIds } },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // 3. Fetch low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        sellerId,
        stock: { lte: 5 }
      },
      orderBy: { stock: 'asc' }
    });

    const notifications: any[] = [];

    // Add order notifications
    orders.forEach(order => {
      const ordId = `order-new-${order.id}`;
      if (!deleteList.includes(ordId)) {
        notifications.push({
          id: ordId,
          type: 'order',
          title: 'New Order Received',
          message: `You received a new order #${order.orderNumber} for ₹${order.totalAmount.toFixed(2)}`,
          read: readList.includes(ordId) || order.status !== 'PENDING',
          created_at: order.createdAt.toISOString()
        });
      }

      const shipId = `order-shipped-${order.id}`;
      if (order.status === 'SHIPPED' && !deleteList.includes(shipId)) {
        notifications.push({
          id: shipId,
          type: 'order',
          title: 'Order Shipped',
          message: `Order #${order.orderNumber} has been successfully shipped`,
          read: readList.includes(shipId),
          created_at: order.updatedAt.toISOString()
        });
      }

      const payId = `payment-received-${order.id}`;
      if (order.paymentStatus === 'PAID' && !deleteList.includes(payId)) {
        notifications.push({
          id: payId,
          type: 'payment',
          title: 'Payment Received',
          message: `Payment of ₹${order.totalAmount.toFixed(2)} received for order #${order.orderNumber}`,
          read: readList.includes(payId),
          created_at: order.updatedAt.toISOString()
        });
      }
    });

    // Add review notifications
    reviews.forEach(review => {
      const revId = `review-${review.id}`;
      if (!deleteList.includes(revId)) {
        notifications.push({
          id: revId,
          type: 'review',
          title: 'New Product Review',
          message: `Customer ${review.user?.fullName || 'User'} gave your product a ${review.rating}-star review: "${review.comment}"`,
          read: readList.includes(revId),
          created_at: review.createdAt.toISOString()
        });
      }
    });

    // Add low stock alerts
    lowStockProducts.forEach(prod => {
      const stockId = `low-stock-${prod.id}-${prod.stock}`;
      if (!deleteList.includes(stockId)) {
        notifications.push({
          id: stockId,
          type: 'system',
          title: 'Low Stock Alert',
          message: `Product "${prod.title}" is running low on stock (${prod.stock} left)`,
          read: readList.includes(stockId),
          created_at: new Date().toISOString()
        });
      }
    });

    // Sort notifications by date
    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('Error generating notifications:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sellerId: sellerIdParam, userId, action, notificationId } = body;

    const idToResolve = sellerIdParam || userId;
    if (!idToResolve) {
      return NextResponse.json({ error: 'sellerId or userId is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(idToResolve);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    let settings = await prisma.sellerSettings.findUnique({
      where: { sellerId }
    });

    if (!settings) {
      settings = await prisma.sellerSettings.create({
        data: {
          sellerId,
          notificationPrefs: JSON.stringify({
            newOrders: true,
            lowStock: true,
            payments: true,
            reviews: true,
            emailNotifications: true,
            smsNotifications: false,
            readNotifications: [],
            deletedNotifications: []
          }),
          twoFaEnabled: false
        }
      });
    }

    let prefsObj: any = {};
    try {
      prefsObj = JSON.parse(settings.notificationPrefs);
    } catch (e) {
      prefsObj = {};
    }

    if (!prefsObj.readNotifications) prefsObj.readNotifications = [];
    if (!prefsObj.deletedNotifications) prefsObj.deletedNotifications = [];

    if (action === 'read') {
      if (notificationId && !prefsObj.readNotifications.includes(notificationId)) {
        prefsObj.readNotifications.push(notificationId);
      }
    } else if (action === 'read_all') {
      const { ids } = body;
      if (Array.isArray(ids)) {
        ids.forEach((id: string) => {
          if (!prefsObj.readNotifications.includes(id)) {
            prefsObj.readNotifications.push(id);
          }
        });
      }
    } else if (action === 'delete') {
      if (notificationId && !prefsObj.deletedNotifications.includes(notificationId)) {
        prefsObj.deletedNotifications.push(notificationId);
      }
    } else if (action === 'delete_all') {
      const { ids } = body;
      if (Array.isArray(ids)) {
        ids.forEach((id: string) => {
          if (!prefsObj.deletedNotifications.includes(id)) {
            prefsObj.deletedNotifications.push(id);
          }
        });
      }
    }

    await prisma.sellerSettings.update({
      where: { sellerId },
      data: {
        notificationPrefs: JSON.stringify(prefsObj)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error handling notification:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
