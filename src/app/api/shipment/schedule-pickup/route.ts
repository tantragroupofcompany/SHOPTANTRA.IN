import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

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

    // 2. Perform updates inside a transaction to ensure atomic consistency
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: 'PICKUP_SCHEDULED',
        updatedAt: new Date(),
      };

      if (pickupDate) {
        updateData.dispatchDate = pickupDate;
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
      if (pickupDate) {
        messageParts.push(`Pickup scheduled for ${pickupDate}`);
      } else {
        messageParts.push('Pickup scheduled');
      }
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
