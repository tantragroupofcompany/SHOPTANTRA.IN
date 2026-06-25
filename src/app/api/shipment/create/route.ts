import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { autoSelectCourier } from '../../../../lib/courierService';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch Order details
    let order: any = null;
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    } catch (e) {
      console.error('Database error while retrieving order:', e);
      return NextResponse.json({ error: 'Database error while retrieving order' }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
    }

    const shippingAddress = typeof order.shippingAddress === 'string'
      ? JSON.parse(order.shippingAddress)
      : order.shippingAddress;
    const deliveryPincode = shippingAddress.pincode || '380001';

    // 2. Group items by Seller
    const itemsBySeller: Record<string, any[]> = {};
    order.items.forEach((item: any) => {
      const sellerId = item.product?.sellerId || order.sellerId || 'default-seller';
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      itemsBySeller[sellerId].push(item);
    });

    const createdShipments: any[] = [];

    // 3. For each seller group, create a Shipment
    for (const [sellerId, items] of Object.entries(itemsBySeller)) {
      // Retrieve Seller Address & Info from Database
      let pickupAddress: any = null;
      let sellerEmail = '';
      let sellerPhone = '';
      let sellerName = 'Seller';

      try {
        const seller = await prisma.seller.findUnique({
          where: { id: sellerId },
          include: { user: true, pickupAddress: true },
        });
        if (seller) {
          sellerEmail = seller.user?.email || sellerEmail;
          sellerPhone = seller.user?.phone || sellerPhone;
          sellerName = seller.storeName || sellerName;
          pickupAddress = seller.pickupAddress;
        }
      } catch (e) {
        console.warn(`Failed to fetch database pickup address for seller ${sellerId}`);
      }

      if (!pickupAddress) {
        pickupAddress = {
          storeName: sellerName,
          contactName: sellerName,
          phone: sellerPhone,
          email: sellerEmail,
          addressLine1: `Registered Business Address`,
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        };
      }

      // Calculate Shipment pricing and metrics
      const subtotal = items.reduce((acc, item) => acc + item.total, 0);
      const taxAmount = Math.round(subtotal * 0.18); // 18% GST mock
      const totalWeight = items.reduce((acc, item) => acc + (item.quantity * 0.5), 0); // 0.5kg per item mock
      const isCod = order.paymentMethod === 'COD' || order.paymentStatus === 'PENDING';
      const paymentMode = isCod ? 'COD' : 'PREPAID';
      const codAmount = isCod ? subtotal + taxAmount : 0;

      // Select carrier automatically
      const courierDetails = await autoSelectCourier({
        pickupPincode: pickupAddress.pincode,
        deliveryPincode,
        weight: totalWeight,
        paymentMode,
        codAmount,
      });

      // Generate India Post ST-IND Tracking ID
      const currentYear = new Date().getFullYear();
      const randTracking = Math.floor(1000 + Math.random() * 9000); // XXXX
      const trackingId = `ST-IND-${currentYear}${randTracking}`;

      // Save to database if online
      let shipment: any = null;
      try {
        shipment = await prisma.$transaction(async (tx) => {
          // Get or create courier partner (India Post default)
          let courierPartner = await tx.courierPartner.findUnique({
            where: { code: 'INDIA_POST' },
          });
          if (!courierPartner) {
            courierPartner = await tx.courierPartner.create({
              data: {
                name: 'India Post Speed Post',
                code: 'INDIA_POST',
                isActive: true,
                baseRatePrepaid: 40.0,
                baseRateCOD: 60.0,
              },
            });
          }

          // Create shipment
          const ship = await tx.shipment.create({
            data: {
              shipmentNumber: trackingId, // Use as shipment number as well
              orderId: order.id,
              sellerId,
              courierPartnerId: courierPartner.id,
              status: 'PENDING',
              awbNumber: trackingId,
              trackingNumber: trackingId,
              trackingLink: `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?id=${trackingId}`,
              labelUrl: courierDetails.shippingLabelUrl,
              codAmount,
              shippingCost: courierDetails.shippingCost,
              weight: totalWeight,
            },
          });

          // Link items
          for (const item of items) {
            await tx.orderItem.update({
              where: { id: item.id },
              data: { shipmentId: ship.id },
            });

            // Deduct inventory stock
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }

          // Create tracking updates
          await tx.trackingUpdate.createMany({
            data: [
              {
                shipmentId: ship.id,
                status: 'CONFIRMED',
                location: pickupAddress.city,
                message: `Shipment confirmed. Assigned to India Post Speed Post (Manual Mode). Print label and visit nearest post office.`,
              },
              {
                shipmentId: ship.id,
                status: 'PENDING_PICKUP',
                location: pickupAddress.city,
                message: `Awaiting seller dispatch from ${pickupAddress.storeName}. Seller will ship via India Post Speed Post.`,
              },
            ],
          });

          // Create invoice
          const invoiceNumber = `ST-INV-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;
          await tx.invoice.create({
            data: {
              invoiceNumber,
              shipmentId: ship.id,
              subtotal,
              taxAmount,
              totalAmount: subtotal + taxAmount,
            },
          });

          return ship;
        });
      } catch (err) {
        console.error('Shipment creation transaction failed:', err);
        return NextResponse.json({ error: 'Failed to create shipment in database' }, { status: 500 });
      }

      if (!shipment) {
        return NextResponse.json({ error: 'Shipment creation returned null' }, { status: 500 });
      }

      createdShipments.push(shipment);
    }

    return NextResponse.json({
      success: true,
      message: `Split shipment processed successfully. Generated ${createdShipments.length} shipment(s).`,
      shipments: createdShipments,
    });
  } catch (error: any) {
    console.error('Error creating split shipments:', error);
    return NextResponse.json({ error: error.message || 'Fulfillment error occurred' }, { status: 500 });
  }
}
