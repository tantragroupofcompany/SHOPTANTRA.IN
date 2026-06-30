import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';

export async function POST(request: Request) {
  try {
    const { shipmentId, userId, role } = await request.json();

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Call MasterCourierService to cancel AWB in ShopTantra Master Shipping account
    const cancelResponse = await MasterCourierService.cancelShipment(
      shipment.awbNumber || shipment.shipmentNumber
    );

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
          location: 'Central Control',
          message: `Shipment cancelled in master shipping ledger. AWB: ${shipment.awbNumber || 'N/A'}.`,
          timestamp: new Date()
        }
      });

      // 5. Add audit trail entry
      await MasterCourierService.logAction(tx, shipment.id, 'SHIPMENT_CANCELLED', userId || 'SYSTEM', role || 'ADMIN', {
        awbNumber: shipment.awbNumber,
        response: cancelResponse.message
      });

      return updatedShipment;
    });

    return NextResponse.json({
      success: true,
      message: 'Shipment cancelled successfully.',
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
