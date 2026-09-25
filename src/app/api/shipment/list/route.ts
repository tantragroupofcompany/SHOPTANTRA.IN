import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { classifyDbError } from '../../../../lib/authUtils';

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
    // Never return the raw Prisma message: it names the database user and the
    // connector internals, and this handler answers as soon as the query fails.
    console.error('[shipment/list] DB error:', error?.code || error?.message);
    const classified = classifyDbError(error);
    if (classified) {
      return NextResponse.json({ error: classified }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to list shipments. Please try again.' }, { status: 500 });
  }
}
