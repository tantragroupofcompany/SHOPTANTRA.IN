import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';

/**
 * Corporate: live filtered product list.
 * Supports ?status=all|approved|pending|rejected|blocked|draft|outofstock
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
        where = { status: { equals: 'ACTIVE', mode: 'insensitive' } };
        break;
      case 'pending':
        where = { status: { equals: 'PENDING', mode: 'insensitive' } };
        break;
      case 'rejected':
        where = { status: { equals: 'REJECTED', mode: 'insensitive' } };
        break;
      case 'blocked':
        where = { status: { equals: 'BLOCKED', mode: 'insensitive' } };
        break;
      case 'draft':
        where = { status: { equals: 'DRAFT', mode: 'insensitive' } };
        break;
      case 'outofstock':
        where = { stock: 0 };
        break;
      case 'all':
      default:
        where = {};
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          title: true,
          price: true,
          stock: true,
          status: true,
          category: true,
          createdAt: true,
          seller: { select: { id: true, storeName: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { status, total, items } });
  } catch (error: any) {
    console.error('Corporate products error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load products' },
      { status: 500 }
    );
  }
}