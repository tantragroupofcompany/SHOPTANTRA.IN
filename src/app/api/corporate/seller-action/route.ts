import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';
import { classifyDbError } from '../../../../lib/authUtils';
import { sendApprovalEmail } from '../../../../lib/email';

const CORPORATE_APPROVERS = ['FOUNDER', 'CEO_MD', 'CHAIRMAN'];
let approvingExecutive: string | null = null;

export async function POST(request: Request) {
  const guard = await requireRole(request, CORPORATE_APPROVERS);
  if (guard instanceof NextResponse) return guard;

  const actingUserId = (guard as any)?.userId;
  if (actingUserId) approvingExecutive = actingUserId;

  try {
    const body = await request.json();
    const { sellerId, action } = body || {};

    if (!sellerId || !action) {
      return NextResponse.json({ success: false, error: 'sellerId and action are required' }, { status: 400 });
    }

    const existing = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { user: { select: { email: true, fullName: true } } },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    const rawStatus = String(existing.status || '').toUpperCase();
    if (rawStatus === 'REJECTED' || rawStatus === 'BLOCKED' || rawStatus === 'SUSPENDED') {
      if (action.toLowerCase() === 'approve') {
        return NextResponse.json(
          { success: false, error: 'Cannot approve a seller whose status is already ' + rawStatus },
          { status: 409 }
        );
      }
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
      const sellerUpdateData: Record<string, any> = { status };
      if (status === 'ACTIVE') {
        sellerUpdateData.verificationStatus = 'VERIFIED';
      }

      const seller = await tx.seller.update({
        where: { id: sellerId },
        data: sellerUpdateData,
        include: {
          user: { select: { email: true, fullName: true } },
        },
      });

      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: true, role: 'SELLER' },
        });
      }

      if (status === 'ACTIVE') {
        const wallet = await tx.vendorWallet.findUnique({ where: { sellerId } });
        if (!wallet) {
          await tx.vendorWallet.create({ data: { sellerId, balance: 0.0, pendingEarnings: 0.0 } });
        }
        const settings = await tx.sellerSettings.findUnique({ where: { sellerId } });
        if (!settings) {
          await tx.sellerSettings.create({
            data: {
              sellerId,
              notificationPrefs: JSON.stringify({
                newOrders: true, lowStock: true, payments: true, reviews: true,
                emailNotifications: true, smsNotifications: false,
                readNotifications: [], deletedNotifications: [],
              }),
              twoFaEnabled: false,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          operation: status === 'ACTIVE' ? 'SELLER_APPROVED' :
            (status === 'REJECTED' ? 'SELLER_REJECTED' :
              status === 'SUSPENDED' ? 'SELLER_SUSPENDED' : 'SELLER_BLOCKED'),
          model: 'Seller',
          targetId: sellerId,
          actor: approvingExecutive || actingUserId || 'unknown',
          reason: 'Corporate approval action: ' + action,
          before: { status: existing.status, verificationStatus: existing.verificationStatus },
          after: { status, verificationStatus: status === 'ACTIVE' ? 'VERIFIED' : existing.verificationStatus },
        },
      });

      return seller;
    });

    (async () => {
      try {
        await sendApprovalEmail(
          existing.user?.email || 'unknown@example.com',
          existing.user?.fullName || existing.storeName || 'Seller',
          updatedSeller.storeName
        );
      } catch (emailErr: any) {
        console.error('[seller-action] Approval email delivery failed (approval preserved):', emailErr?.message || emailErr);
      }
    })();

    return NextResponse.json({
      success: true,
      message: 'Seller ' + status.toLowerCase() + ' successfully',
      data: updatedSeller,
    });

  } catch (error: any) {
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
