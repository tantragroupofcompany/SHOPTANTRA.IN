import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireSellerScope } from '../../../../lib/sellerAuth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId');

    if (!sellerIdParam) {
      return NextResponse.json(
        { error: 'sellerId query parameter is required' },
        { status: 400 }
      );
    }

    // AUTHORIZATION: a seller may only read their OWN wallet. This route
    // previously trusted the `sellerId` query parameter with no authentication
    // at all, exposing every store's balance, payout history and revenue.
    const scope = await requireSellerScope(request, sellerIdParam);
    if (!scope.ok) return scope.response;
    const sellerId = scope.sellerId;

    // 1. Fetch wallet details and transaction logs
    const wallet = await prisma.vendorWallet.findUnique({
      where: { sellerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    // 2. Fetch order metrics to compute store performance analytics
    const orders = await prisma.order.findMany({
      where: { sellerId },
      select: {
        status: true,
        totalAmount: true,
      },
    });

    const metrics = orders.reduce(
      (acc, order) => {
        acc.totalOrders += 1;
        if (order.status === 'DELIVERED') {
          acc.completedOrders += 1;
          acc.totalSales += order.totalAmount;
        } else if (order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'PROCESSING') {
          acc.pendingOrders += 1;
        } else if (order.status === 'CANCELLED') {
          acc.cancelledOrders += 1;
        }
        return acc;
      },
      { totalOrders: 0, completedOrders: 0, pendingOrders: 0, cancelledOrders: 0, totalSales: 0 }
    );

    // 3. Fetch payout history
    const payouts = await prisma.payoutRequest.findMany({
      where: { sellerId },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        wallet: wallet || { balance: 0.0, pendingEarnings: 0.0, transactions: [] },
        metrics,
        payouts,
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendor wallet details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve wallet details' },
      { status: 500 }
    );
  }
}
