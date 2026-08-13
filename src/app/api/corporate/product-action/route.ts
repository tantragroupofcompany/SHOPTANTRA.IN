import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';

export async function POST(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { productId, action } = body || {};

    if (!productId || !action) {
      return NextResponse.json({ success: false, error: 'productId and action are required' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    let status: string;
    switch (String(action).toLowerCase()) {
      case 'approve':
      case 'restore':
      case 'unblock':
        status = 'ACTIVE';
        break;
      case 'reject':
        status = 'REJECTED';
        break;
      case 'block':
        status = 'BLOCKED';
        break;
      case 'unpublish':
        status = 'DRAFT';
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { status },
    });

    return NextResponse.json({ success: true, message: `Product ${status} successfully` });
  } catch (error: any) {
    console.error('Product action error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update product' }, { status: 500 });
  }
}