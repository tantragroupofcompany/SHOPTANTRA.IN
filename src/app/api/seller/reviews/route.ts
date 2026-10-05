import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireSellerScope } from '../../../../lib/sellerAuth';

// GET /api/seller/reviews
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

    const reviews = await prisma.review.findMany({
      where: {
        product: { sellerId }
      },
      include: {
        user: true,
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedReviews = reviews.map(r => ({
      id: r.id,
      customer_name: r.user?.fullName || 'Customer',
      product_title: r.product?.title || 'Unknown Product',
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      seller_response: r.sellerResponse || '',
      created_at: r.createdAt
    }));

    return NextResponse.json({ success: true, data: formattedReviews });
  } catch (error: any) {
    console.error('Error fetching seller reviews:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/seller/reviews (Update status or response)
//
// AUTHORIZATION: reviews belong to a store through their product. This
// handler previously updated ANY review by id with no session, so a caller
// could set their own competitor's review to REJECTED or post a fake
// seller_response on another store's review. The caller must now be
// authenticated and the target review must sit on their own product
// (staff may moderate any review).
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, seller_response, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const scope = await requireSellerScope(request);
    if (!scope.ok) return scope.response;

    const target = await prisma.review.findUnique({
      where: { id },
      select: { product: { select: { sellerId: true } } },
    });
    if (!target) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (!scope.elevated && target.product?.sellerId !== scope.sellerId) {
      return NextResponse.json(
        { error: 'Access Denied – this review belongs to another store.' },
        { status: 403 },
      );
    }

    const updatePayload: any = {};
    if (seller_response !== undefined) updatePayload.sellerResponse = seller_response;
    if (status !== undefined) updatePayload.status = status;

    const updated = await prisma.review.update({
      where: { id },
      data: updatePayload
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
