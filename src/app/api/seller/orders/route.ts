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

// GET /api/seller/orders
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

    const orders = await prisma.order.findMany({
      where: { sellerId },
      include: {
        buyer: true,
        items: {
          include: {
            product: true
          }
        },
        shipments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedOrders = orders.map(order => {
      let shippingAddressObj = null;
      if (order.shippingAddress) {
        try {
          shippingAddressObj = typeof order.shippingAddress === 'string'
            ? JSON.parse(order.shippingAddress)
            : order.shippingAddress;
        } catch (e) {
          console.warn('Failed to parse shipping address JSON:', e);
        }
      }

      const orderItems = order.items.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
        sku: item.product?.sku || 'N/A'
      }));

      const shipments = order.shipments.map(s => ({
        id: s.id,
        shipment_number: s.shipmentNumber,
        status: s.status.toLowerCase(),
        awb_number: s.awbNumber,
        tracking_number: s.trackingNumber,
        tracking_link: s.trackingLink,
        label_url: s.labelUrl
      }));

      return {
        id: order.id,
        order_number: order.orderNumber,
        buyer_name: order.buyer?.fullName || 'N/A',
        buyer_email: order.buyer?.email || 'N/A',
        buyer_phone: order.buyer?.phone || 'N/A',
        status: order.status.toLowerCase(),
        payment_status: order.paymentStatus.toLowerCase(),
        payment_method: order.paymentMethod,
        subtotal: order.subtotal,
        discount_amount: order.discountAmount,
        shipping_amount: order.shippingAmount,
        tax_amount: order.taxAmount,
        total_amount: order.totalAmount,
        shipping_address: shippingAddressObj,
        created_at: order.createdAt,
        order_items: orderItems,
        shipments: shipments
      };
    });

    return NextResponse.json({ success: true, data: formattedOrders });
  } catch (error: any) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/seller/orders
/**
 * Allowed fulfilment lifecycle for Order.status.
 *
 * This is the same set the rest of the app filters on (see /api/corporate/orders,
 * /api/analytics and the seller/admin order tables). Without this allow-list the
 * endpoint accepted any string, so a typo or a crafted request could write a
 * status that no filter matches — making the order invisible everywhere.
 */
const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'ACCEPTED',
  'PROCESSING',
  'PACKED',
  'PICKUP_SCHEDULED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED',
] as const;

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    const nextStatus = String(status).toUpperCase();
    if (!ORDER_STATUSES.includes(nextStatus as any)) {
      return NextResponse.json(
        { error: `Invalid order status "${status}". Allowed: ${ORDER_STATUSES.join(', ')}.` },
        { status: 400 }
      );
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        items: { select: { productId: true, quantity: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Restock when an order moves INTO the cancelled state.
    //
    // `orderProcessor` decrements Product.stock when the order is created, and
    // nothing put it back: rejecting/cancelling an order (seller "Reject Order"
    // -> status CANCELLED) left the units permanently removed from inventory, so
    // a cancelled order still consumed stock and the product could not be
    // re-sold. Guarded on the previous status so repeating the request is
    // idempotent and stock is never incremented twice.
    const wasCancelled = String(existing.status).toUpperCase() === 'CANCELLED';
    const isCancelling = nextStatus === 'CANCELLED';
    const shouldRestock = isCancelling && !wasCancelled;

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: nextStatus },
      });

      if (shouldRestock) {
        for (const item of existing.items) {
          if (!item.productId || item.quantity <= 0) continue;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return order;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      restocked: shouldRestock,
    });
  } catch (error: any) {
    console.error('Error updating order:', error?.code || error?.message);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
