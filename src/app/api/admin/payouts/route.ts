import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Fetch all payout requests
export async function GET() {
  try {
    const payouts = await prisma.payoutRequest.findMany({
      include: {
        seller: {
          select: {
            storeName: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: payouts,
    });
  } catch (error: any) {
    console.error('Error fetching payouts lists:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payouts list' },
      { status: 500 }
    );
  }
}

// Approve/Reject/Hold payout request
export async function PUT(request: Request) {
  try {
    const { payoutId, action, notes, transactionId } = await request.json();

    if (!payoutId || !action) {
      return NextResponse.json(
        { error: 'payoutId and action are required' },
        { status: 400 }
      );
    }

    // 1. Fetch payout request
    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout request not found' },
        { status: 404 }
      );
    }

    if (payout.status === 'PAID' || payout.status === 'FAILED') {
      return NextResponse.json(
        { error: 'Payout request is already resolved and cannot be changed' },
        { status: 400 }
      );
    }

    // 2. Perform updates inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      let updatedPayout;

      if (action === 'RELEASE') {
        // Mark payout as PAID
        updatedPayout = await tx.payoutRequest.update({
          where: { id: payoutId },
          data: {
            status: 'PAID',
            transactionId,
            notes: notes || 'Payout released by Admin',
            processedAt: new Date(),
          },
        });
      } else if (action === 'REJECT') {
        // Mark payout as FAILED and refund vendor wallet
        updatedPayout = await tx.payoutRequest.update({
          where: { id: payoutId },
          data: {
            status: 'FAILED',
            notes: notes || 'Payout rejected by Admin',
            processedAt: new Date(),
          },
        });

        // Refund the amount back to the seller wallet
        const wallet = await tx.vendorWallet.update({
          where: { sellerId: payout.sellerId },
          data: {
            balance: { increment: payout.amount },
          },
        });

        // Log refund transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: payout.amount,
            type: 'CREDIT',
            description: `Refund for rejected withdrawal request (Ref: ${payoutId})`,
          },
        });
      } else if (action === 'HOLD') {
        // Mark payout as PROCESSING
        updatedPayout = await tx.payoutRequest.update({
          where: { id: payoutId },
          data: {
            status: 'PROCESSING',
            notes: notes || 'Payout put on hold by Admin',
          },
        });
      } else {
        throw new Error('Invalid action requested');
      }

      return updatedPayout;
    });

    return NextResponse.json({
      success: true,
      message: `Payout successfully updated with action: ${action}`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error handling admin payout action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payout action' },
      { status: 500 }
    );
  }
}
