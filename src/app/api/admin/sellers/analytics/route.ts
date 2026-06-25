import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET() {
  try {
    const sellers = await prisma.seller.findMany({
      include: {
        products: {
          select: { id: true }
        },
        orders: {
          where: {
            paymentStatus: {
              in: ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING']
            }
          },
          select: {
            totalAmount: true
          }
        },
        wallet: true,
        commissions: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    const data = sellers.map(seller => {
      const totalProducts = seller.products.length;
      const totalOrders = seller.orders.length;
      const grossSales = seller.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const commission = seller.commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
      const netEarnings = seller.wallet?.balance || 0;
      const pendingEarnings = seller.wallet?.pendingEarnings || 0;

      return {
        id: seller.id,
        storeName: seller.storeName,
        ownerEmail: seller.user?.email || 'N/A',
        category: seller.businessType || 'General',
        status: seller.status.toLowerCase(),
        totalProducts,
        totalOrders,
        grossSales,
        commission,
        netEarnings,
        pendingEarnings,
        commissionRate: seller.commissionRate,
        isVerified: seller.verificationStatus === 'VERIFIED',
        verificationStatus: seller.verificationStatus
      };
    });

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error generating seller analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve seller analytics' },
      { status: 500 }
    );
  }
}
