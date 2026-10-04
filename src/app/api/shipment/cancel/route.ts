import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';
import { requireShipmentAccess } from '../../../../lib/sellerAuth';

export async function POST(request: Request) {
  try {
    // The body-supplied userId/role are untrusted and no longer used for the
    // audit trail; strip them so they cannot be mistaken for the actor.
    const { shipmentId } = await request.json();

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
    }

    // AUTHORIZATION: this route cancels an order AND increments stock back into
    // inventory. It previously had no authentication at all, so an anonymous
    // caller could cancel any customer's order by id and inflate stock. The
    // actor is now derived from the verified session, never from the body.
    const access = await requireShipmentAccess(request, shipmentId);
    if (!access.ok) return access.response;
    const actorUserId = access.userId || 'SYSTEM';
    const actorRole = access.role;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Guard against a double restock. This route returns stock to the seller, so a
    // second call (double click, retry, replayed request) would inflate inventory.
    // The previous version re-ran the increment every time.
    if (String(shipment.status).toUpperCase() === 'CANCELLED') {
      return NextResponse.json(
        {
          success: true,
          alreadyCancelled: true,
          message:
            'This shipment was already cancelled. No stock was returned a second time.',
          data: shipment,
        },
        { status: 200 }
      );
    }

    // Ask the carrier to void the AWB.
    //
    // The carrier exposes no cancellation endpoint (verified HTTP 404), so
    // `cancelShipment` now throws instead of returning a fake success. We still
    // cancel the ShopTantra-side shipment and restock, but we tell the operator
    // plainly that the carrier copy must be cancelled in their dashboard —
    // otherwise the parcel keeps moving while the marketplace says it is
    // cancelled.
    let providerNotice: string;
    let providerCancelled = true;
    try {
      await MasterCourierService.cancelShipment(
        shipment.awbNumber || shipment.shipmentNumber
      );
      providerNotice = 'Carrier cancellation confirmed.';
    } catch (e: any) {
      providerCancelled = false;
      providerNotice =
        'The carrier could NOT be cancelled automatically (Shipping Xpress exposes no ' +
        'cancellation endpoint). The parcel must also be cancelled in the Shipping ' +
        'Xpress merchant dashboard, otherwise it will keep moving.';
      console.warn('[shipment/cancel] provider cancel unavailable:', e?.code || e?.message);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Shipment status to CANCELLED
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      // 2. Update Order status
      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      // 3. Increment stock back
      const orderItems = await tx.orderItem.findMany({
        where: { shipmentId: shipmentId }
      });
      for (const item of orderItems) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      // 4. Create Tracking Update log
      await tx.trackingUpdate.create({
        data: {
          shipmentId: shipment.id,
          status: 'CANCELLED',
          location: 'ShopTantra Control',
          message: providerCancelled
            ? `Shipment cancelled and the carrier AWB was voided. AWB: ${shipment.awbNumber || 'N/A'}.`
            : `Shipment cancelled in ShopTantra, but the carrier AWB could NOT be voided automatically and must be cancelled in the Shipping Xpress dashboard. AWB: ${shipment.awbNumber || 'N/A'}.`,
          timestamp: new Date()
        }
      });

      // 5. Add audit trail entry
      await MasterCourierService.logAction(tx, shipment.id, 'SHIPMENT_CANCELLED', actorUserId, actorRole, {
        awbNumber: shipment.awbNumber,
        providerCancelled,
        response: providerNotice
      });

      return updatedShipment;
    });

    return NextResponse.json({
      success: true,
      message: providerCancelled
        ? 'Shipment cancelled successfully.'
        : 'Shipment cancelled in ShopTantra.',
      providerCancelled,
      notice: providerNotice,
      data: result
    });

  } catch (error: any) {
    console.error('Error cancelling shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel shipment' },
      { status: 500 }
    );
  }
}
