import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Helper to resolve user ID or seller profile ID to seller profile ID
async function resolveSellerId(id: string | null): Promise<string | null> {
  if (!id) return null;
  let seller = await prisma.seller.findFirst({
    where: {
      OR: [
        { id: id },
        { userId: id }
      ]
    }
  });
  if (!seller) {
    seller = await prisma.seller.findFirst({
      where: { status: 'ACTIVE' }
    });
  }
  return seller ? seller.id : null;
}

// GET /api/seller/earnings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');

    if (!sellerIdParam) {
      return NextResponse.json({ error: 'sellerId or userId query parameter is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(sellerIdParam);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Fetch wallet details
    const wallet = await prisma.vendorWallet.findUnique({
      where: { sellerId }
    });

    // Fetch payouts
    const payouts = await prisma.payoutRequest.findMany({
      where: { sellerId },
      orderBy: { requestedAt: 'desc' }
    });

    const formattedPayouts = payouts.map(p => ({
      id: p.id,
      amount: p.amount,
      status: p.status.toLowerCase(),
      transaction_id: p.transactionId || 'N/A',
      created_at: p.requestedAt
    }));

    const formattedData = {
      total_earned: wallet?.pendingEarnings || 0.0,
      available_balance: wallet?.balance || 0.0,
      pending_payout: payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
      withdrawn: payouts.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
      commission_rate: 15, // default
      payouts: formattedPayouts
    };

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('Error fetching earnings data:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/seller/earnings (Request Payout)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sellerId: sellerIdParam, userId, amount, paymentMethod, upiId, bankDetails } = body;

    const idToResolve = sellerIdParam || userId;
    if (!idToResolve || !amount || amount <= 0) {
      return NextResponse.json({ error: 'sellerId/userId and positive amount are required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(idToResolve);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const wallet = await prisma.vendorWallet.findUnique({
      where: { sellerId }
    });

    if (!wallet || wallet.balance < parseFloat(amount)) {
      return NextResponse.json({ error: 'Insufficient wallet balance for withdrawal request' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.vendorWallet.update({
        where: { sellerId },
        data: {
          balance: { decrement: parseFloat(amount) }
        }
      });

      // Log wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: parseFloat(amount),
          type: 'DEBIT',
          description: `Withdrawal request initiated`
        }
      });

      // Create payout request
      const payout = await tx.payoutRequest.create({
        data: {
          sellerId,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod || 'UPI',
          upiId: upiId || null,
          bankDetails: bankDetails ? JSON.stringify(bankDetails) : null,
          status: 'PENDING'
        }
      });

      return payout;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating payout request:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
