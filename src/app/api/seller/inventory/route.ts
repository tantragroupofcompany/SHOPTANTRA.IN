import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireSellerScope } from '../../../../lib/sellerAuth';

// GET /api/seller/inventory
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');

    if (!sellerIdParam) {
      return NextResponse.json({ error: 'sellerId or userId query parameter is required' }, { status: 400 });
    }

    const scope = await requireSellerScope(request, sellerIdParam);
    if (!scope.ok) return scope.response;
    const sellerId = scope.sellerId;

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
