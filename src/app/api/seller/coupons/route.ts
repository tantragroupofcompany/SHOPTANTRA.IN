import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Helper to resolve user ID or seller profile ID to seller profile ID
async function resolveSellerId(id: string | null): Promise<string | null> {
  if (!id) return null;
  let seller = await prisma.seller.findFirst({
    where: {
      OR: [
        { id: id },
        { userId: id }
      ]
    }
  });
  if (!seller) {
    seller = await prisma.seller.findFirst({
      where: { status: 'ACTIVE' }
    });
  }
  return seller ? seller.id : null;
}

// GET /api/seller/coupons
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');

    if (!sellerIdParam) {
      return NextResponse.json({ error: 'sellerId or userId query parameter is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(sellerIdParam);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const coupons = await prisma.coupon.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' }
    });

    const formattedCoupons = coupons.map(c => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minSpend: c.minSpend,
      expiryDate: c.expiryDate,
      status: c.status,
      usageCount: c.usageCount,
      totalSavings: c.totalSavings
    }));

    return NextResponse.json({ success: true, data: formattedCoupons });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/seller/coupons
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sellerId: sellerIdParam,
      userId,
      code,
      discountType,
      discountValue,
      minSpend,
      expiryDate,
      status
    } = body;

    const idToResolve = sellerIdParam || userId;
    if (!idToResolve) {
      return NextResponse.json({ error: 'sellerId or userId is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(idToResolve);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return NextResponse.json({ error: 'Missing required fields: code, discountType, discountValue, expiryDate' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().replace(/\s+/g, '');

    // Prevent duplicate codes
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode }
    });

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        sellerId,
        code: cleanCode,
        discountType,
        discountValue: parseFloat(discountValue),
        minSpend: minSpend ? parseFloat(minSpend) : 0,
        expiryDate,
        status: status || 'active'
      }
    });

    return NextResponse.json({ success: true, data: newCoupon });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/seller/coupons
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      code,
      discountType,
      discountValue,
      minSpend,
      expiryDate,
      status
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required for update' }, { status: 400 });
    }

    const updatePayload: any = {};
    if (code !== undefined) {
      updatePayload.code = code.toUpperCase().replace(/\s+/g, '');
    }
    if (discountType !== undefined) updatePayload.discountType = discountType;
    if (discountValue !== undefined) updatePayload.discountValue = parseFloat(discountValue);
    if (minSpend !== undefined) updatePayload.minSpend = parseFloat(minSpend);
    if (expiryDate !== undefined) updatePayload.expiryDate = expiryDate;
    if (status !== undefined) updatePayload.status = status;

    const updated = await prisma.coupon.update({
      where: { id },
      data: updatePayload
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/seller/coupons
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required for deletion' }, { status: 400 });
    }

    const deleted = await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
