import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';

export async function POST(request: Request) {
  try {
    const { shipmentId, pickupDate, pickupTimeSlot, contactName, contactPhone } = await request.json();

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
    }

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

    // Call MasterCourierService to schedule the pickup under ShopTantra's Master account
    const pickupResponse = await MasterCourierService.schedulePickup(
      shipment.awbNumber || shipment.shipmentNumber,
      shipment.seller?.pickupAddress?.pickupLocationId || null,
      pickupDateVal
    );

    // 2. Perform updates inside a transaction to ensure atomic consistency
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: 'PICKUP_SCHEDULED',
        updatedAt: new Date(),
      };

      if (pickupDateVal) {
        updateData.dispatchDate = pickupDateVal;
      }

      // Update shipment
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: updateData,
      });

      // Update Order Status to sync with shipment
      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          status: 'PICKUP_SCHEDULED',
          updatedAt: new Date(),
        },
      });

      // Build location from seller's pickup address if available
      const pickupAddress = shipment.seller?.pickupAddress;
      const location = pickupAddress
        ? `${pickupAddress.addressLine1}, ${pickupAddress.city}, ${pickupAddress.state} - ${pickupAddress.pincode}`
        : undefined;

      // Build tracking message
      const messageParts: string[] = [];
      messageParts.push(`Pickup scheduled for ${pickupDateVal}`);
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
      const statusMessage = messageParts.join('. ');

      // Log tracking history
      const trackingUpdate = await tx.trackingUpdate.create({
        data: {
          shipmentId,
          status: 'PICKUP_SCHEDULED',
          location: location,
          message: statusMessage,
          timestamp: new Date(),
        },
      });

      // Log shipment audit log
      await MasterCourierService.logAction(tx, shipment.id, 'PICKUP_SCHEDULED', shipment.sellerId, 'SELLER', {
        awbNumber: shipment.awbNumber,
        pickupLocationId: pickupAddress?.pickupLocationId,
        date: pickupDateVal,
        timeSlot: pickupTimeSlot,
        response: pickupResponse.message,
      });

      return { shipment: updatedShipment, trackingUpdate };
    });

    return NextResponse.json({
      success: true,
      message: 'Pickup scheduled successfully.',
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
