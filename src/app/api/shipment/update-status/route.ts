import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';

/**
 * The only status transitions an operator may record. Anything else is rejected
 * so a typo (or a crafted request) cannot push an order into an arbitrary state
 * such as DELIVERED, which flips the payment row to COD_COLLECTED.
 */
const ALLOWED_STATUSES = new Set([
  'CONFIRMED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RTO',
  'RETURNED',
]);

export async function POST(request: Request) {
  try {
    const { shipmentId, status, trackingNumber, dispatchDate, location, message } = await request.json();

    if (!shipmentId || !status) {
      return NextResponse.json({ error: 'Shipment ID and status are required' }, { status: 400 });
    }

    const nextStatus = String(status).toUpperCase();
    if (!ALLOWED_STATUSES.has(nextStatus)) {
      return NextResponse.json(
        { error: `Invalid shipment status "${String(status).slice(0, 40)}".` },
        { status: 400 }
      );
    }

    // 1. Fetch current shipment details
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const awb = trackingNumber || shipment.awbNumber || shipment.shipmentNumber;

    // 2. Perform updates inside a transaction to ensure atomic consistency
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: nextStatus,
        updatedAt: new Date()
      };

      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
        updateData.awbNumber = trackingNumber;
        // Do NOT guess a carrier tracking URL. The previous code always built an
        // India Post link, but ShopTantra ships through Shipping Xpress, so every
        // "Track parcel" button sent the buyer to a postal site that cannot know
        // the AWB. We store the number and leave the link unset unless the
        // configured provider publishes a tracking URL template.
        const trackingUrlTemplate = process.env.SHIPPING_XPRESS_TRACKING_URL_TEMPLATE;
        if (trackingUrlTemplate) {
          updateData.trackingLink = trackingUrlTemplate.includes('{awb}')
            ? trackingUrlTemplate.replace('{awb}', encodeURIComponent(trackingNumber))
            : trackingUrlTemplate;
        }
      }

      if (dispatchDate) {
        updateData.dispatchDate = dispatchDate;
      }

      // Update shipment
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: updateData,
      });

      // Sync the order status with the shipment.
      //
      // Payment is deliberately NOT auto-asserted as collected. Marking a parcel
      // DELIVERED does not prove the COD amount was actually handed over — the
      // buyer's courier could pay later, or not at all. Previously this route
      // flipped the order and payment rows to COD_COLLECTED and the commission to
      // SETTLEMENT_PENDING on the strength of one click, which started seller
      // payouts for money that may never have been collected. The payment row is
      // now only advanced when the order really is a COD order, and even then it
      // is left for an admin to confirm the cash was received.
      const isCodOrder =
        String(shipment.order.paymentMethod || '').toUpperCase() === 'COD' ||
        shipment.order.paymentStatus === 'COD_PENDING' ||
        shipment.order.paymentStatus === 'COD_COLLECTED';

      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          status: nextStatus,
          updatedAt: new Date()
        }
      });

      const warnings: string[] = [];

      if (nextStatus === 'DELIVERED' && !isCodOrder) {
        warnings.push(
          'This is not a COD order, so no payment status was changed. Mark the payment ' +
          'as captured only once the gateway confirms it.'
        );
      }

      // Construct update message
      let statusMessage = message;
      if (!statusMessage) {
        if (nextStatus === 'PACKED') {
          statusMessage = 'Parcel successfully packed and ready for dispatch.';
        } else if (nextStatus === 'SHIPPED') {
          const formattedDate = dispatchDate ? new Date(dispatchDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
          statusMessage = `Dispatched via courier partner on ${formattedDate}. AWB: ${awb}`;
        } else if (nextStatus === 'OUT_FOR_DELIVERY') {
          statusMessage = 'Parcel is out for delivery with the local courier associate.';
        } else if (nextStatus === 'DELIVERED') {
          statusMessage = 'Parcel marked delivered. Verify with the courier before confirming COD collection.';
        } else if (nextStatus === 'CANCELLED') {
          statusMessage = 'Shipment cancelled.';
        } else {
          statusMessage = `Shipment status updated to ${nextStatus}.`;
        }
      }

      // Log tracking history. `location` is operator-supplied; when omitted we say
      // "not reported" instead of the invented "Transit Hub" the old code used,
      // which implied the parcel had physically passed through a sorting facility.
      const eventLocation = location || 'Location not reported';
      const trackingUpdate = await tx.trackingUpdate.create({
        data: {
          shipmentId,
          status: nextStatus,
          location: eventLocation,
          message: statusMessage,
          timestamp: new Date()
        }
      });

      // Log shipment audit log
      await MasterCourierService.logAction(tx, shipment.id, `STATUS_${nextStatus}`, shipment.sellerId, 'SELLER', {
        awbNumber: awb,
        status: nextStatus,
        location: eventLocation,
        message: statusMessage
      });

      return { shipment: updatedShipment, trackingUpdate, warnings };
    });

    return NextResponse.json({
      success: true,
      message: `Shipment status updated to ${nextStatus} successfully.`,
      ...(result.warnings.length ? { warnings: result.warnings } : {}),
      data: { shipment: result.shipment, trackingUpdate: result.trackingUpdate }
    });

  } catch (error: any) {
    console.error('Error updating shipment status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update shipment status' },
      { status: 500 }
    );
  }
}
