import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get('awb') || '';
    const orderNumber = searchParams.get('order') || '';
    const phone = searchParams.get('phone') || '';

    if (awb) {
      const shipment = await prisma.shipment.findFirst({
        where: {
          OR: [
            { awbNumber: awb },
            { trackingNumber: awb },
            { shipmentNumber: awb },
          ],
        },
        include: {
          order: true,
          courierPartner: true,
          trackingUpdates: { orderBy: { timestamp: 'desc' } },
        },
      });

      if (shipment) {
        return NextResponse.json({
          success: true,
          data: {
            shipmentNumber: shipment.shipmentNumber,
            awbNumber: shipment.awbNumber,
            status: shipment.status,
            courierName: shipment.courierPartner?.name || 'India Post Speed Post',
            trackingLink: shipment.trackingLink || `https://www.indiapost.gov.in/_layouts/15/dop.indiapost.tracking/tracksp.aspx?txtTrckNo=${shipment.trackingNumber}`,
            codAmount: shipment.codAmount,
            weight: shipment.weight,
            orderNumber: shipment.order?.orderNumber,
            dispatchDate: shipment.dispatchDate,
            updates: shipment.trackingUpdates,
            estimatedDelivery: shipment.estimatedDelivery,
          },
        });
      }

      return NextResponse.json({ error: 'Shipment tracking information not found' }, { status: 404 });
    }

    if (orderNumber && phone) {
      const dbOrder = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: orderNumber },
            { id: orderNumber },
          ],
        },
        include: {
          shipments: {
            include: {
              courierPartner: true,
              trackingUpdates: { orderBy: { timestamp: 'desc' } },
            },
          },
        },
      });

      if (dbOrder) {
        const address = typeof dbOrder.shippingAddress === 'string' ? JSON.parse(dbOrder.shippingAddress) : dbOrder.shippingAddress;
        const addrPhone = (address?.phone || '').replace(/\D/g, '');
        const searchPhone = phone.replace(/\D/g, '');

        if (addrPhone.endsWith(searchPhone) || searchPhone.endsWith(addrPhone)) {
          return NextResponse.json({
            success: true,
            orderNumber: dbOrder.orderNumber,
            status: dbOrder.status,
            shipments: dbOrder.shipments.map((ship: any) => ({
              id: ship.id,
              shipmentNumber: ship.shipmentNumber,
              status: ship.status,
              awbNumber: ship.awbNumber,
              trackingNumber: ship.trackingNumber,
              courierName: ship.courierPartner?.name || 'India Post Speed Post',
              trackingLink: ship.trackingLink || `https://www.indiapost.gov.in/_layouts/15/dop.indiapost.tracking/tracksp.aspx?txtTrckNo=${ship.trackingNumber}`,
              dispatchDate: ship.dispatchDate,
              estimatedDelivery: ship.estimatedDelivery,
              updates: ship.trackingUpdates,
            })),
          });
        }

        return NextResponse.json({ error: 'Phone number verification failed. Please enter the phone number used during checkout.' }, { status: 403 });
      }

      return NextResponse.json({ error: 'Order not found. Please check the order number and try again.' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Missing query parameters. Provide AWB/Tracking Number, or Order ID + Phone' }, { status: 400 });
  } catch (error: any) {
    console.error('Error loading tracking data:', error);
    return NextResponse.json({ error: error.message || 'Tracking verification failed' }, { status: 500 });
  }
}