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

// GET /api/seller/inventory
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

    const products = await prisma.product.findMany({
      where: { sellerId },
      select: {
        id: true,
        title: true,
        sku: true,
        stock: true,
        status: true,
        category: true
      },
      orderBy: { title: 'asc' }
    });

    const inventoryItems = products.map(p => ({
      id: p.id,
      title: p.title,
      sku: p.sku || 'N/A',
      stock: p.stock,
      status: p.status,
      category: p.category || 'Uncategorized'
    }));

    return NextResponse.json({ success: true, data: inventoryItems });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
