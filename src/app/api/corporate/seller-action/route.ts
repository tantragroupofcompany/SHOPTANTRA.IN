import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';
import { classifyDbError } from '../../../../lib/authUtils';

export async function POST(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { sellerId, action } = body || {};

    if (!sellerId || !action) {
      return NextResponse.json({ success: false, error: 'sellerId and action are required' }, { status: 400 });
    }

    const existing = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    let status: string;
    switch (String(action).toLowerCase()) {
      case 'approve':
      case 'restore':
        status = 'ACTIVE';
        break;
      case 'reject':
        status = 'REJECTED';
        break;
      case 'suspend':
        status = 'SUSPENDED';
        break;
      case 'block':
        status = 'BLOCKED';
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const updatedSeller = await prisma.$transaction(async (tx) => {
      const seller = await tx.seller.update({
        where: { id: sellerId },
        data: {
          status,
          ...(status === 'ACTIVE' ? { verificationStatus: 'VERIFIED' } : {}),
        },
        select: {
          id: true,
          storeName: true,
          status: true,
          verificationStatus: true,
          updatedAt: true,
        },
      });

      if (status === 'ACTIVE' && existing.userId) {
        // Activate seller role on user account
        await tx.user.update({
          where: { id: existing.userId },
          data: { role: 'SELLER' },
        });

        // Ensure default vendor wallet exists
        const wallet = await tx.vendorWallet.findUnique({ where: { sellerId } });
        if (!wallet) {
          await tx.vendorWallet.create({
            data: {
              sellerId,
              balance: 0.0,
              pendingEarnings: 0.0,
            },
          });
        }

        // Ensure default seller settings exist
        const settings = await tx.sellerSettings.findUnique({ where: { sellerId } });
        if (!settings) {
          await tx.sellerSettings.create({
            data: {
              sellerId,
              notificationPrefs: JSON.stringify({
                newOrders: true,
                lowStock: true,
                payments: true,
                reviews: true,
                emailNotifications: true,
                smsNotifications: false,
                readNotifications: [],
                deletedNotifications: [],
              }),
              twoFaEnabled: false,
            },
          });
        }
      }

      return seller;
    });

    return NextResponse.json({
      success: true,
      message: `Seller ${status.toLowerCase()} successfully`,
      data: updatedSeller,
    });
  } catch (error: any) {
    // Never ship the raw Prisma/driver message to the browser: it can disclose
    // table names, column names and the connection host. A known DB outage is
    // reported as 503; anything else gets a generic 500. Detail stays in the
    // server log — same contract as the other corporate routes.
    console.error('Seller action error:', error);
    const classified = classifyDbError(error);
    if (classified) {
      console.error('[corporate/seller-action] DB error:', error?.code || error?.message);
      return NextResponse.json(
        { success: false, error: 'Unable to update this seller right now. Please try again.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: 'Failed to update seller' }, { status: 500 });
  }
}