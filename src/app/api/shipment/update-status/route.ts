import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';

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

    // Fetch realistic courier tracking updates if they exist
    const awb = trackingNumber || shipment.awbNumber || shipment.shipmentNumber;
    const trackingHistory = await MasterCourierService.trackShipment(awb, status.toUpperCase());

    // 2. Perform updates inside a transaction to ensure atomic consistency
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: status.toUpperCase(),
        updatedAt: new Date()
      };

      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
        updateData.awbNumber = trackingNumber;
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
      const finalPaymentStatus = status.toUpperCase() === 'DELIVERED' ? 'COD_COLLECTED' : shipment.order.paymentStatus;
      
      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          status: status.toUpperCase(),
          paymentStatus: finalPaymentStatus,
          updatedAt: new Date()
        }
      });

      if (status.toUpperCase() === 'DELIVERED') {
        // Set Payment to COD_COLLECTED
        await tx.payment.updateMany({
          where: { orderId: shipment.orderId },
          data: { status: 'COD_COLLECTED' }
        });

        // Set Commission to SETTLEMENT_PENDING
        await tx.commission.updateMany({
          where: { orderId: shipment.orderId },
          data: { status: 'SETTLEMENT_PENDING' }
        });
      }

      // Construct update message
      let statusMessage = message;
      if (!statusMessage) {
        if (status.toUpperCase() === 'PACKED') {
          statusMessage = 'Parcel successfully packed and ready for dispatch.';
        } else if (status.toUpperCase() === 'SHIPPED') {
          const formattedDate = dispatchDate ? new Date(dispatchDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
          statusMessage = `Dispatched via courier partner on ${formattedDate}. AWB: ${awb}`;
        } else if (status.toUpperCase() === 'OUT_FOR_DELIVERY') {
          statusMessage = 'Parcel is out for delivery with the local courier associate.';
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
          location: location || 'Transit Hub',
          message: statusMessage,
          timestamp: new Date()
        }
      });

      // Create tracking history updates from API mock if not already present
      if (trackingHistory && trackingHistory.length > 0) {
        // Log them as historical updates if they match
      }

      // Log shipment audit log
      await MasterCourierService.logAction(tx, shipment.id, `STATUS_${status.toUpperCase()}`, shipment.sellerId, 'SELLER', {
        awbNumber: awb,
        status: status.toUpperCase(),
        location: location || 'Transit Hub',
        message: statusMessage
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
