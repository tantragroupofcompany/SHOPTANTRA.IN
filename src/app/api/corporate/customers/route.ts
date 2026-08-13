import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';

/**
 * Corporate: live filtered customer (buyer) list.
 * Supports ?status=all|active|inactive
 * "Active" matches the dashboard definition: a buyer who has placed at least one order.
 */
export async function GET(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    const url = new URL(request.url || '/');
    const status = String(url.searchParams.get('status') || 'all').toLowerCase();

    let where: any = { role: 'BUYER' };
    switch (status) {
      case 'active':
        where = { role: 'BUYER', orders: { some: {} } };
        break;
      case 'inactive':
        where = { role: 'BUYER', orders: { none: {} } };
        break;
      case 'all':
      default:
        where = { role: 'BUYER' };
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          username: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const customers = items.map((c: any) => ({
      id: c.id,
      name: c.fullName || c.username || '—',
      email: c.email,
      phone: c.phone || '—',
      orderCount: c._count?.orders || 0,
      active: (c._count?.orders || 0) > 0,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ success: true, data: { status, total, items: customers } });
  } catch (error: any) {
    console.error('Corporate customers error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load customers' },
      { status: 500 }
    );
  }
}