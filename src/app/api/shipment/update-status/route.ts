import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { shipmentId, status, trackingNumber, dispatchDate, location, message } = await request.json();

    if (!shipmentId || !status) {
      return NextResponse.json({ error: 'Shipment ID and status are required' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();

    // 1. Fetch current shipment details
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // 2. Perform updates inside a transaction to ensure atomic consistency
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: status.toUpperCase(),
        updatedAt: new Date()
      };

      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
        updateData.awbNumber = trackingNumber; // Align AWB with tracking number for manual shipping
        updateData.trackingLink = `https://www.indiapost.gov.in/_layouts/15/dop.indiapost.tracking/tracksp.aspx?txtTrckNo=${trackingNumber}`;
      }

      if (dispatchDate) {
        updateData.dispatchDate = dispatchDate;
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
          status: status.toUpperCase(),
          updatedAt: new Date()
        }
      });

      // Construct update message
      let statusMessage = message;
      if (!statusMessage) {
        if (status.toUpperCase() === 'PACKED') {
          statusMessage = 'Parcel successfully packed and ready for dispatch.';
        } else if (status.toUpperCase() === 'SHIPPED') {
          const formattedDate = dispatchDate ? new Date(dispatchDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
          statusMessage = `Dispatched via India Post Speed Post on ${formattedDate}. Tracking Number: ${trackingNumber || 'N/A'}`;
        } else if (status.toUpperCase() === 'OUT_FOR_DELIVERY') {
          statusMessage = 'Parcel is out for delivery with the local postman.';
        } else if (status.toUpperCase() === 'DELIVERED') {
          statusMessage = 'Parcel successfully delivered to the recipient.';
        } else if (status.toUpperCase() === 'CANCELLED') {
          statusMessage = 'Shipment cancelled.';
        } else {
          statusMessage = `Shipment status updated to ${status}.`;
        }
      }

      // Log tracking history
      const trackingUpdate = await tx.trackingUpdate.create({
        data: {
          shipmentId,
          status: status.toUpperCase(),
          location: location || 'Warehouse',
          message: statusMessage,
          timestamp: new Date()
        }
      });

      return { shipment: updatedShipment, trackingUpdate };
    });

    return NextResponse.json({
      success: true,
      message: `Shipment status updated to ${status.toUpperCase()} successfully.`,
      data: result
    });

  } catch (error: any) {
    console.error('Error updating shipment status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update shipment status' },
      { status: 500 }
    );
  }
}
