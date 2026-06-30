import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    const filter: any = {};
    if (sellerId) {
      filter.sellerId = sellerId;
    }

    const settlements = await prisma.commission.findMany({
      where: filter,
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            paymentStatus: true,
            createdAt: true
          }
        },
        seller: {
          select: {
            storeName: true,
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: settlements
    });
  } catch (error: any) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settlements list' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { commissionId, action, notes } = await request.json();

    if (!commissionId || !action) {
      return NextResponse.json(
        { error: 'commissionId and action are required' },
        { status: 400 }
      );
    }

    const commission = await prisma.commission.findUnique({
      where: { id: commissionId }
    });

    if (!commission) {
      return NextResponse.json(
        { error: 'Commission settlement record not found' },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let updatedStatus = '';
      if (action === 'HOLD') {
        updatedStatus = 'HELD';
      } else if (action === 'RELEASE') {
        updatedStatus = 'PROCESSED';
      } else if (action === 'CANCEL') {
        updatedStatus = 'CANCELLED';
      } else {
        throw new Error(`Invalid action: ${action}`);
      }

      // Update commission record
      const updatedCommission = await tx.commission.update({
        where: { id: commissionId },
        data: { status: updatedStatus }
      });

      // Update wallet details if it was pending
      const wallet = await tx.vendorWallet.findUnique({
        where: { sellerId: commission.sellerId }
      });

      if (wallet) {
        if (action === 'RELEASE') {
          // Move from pendingEarnings to withdrawable balance
          await tx.vendorWallet.update({
            where: { sellerId: commission.sellerId },
            data: {
              balance: { increment: commission.sellerPayout },
              pendingEarnings: { decrement: Math.min(wallet.pendingEarnings, commission.sellerPayout) }
            }
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: commission.sellerPayout,
              type: 'CREDIT',
              description: `Settlement released for Order ID: ${commission.orderId}. Notes: ${notes || 'Released by Admin'}`
            }
          });
        } else if (action === 'CANCEL') {
          // Decrement pendingEarnings without adding to balance
          await tx.vendorWallet.update({
            where: { sellerId: commission.sellerId },
            data: {
              pendingEarnings: { decrement: Math.min(wallet.pendingEarnings, commission.sellerPayout) }
            }
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: commission.sellerPayout,
              type: 'DEBIT',
              description: `Settlement cancelled for Order ID: ${commission.orderId}. Notes: ${notes || 'Cancelled by Admin'}`
            }
          });
        }
      }

      return updatedCommission;
    });

    return NextResponse.json({
      success: true,
      message: `Settlement successfully updated with action: ${action}`,
      data: result
    });

  } catch (error: any) {
    console.error('Error updating settlement status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settlement status' },
      { status: 500 }
    );
  }
}
