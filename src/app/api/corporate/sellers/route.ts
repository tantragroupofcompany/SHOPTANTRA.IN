import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';

/**
 * Corporate: live filtered seller list.
 * Supports ?status=all|approved|pending|rejected|suspended|blocked
 */
export async function GET(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    const url = new URL(request.url || '/');
    const status = String(url.searchParams.get('status') || 'all').toLowerCase();

    let where: any = {};
    switch (status) {
      case 'approved':
        where = { status: { in: ['ACTIVE', 'APPROVED'] } };
        break;
      case 'pending':
        where = { status: 'PENDING' };
        break;
      case 'rejected':
        where = { status: 'REJECTED' };
        break;
      case 'suspended':
        where = { status: 'SUSPENDED' };
        break;
      case 'blocked':
        where = { status: 'BLOCKED' };
        break;
      case 'all':
      default:
        where = {};
    }

    const [items, total] = await Promise.all([
      prisma.seller.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          storeName: true,
          storeDescription: true,
          status: true,
          city: true,
          state: true,
          createdAt: true,
          emailVerified: true,
          user: { select: { email: true, phone: true, fullName: true } },
          _count: { select: { products: true, orders: true } },
        },
      }),
      prisma.seller.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { status, total, items } });
  } catch (error: any) {
    console.error('Corporate sellers error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load sellers' },
      { status: 500 }
    );
  }
}