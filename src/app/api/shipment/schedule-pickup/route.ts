import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';
import { requireShipmentAccess } from '../../../../lib/sellerAuth';

export async function POST(request: Request) {
  try {
    const { shipmentId, pickupDate, pickupTimeSlot, contactName, contactPhone } = await request.json();

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
    }

    // AUTHORIZATION: mutates a real shipment (status + dispatch date) and raises
    // a pickup with the carrier. It previously accepted any shipmentId from an
    // anonymous caller.
    const access = await requireShipmentAccess(request, shipmentId);
    if (!access.ok) return access.response;

    // 1. Fetch current shipment details with seller's pickup address
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: true,
        seller: {
          include: {
            pickupAddress: true,
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const pickupDateVal = pickupDate || new Date().toISOString().split('T')[0];

    // Raise the pickup with the carrier.
    //
    // Shipping Xpress exposes no pickup endpoint (verified HTTP 404), so
    // `schedulePickup` now throws instead of reporting a fake confirmation.
    // We do NOT mark the parcel PICKUP_SCHEDULED in that case — doing so would
    // tell the seller a van is coming for a parcel nobody has collected.
    let pickupResponse: { scheduled: boolean; notice: string };
    try {
      await MasterCourierService.schedulePickup(
        shipment.awbNumber || shipment.shipmentNumber,
        shipment.seller?.pickupAddress?.pickupLocationId || null,
        pickupDateVal
      );
      pickupResponse = { scheduled: true, notice: 'Pickup confirmed by the carrier.' };
    } catch (e: any) {
      pickupResponse = {
        scheduled: false,
        notice:
          'The carrier could NOT be scheduled automatically (Shipping Xpress exposes no ' +
          'pickup-scheduling endpoint). Request the pickup in the Shipping Xpress ' +
          'merchant dashboard, then set the status there.',
      };
      console.warn('[shipment/schedule-pickup] provider pickup unavailable:', e?.code || e?.message);
    }

    // 2. Perform updates inside a transaction to ensure atomic consistency
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        updatedAt: new Date(),
      };

      // Only claim the parcel is scheduled when the carrier actually said so.
      if (pickupResponse.scheduled) {
        updateData.status = 'PICKUP_SCHEDULED';
      }

      if (pickupDateVal) {
        updateData.dispatchDate = pickupDateVal;
      }

      // Update shipment
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: updateData,
      });

      // Update Order Status to sync with shipment
      if (pickupResponse.scheduled) {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: {
            status: 'PICKUP_SCHEDULED',
            updatedAt: new Date(),
          },
        });
      }

      // Build location from seller's pickup address if available
      const pickupAddress = shipment.seller?.pickupAddress;
      const location = pickupAddress
        ? `${pickupAddress.addressLine1}, ${pickupAddress.city}, ${pickupAddress.state} - ${pickupAddress.pincode}`
        : undefined;

      // Build tracking message
      const messageParts: string[] = [];
      messageParts.push(
        pickupResponse.scheduled
          ? `Pickup scheduled for ${pickupDateVal}`
          : `Pickup requested for ${pickupDateVal} — NOT yet confirmed by the carrier`
      );
      if (pickupTimeSlot) {
        messageParts.push(`Time slot: ${pickupTimeSlot}`);
      }
      if (contactName && contactPhone) {
        messageParts.push(`Contact: ${contactName} (${contactPhone})`);
      } else if (contactName) {
        messageParts.push(`Contact: ${contactName}`);
      } else if (contactPhone) {
        messageParts.push(`Contact: ${contactPhone}`);
      }
      if (!pickupResponse.scheduled) {
        messageParts.push(pickupResponse.notice);
      }
      const statusMessage = messageParts.join('. ');

      // Log tracking history
      const trackingUpdate = await tx.trackingUpdate.create({
        data: {
          shipmentId,
          status: pickupResponse.scheduled ? 'PICKUP_SCHEDULED' : 'PICKUP_REQUESTED',
          location: location,
          message: statusMessage,
          timestamp: new Date(),
        },
      });

      // Log shipment audit log
      await MasterCourierService.logAction(tx, shipment.id, pickupResponse.scheduled ? 'PICKUP_SCHEDULED' : 'PICKUP_REQUEST_UNCONFIRMED', shipment.sellerId, 'SELLER', {
        awbNumber: shipment.awbNumber,
        pickupLocationId: pickupAddress?.pickupLocationId,
        date: pickupDateVal,
        timeSlot: pickupTimeSlot,
        providerScheduled: pickupResponse.scheduled,
        response: pickupResponse.notice,
      });

      return { shipment: updatedShipment, trackingUpdate };
    });

    return NextResponse.json({
      success: pickupResponse.scheduled,
      message: pickupResponse.scheduled
        ? 'Pickup scheduled successfully.'
        : 'Pickup was NOT scheduled with the carrier. See notice.',
      providerScheduled: pickupResponse.scheduled,
      notice: pickupResponse.notice,
      data: result,
    });

  } catch (error: any) {
    console.error('Error scheduling pickup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to schedule pickup' },
      { status: 500 }
    );
  }
}
