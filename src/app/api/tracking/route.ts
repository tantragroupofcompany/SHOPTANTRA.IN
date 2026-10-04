import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { classifyDbError } from '../../../lib/authUtils';

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
        select: {
          id: true,
          shipmentNumber: true,
          awbNumber: true,
          trackingNumber: true,
          status: true,
          codAmount: true,
          weight: true,
          dispatchDate: true,
          trackingLink: true,
          courierPartner: { select: { name: true } },
          // Only the order NUMBER is returned below. Selecting the whole order
          // row would pull the buyer's address, totals and buyer link into
          // memory on an unauthenticated endpoint for no reason.
          //
          // NOTE: `estimatedDelivery` is deliberately absent — it is NOT a column
          // on Shipment in the Prisma schema. It was previously read off an
          // `include`, where a missing key silently yielded `undefined`. Naming
          // it in a `select` makes Prisma THROW at runtime and turned this public
          // endpoint into a 500, so it must stay out of the select entirely.
          order: { select: { orderNumber: true } },
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
            // Honest: the carrier is only known once a shipment record exists.
            courierName: shipment.courierPartner?.name || 'Carrier not assigned',
            trackingLink: shipment.trackingLink || `https://www.indiapost.gov.in/_layouts/15/dop.indiapost.tracking/tracksp.aspx?txtTrckNo=${shipment.trackingNumber}`,
            codAmount: shipment.codAmount,
            weight: shipment.weight,
            orderNumber: shipment.order?.orderNumber,
            dispatchDate: shipment.dispatchDate,
            updates: shipment.trackingUpdates,
            // `estimatedDelivery` is not a Shipment column; see the note above.
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
              courierName: ship.courierPartner?.name || 'Carrier not assigned',
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
    // This route is PUBLIC, so a raw Prisma/Postgres message (which can name the
    // database user, the connector and the SQL) must never reach the caller.
    console.error('[tracking] DB error:', error?.code || error?.message);
    const classified = classifyDbError(error);
    if (classified) {
      return NextResponse.json({ error: classified }, { status: 503 });
    }
    return NextResponse.json({ error: 'Tracking verification failed. Please try again.' }, { status: 500 });
  }
}