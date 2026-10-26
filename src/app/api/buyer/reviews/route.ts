import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { readBuyerSession } from '../../../../lib/buyerAuth';

// POST /api/buyer/reviews
//
// Creates a product review for the authenticated buyer. Enforces:
//   1. Valid session (auth_token or corporate_auth_token cookie)
//   2. Buyer-facing roles only (BUYER, ADMIN, FOUNDER, CEO_MD, CHAIRMAN, SELLER)
//   3. Product must exist
//   4. Rating must be 1..5
//   5. At most one review per (product, buyer) — duplicates are rejected
//      both at the application level (explicit check) and at the database
//      level (unique constraint on Review.productId + Review.userId).
//
// Review status is "pending" until moderated by a seller/admin via
// PATCH /api/seller/reviews (status: approved | rejected | quarantined).
export async function POST(request: Request) {
  try {
    const session = await readBuyerSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required to submit a review.' },
        { status: 401 },
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 },
      );
    }

    const { productId, rating, comment } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'productId is required.' },
        { status: 400 },
      );
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: 'rating must be an integer between 1 and 5.' },
        { status: 400 },
      );
    }

    const commentStr = String(comment ?? '').trim();
    if (commentStr.length === 0) {
      return NextResponse.json(
        { error: 'comment is required.' },
        { status: 400 },
      );
    }

    // Product must exist.
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Duplicate prevention: a buyer may submit at most one review per product.
    const existing = await prisma.review.findFirst({
      where: { productId, userId: session.userId },
      select: { id: true, status: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: 'You have already submitted a review for this product.',
          reviewId: existing.id,
          existingStatus: existing.status,
        },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.userId,
        rating: ratingNum,
        comment: commentStr,
        status: 'pending',
      },
      select: {
        id: true,
        productId: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, data: review },
      { status: 201 },
    );
  } catch (error: any) {
    // Unique-constraint violation (race condition or constraint already present)
    // means a duplicate review was attempted.
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already submitted a review for this product.' },
        { status: 409 },
      );
    }
    console.error('Error creating review:', error?.message || error);
    return NextResponse.json(
      { error: 'Unable to submit review. Please try again.' },
      { status: 500 },
    );
  }
}
