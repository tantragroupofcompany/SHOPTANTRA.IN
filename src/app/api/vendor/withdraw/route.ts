import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireSellerScope } from '../../../../lib/sellerAuth';

export async function POST(request: Request) {
  try {
    const { sellerId: sellerIdParam, amount, paymentMethod, bankDetails, upiId } = await request.json();

    // AUTHORIZATION: a seller may only withdraw from their OWN wallet.
    //
    // This route previously read `sellerId` straight from the request body with
    // no authentication whatsoever — anyone could POST an arbitrary seller id
    // and an amount and create a PENDING payout (deducting that seller's wallet
    // balance) for a store they do not own. The scope guard authenticates the
    // caller and requires the target store to belong to them.
    //
    // The guard runs BEFORE payload validation so an anonymous caller always
    // gets 401 rather than a validation error that reveals this route's shape.
    const scope = await requireSellerScope(request, sellerIdParam);
    if (!scope.ok) return scope.response;
    const sellerId = scope.sellerId;

    // Coerce the amount once. `wallet.balance < amount` / `decrement: amount`
    // silently coerce a numeric STRING (e.g. "50") in the comparison but then
    // hand Prisma a string for a Float field, which throws → 500. Validate as
    // a real finite positive number up front instead.
    const numericAmount = typeof amount === 'string' && amount.trim() !== '' ? Number(amount) : amount;
    if (typeof numericAmount !== 'number' || !Number.isFinite(numericAmount) || numericAmount <= 0 || !paymentMethod) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // 1. Fetch vendor wallet
    const wallet = await prisma.vendorWallet.findUnique({
      where: { sellerId },
    });

    if (!wallet || wallet.balance < numericAmount) {
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
          balance: { decrement: numericAmount },
        },
      });

      // Log wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: numericAmount,
          type: 'DEBIT',
          description: `Withdrawal request initiated via ${paymentMethod}`,
        },
      });

      // Create Payout Request.
      // `PayoutRequest.bankDetails` is a String? column — the previous
      // `bankDetails || {}` wrote an OBJECT into it whenever bankDetails was
      // absent, which Prisma rejects at runtime (500 on every bank payout).
      // Serialize objects to JSON and store null when nothing was supplied,
      // matching /api/seller/earnings.
      const payout = await tx.payoutRequest.create({
        data: {
          sellerId,
          amount: numericAmount,
          paymentMethod,
          bankDetails: bankDetails
            ? (typeof bankDetails === 'string' ? bankDetails : JSON.stringify(bankDetails))
            : null,
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
