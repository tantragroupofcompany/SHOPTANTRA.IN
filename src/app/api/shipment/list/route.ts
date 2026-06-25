import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let sellerId = searchParams.get('sellerId');
    const filter: any = {};
    if (sellerId) {
      const seller = await prisma.seller.findFirst({
        where: {
          OR: [
            { id: sellerId },
            { userId: sellerId }
          ]
        }
      });
      if (seller) {
        filter.sellerId = seller.id;
      } else {
        filter.sellerId = sellerId;
      }
    }

    const shipments = await prisma.shipment.findMany({
      where: filter,
      include: {
        order: {
          include: {
            buyer: true
          }
        },
        seller: true,
        courierPartner: true,
        items: true,
        trackingUpdates: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: shipments
    });

  } catch (error: any) {
    console.error('Error listing shipments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list shipments' },
      { status: 500 }
    );
  }
}
