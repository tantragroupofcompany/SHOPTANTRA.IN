import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';

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

      // Select courier partner and generate AWB via ShopTantra Master Shipping Account
      const courierDetails = await MasterCourierService.createShipment({
        orderId: order.id,
        sellerId,
        pickupAddress: {
          storeName: pickupAddress.storeName,
          contactName: pickupAddress.contactName,
          phone: pickupAddress.phone,
          email: pickupAddress.email,
          addressLine1: pickupAddress.addressLine1,
          addressLine2: pickupAddress.addressLine2,
          city: pickupAddress.city,
          state: pickupAddress.state,
          pincode: pickupAddress.pincode,
          country: pickupAddress.country,
          pickupLocationId: pickupAddress.pickupLocationId,
        },
        shippingAddress: {
          fullName: shippingAddress.full_name || shippingAddress.name || 'Recipient',
          phone: shippingAddress.phone || '9999999999',
          email: shippingAddress.email || 'customer@example.com',
          address: shippingAddress.address || 'Address Line 1',
          city: shippingAddress.city || 'City',
          state: shippingAddress.state || 'State',
          pincode: deliveryPincode,
          country: shippingAddress.country || 'India',
        },
        items: items.map(i => ({
          productId: i.productId,
          title: i.title,
          quantity: i.quantity,
          price: i.price,
          total: i.total,
        })),
        weight: totalWeight,
        isCod,
        codAmount,
      });

      const trackingId = courierDetails.awbNumber;
      const currentYear = new Date().getFullYear();

      // Save to database if online
      let shipment: any = null;
      try {
        shipment = await prisma.$transaction(async (tx) => {
          // Get or create courier partner dynamically
          let courierPartner = await tx.courierPartner.findUnique({
            where: { code: courierDetails.courierPartnerCode },
          });
          if (!courierPartner) {
            courierPartner = await tx.courierPartner.create({
              data: {
                name: courierDetails.courierPartnerName,
                code: courierDetails.courierPartnerCode,
                isActive: true,
                baseRatePrepaid: 45.0,
                baseRateCOD: 65.0,
              },
            });
          }

          // Create shipment
          const ship = await tx.shipment.create({
            data: {
              shipmentNumber: `SH-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`,
              orderId: order.id,
              sellerId,
              courierPartnerId: courierPartner.id,
              status: 'PENDING',
              awbNumber: courierDetails.awbNumber,
              trackingNumber: courierDetails.trackingNumber,
              trackingLink: courierDetails.trackingLink,
              labelUrl: courierDetails.labelUrl.replace('TEMP_ID', trackingId), // dynamically map label link
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
                message: `Shipment confirmed and registered on Master Account. AWB generated: ${courierDetails.awbNumber} via ${courierDetails.courierPartnerName}.`,
              },
              {
                shipmentId: ship.id,
                status: 'PENDING_PICKUP',
                location: pickupAddress.city,
                message: `Awaiting seller dispatch from ${pickupAddress.storeName} (${pickupAddress.city}).`,
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

          // Audit log transaction
          await MasterCourierService.logAction(tx, ship.id, 'AWB_GENERATED', sellerId, 'SELLER', {
            orderId: order.id,
            awbNumber: courierDetails.awbNumber,
            pickupLocationId: pickupAddress.pickupLocationId,
            carrier: courierDetails.courierPartnerName,
            cost: courierDetails.shippingCost,
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
