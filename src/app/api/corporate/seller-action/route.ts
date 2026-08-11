import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';

export async function POST(request: any) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { sellerId, action } = body || {};

    if (!sellerId || !action) {
      return NextResponse.json({ success: false, error: 'sellerId and action are required' }, { status: 400 });
    }

    const existing = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    let status: string;
    switch (String(action).toLowerCase()) {
      case 'approve':
      case 'restore':
        status = 'ACTIVE';
        break;
      case 'reject':
        status = 'REJECTED';
        break;
      case 'suspend':
        status = 'SUSPENDED';
        break;
      case 'block':
        status = 'BLOCKED';
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await prisma.seller.update({
      where: { id: sellerId },
      data: {
        status,
        ...(status === 'ACTIVE' ? { verificationStatus: 'VERIFIED' } : {}),
      },
    });

    return NextResponse.json({ success: true, message: `Seller ${status.toLowerCase()} successfully` });
  } catch (error: any) {
    console.error('Seller action error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update seller' }, { status: 500 });
  }
}