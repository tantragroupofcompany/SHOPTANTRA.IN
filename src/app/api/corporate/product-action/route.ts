import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';
import { classifyDbError } from '../../../../lib/authUtils';

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
    // Never ship the raw Prisma/driver message to the browser: it can disclose
    // table names, column names and the connection host. A known DB outage is
    // reported as 503; anything else gets a generic 500. Detail stays in the
    // server log — same contract as the other corporate routes.
    console.error('Product action error:', error);
    const classified = classifyDbError(error);
    if (classified) {
      console.error('[corporate/product-action] DB error:', error?.code || error?.message);
      return NextResponse.json(
        { success: false, error: 'Unable to update this product right now. Please try again.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}