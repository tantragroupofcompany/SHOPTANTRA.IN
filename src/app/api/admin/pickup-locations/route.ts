import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';

// GET: List all pickup locations for admin console
export async function GET(request: Request) {
  try {
    const locations = await prisma.pickupAddress.findMany({
      include: {
        seller: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: locations
    });
  } catch (error: any) {
    console.error('Error listing pickup locations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list pickup locations' },
      { status: 500 }
    );
  }
}

// POST: Verify pickup location and assign pickupLocationId
export async function POST(request: Request) {
  try {
    const { pickupAddressId, verificationStatus, pickupLocationId, adminUserId } = await request.json();

    if (!pickupAddressId || !verificationStatus) {
      return NextResponse.json({ error: 'Pickup address ID and status are required' }, { status: 400 });
    }

    const updatedLocation = await prisma.pickupAddress.update({
      where: { id: pickupAddressId },
      data: {
        verificationStatus: verificationStatus.toUpperCase(),
        pickupLocationId: pickupLocationId || undefined,
        updatedAt: new Date()
      },
      include: {
        seller: true
      }
    });

    // Write audit trail entry
    await prisma.$transaction(async (tx) => {
      await MasterCourierService.logAction(tx, null, `PICKUP_VERIFICATION_${verificationStatus.toUpperCase()}`, adminUserId || 'ADMIN', 'ADMIN', {
        pickupAddressId,
        sellerId: updatedLocation.sellerId,
        pickupLocationId
      });
    });

    return NextResponse.json({
      success: true,
      message: `Pickup location status updated to ${verificationStatus} successfully.`,
      data: updatedLocation
    });

  } catch (error: any) {
    console.error('Error updating pickup location:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update pickup location' },
      { status: 500 }
    );
  }
}
