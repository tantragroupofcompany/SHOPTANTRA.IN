import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';
import { requireRole } from '../../../../middleware/index';

// GET: List all pickup locations for admin console
export async function GET(request: any) {
  // Require corporate-level role — unauthenticated/buyer/seller access is rejected
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN', 'ADMIN']);
  if (guard instanceof NextResponse) return guard;

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
    console.error('Error listing pickup locations:', error?.code || error?.message);
    return NextResponse.json(
      { error: 'Failed to list pickup locations. Please try again.' },
      { status: 500 }
    );
  }
}

// POST: Verify pickup location and assign pickupLocationId
export async function POST(request: any) {
  // Require corporate-level role — unauthenticated/buyer/seller access is rejected
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN', 'ADMIN']);
  if (guard instanceof NextResponse) return guard;

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
    const actorId = (guard as any).userId || adminUserId || 'ADMIN';
    await prisma.$transaction(async (tx) => {
      await MasterCourierService.logAction(tx, null, `PICKUP_VERIFICATION_${verificationStatus.toUpperCase()}`, actorId, 'ADMIN', {
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
    console.error('Error updating pickup location:', error?.code || error?.message);
    return NextResponse.json(
      { error: 'Failed to update pickup location. Please try again.' },
      { status: 500 }
    );
  }
}
