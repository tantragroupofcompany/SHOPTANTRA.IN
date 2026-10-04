import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { classifyDbError } from '../../../../lib/authUtils';
import { requireRole } from '../../../../middleware/index';

export async function GET(request: Request) {
  try {
    // AUTHORIZATION: shipment rows carry buyer addresses, phone numbers and AWBs.
    // This endpoint previously had no guard and honoured an arbitrary `sellerId`,
    // so anyone could enumerate the whole fulfilment ledger. Sellers are now
    // pinned to their own store; only admin/executive sessions see across stores.
    const guard = await requireRole(request, [
      'SELLER',
      'BUYER',
      'ADMIN',
      'FOUNDER',
      'CEO_MD',
      'CHAIRMAN',
    ]);
    if (guard instanceof NextResponse) return guard;

    const role = String((guard as any).role || '');
    const sessionUserId = (guard as any).userId as string | undefined;
    const elevated = ['ADMIN', 'FOUNDER', 'CEO_MD', 'CHAIRMAN'].includes(role);

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const filter: any = {};

    if (elevated) {
      // Staff may filter by any store, or omit the filter to see the whole fleet.
      if (sellerId) {
        const seller = await prisma.seller.findFirst({
          where: { OR: [{ id: sellerId }, { userId: sellerId }] },
          select: { id: true },
        });
        filter.sellerId = seller ? seller.id : sellerId;
      }
    } else {
      // Non-staff callers are always scoped to their own store.
      const own = sessionUserId
        ? await prisma.seller.findFirst({ where: { userId: sessionUserId }, select: { id: true } })
        : null;
      if (!own) {
        return NextResponse.json({ error: 'Seller profile not found for this account' }, { status: 403 });
      }
      filter.sellerId = own.id;
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
