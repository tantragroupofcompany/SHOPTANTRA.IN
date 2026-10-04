import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireSellerScope } from '../../../../lib/sellerAuth';

export async function POST(request: Request) {
  try {
    const { sellerId: sellerIdParam, amount, paymentMethod, bankDetails, upiId } = await request.json();

    if (!amount || amount <= 0 || !paymentMethod) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // AUTHORIZATION: a seller may only withdraw from their OWN wallet.
    //
    // This route previously read `sellerId` straight from the request body with
    // no authentication whatsoever — anyone could POST an arbitrary seller id
    // and an amount and create a PENDING payout (deducting that seller's wallet
    // balance) for a store they do not own. The scope guard authenticates the
    // caller and requires the target store to belong to them.
    const scope = await requireSellerScope(request, sellerIdParam);
    if (!scope.ok) return scope.response;
    const sellerId = scope.sellerId;

    // 1. Fetch vendor wallet
    const wallet = await prisma.vendorWallet.findUnique({
      where: { sellerId },
    });

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance available in wallet for withdrawal' },
        { status: 400 }
      );
    }

    // 2. Perform withdrawal ledger request inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet balance immediately to lock funds
      const updatedWallet = await tx.vendorWallet.update({
        where: { sellerId },
        data: {
          balance: { decrement: amount },
        },
      });

      // Log wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: 'DEBIT',
          description: `Withdrawal request initiated via ${paymentMethod}`,
        },
      });

      // Create Payout Request
      const payout = await tx.payoutRequest.create({
        data: {
          sellerId,
          amount,
          paymentMethod,
          bankDetails: bankDetails || {},
          upiId,
          status: 'PENDING',
        },
      });

      return { updatedWallet, transaction, payout };
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request logged successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error initiating withdrawal request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request payout' },
      { status: 500 }
    );
  }
}
