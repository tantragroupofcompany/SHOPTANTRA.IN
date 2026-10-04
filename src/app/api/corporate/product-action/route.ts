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
    // `approvalStatus` is kept in step with `status` on every action so the two
    // columns can never disagree. Before this, approving a product set only
    // status=ACTIVE and left approvalStatus null, and rejecting/blocking left a
    // stale 'APPROVED' behind - which made the storefront eligibility rule
    // (status=ACTIVE AND approvalStatus=APPROVED) ambiguous.
    let approvalStatus: string | null;
    switch (String(action).toLowerCase()) {
      case 'approve':
      case 'restore':
      case 'unblock':
        status = 'ACTIVE';
        approvalStatus = 'APPROVED';
        break;
      case 'reject':
        status = 'REJECTED';
        approvalStatus = 'REJECTED';
        break;
      case 'block':
        status = 'BLOCKED';
        approvalStatus = 'BLOCKED';
        break;
      case 'unpublish':
        status = 'DRAFT';
        approvalStatus = null;
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { status, approvalStatus },
    });

    return NextResponse.json({ success: true, message: `Product ${status} successfully` });
  } catch (error: any) {
    console.error('Product action error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update product' }, { status: 500 });
  }
}