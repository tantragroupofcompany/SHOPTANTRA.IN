import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';
import {
  isSellerEligibleForAutoPublish,
  resolvePublicationState,
  validatePublishableProduct,
} from '../../../../lib/productPolicy';

// Helper to resolve user ID or seller profile ID to seller profile ID.
// Returns null if neither a seller row with that id nor a seller row whose
// userId matches can be found. NEVER falls through to an arbitrary seller.
async function resolveSellerId(id: string | null): Promise<string | null> {
  if (!id) return null;
  const seller = await prisma.seller.findFirst({
    where: {
      OR: [
        { id: id },
        { userId: id }
      ]
    }
  });
  return seller ? seller.id : null;
}

/**
 * AUTHORIZATION GATE - the fix for a real cross-seller write vulnerability.
 *
 * The route previously resolved ownership purely from a body/query parameter
 * (`sellerId` / `userId`) and never compared it to the authenticated session.
 * Because `/api/seller/*` is only gated on "is the caller a seller of some
 * kind", ANY seller could pass another seller's id and create, edit or delete
 * products on that seller's store.
 *
 * `requireRole` returns the JWT userId. We then require that the target seller
 * row belongs to that user. Executive/ADMIN sessions may act on any seller,
 * which is the only deliberate cross-seller capability, and it stays read of
 * `role` rather than trusting a request field.
 */
async function requireSeller(request: Request): Promise<
  { ok: true; sellerId: string; actingRole: string; userId?: string } | NextResponse
> {
  const guard = await requireRole(request as any, ['SELLER', 'ADMIN', 'FOUNDER', 'CEO_MD']);
  if (guard instanceof NextResponse) return guard;

  const actingRole = (guard as any).role as string;
  const sessionUserId = (guard as any).userId as string | undefined;

  const seller = await prisma.seller.findFirst({
    where: sessionUserId ? { userId: sessionUserId } : undefined,
  });

  // Executives/admins are not sellers, so they have no own-seller row; they are
  // allowed through and the caller resolves the target seller from the request.
  if (!seller) {
    if (actingRole === 'ADMIN' || actingRole === 'FOUNDER' || actingRole === 'CEO_MD') {
      return { ok: true, sellerId: '', actingRole, userId: sessionUserId };
    }
    return NextResponse.json({ error: 'Seller profile not found for this account' }, { status: 403 });
  }

  return { ok: true, sellerId: seller.id, actingRole, userId: sessionUserId };
}

/**
 * Normalize an `images` value into a canonical JSON array of
 * `{ url, is_primary }` entries. Accepts: a JSON string, an array of URL
 * strings, an array of `{url}` / `{image}` objects, a single URL string, or an
 * object with a `.url` / `.image` field. Any value that is undefined / null /
 * empty / malformed is reduced to a safe `[]` so the database never stores an
 * invalid image value (no undefined, no bare null, no junk JSON).
 */
function normalizeImages(images: unknown): string {
  let parsed: unknown = images;

  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = null;
      }
    } else if (trimmed) {
      parsed = [trimmed]; // plain single URL string
    } else {
      parsed = null;
    }
  }

  const entries: { url: string; is_primary: boolean }[] = [];
  const push = (value: unknown) => {
    let url = '';
    if (typeof value === 'string') {
      url = value.trim();
    } else if (value && typeof value === 'object') {
      const candidate =
        (value as { url?: unknown }).url ?? (value as { image?: unknown }).image;
      if (typeof candidate === 'string') url = candidate.trim();
    }
    if (url && !entries.some((e) => e.url === url)) {
      entries.push({ url, is_primary: entries.length === 0 });
    }
  };

  if (Array.isArray(parsed)) {
    parsed.forEach(push);
  } else if (parsed && typeof parsed === 'object') {
    push((parsed as { url?: unknown }).url);
  }

  return JSON.stringify(entries);
}

// GET /api/seller/products
export async function GET(request: Request) {
  try {
    const auth = await requireSeller(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');

    // A seller may ONLY ever read their own catalogue. Previously any seller (or
    // executive) could read another seller's product list by passing their id.
    const sellerId =
      auth.sellerId || (await resolveSellerId(sellerIdParam));
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' }
    });

    // Format products to return matching camelCase or snake_case as expected
    const formattedProducts = products.map(product => {
      let productImages: any[] = [];
      if (product.images) {
        try {
          productImages = JSON.parse(product.images);
        } catch (e) {
          console.warn('Failed to parse product images JSON:', e);
        }
      }
      if (productImages.length === 0) {
        productImages = [{ url: '/placeholder.jpg', isPrimary: true }];
      }

      return {
        id: product.id,
        seller_id: product.sellerId,
        title: product.title,
        price: product.price,
        compare_price: product.comparePrice,
        stock: product.stock,
        category: product.category,
        short_description: product.shortDescription,
        description: product.description,
        sku: product.sku,
        barcode: product.barcode,
        status: product.status,
        tags: product.tags,
        weight: product.weight,
        weight_unit: product.weightUnit,
        dimension_length: product.dimensionLength,
        dimension_width: product.dimensionWidth,
        dimension_height: product.dimensionHeight,
        package_type: product.packageType,
        shipping_class: product.shippingClass,
        fragile: product.fragile,
        dangerous_goods: product.dangerousGoods,
        country_of_origin: product.countryOfOrigin,
        hsn_code: product.hsnCode,
        estimated_packing_time: product.estimatedPackingTime,
        created_at: product.createdAt,
        product_images: productImages
      };
    });

    return NextResponse.json({ success: true, data: formattedProducts });
  } catch (error: any) {
    console.error('Error fetching seller products:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/seller/products
export async function POST(request: Request) {
  try {
    // Enforce that the caller owns the catalogue being written to. A plain
    // SELLER is always scoped to their own seller row; only ADMIN/FOUNDER/CEO_MD
    // may target another seller, and then only via an explicit sellerId.
    const auth = await requireSeller(request);
    if (auth instanceof NextResponse) return auth;
    const isExecutive =
      auth.actingRole === 'ADMIN' || auth.actingRole === 'FOUNDER' || auth.actingRole === 'CEO_MD';

    const body = await request.json();
    const {
      sellerId: sellerIdParam,
      userId,
      title,
      price,
      comparePrice,
      stock,
      category,
      shortDescription,
      description,
      sku,
      barcode,
      status,
      images,
      variants,
      tags,
      weight,
      weightUnit,
      dimensionLength,
      dimensionWidth,
      dimensionHeight,
      packageType,
      shippingClass,
      fragile,
      dangerousGoods,
      countryOfOrigin,
      hsnCode,
      estimatedPackingTime
    } = body;

    const idToResolve = sellerIdParam || userId;
    if (!idToResolve && !isExecutive) {
      return NextResponse.json({ error: 'sellerId or userId is required' }, { status: 400 });
    }

    const sellerId = isExecutive
      ? await resolveSellerId(idToResolve)
      : auth.sellerId;
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Validation is now shared with the publication policy so a product that
    // cannot be published is rejected up front rather than created invalid.
    const validationErrors = validatePublishableProduct({ title, price, category, stock });
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid product: ' + validationErrors.join('; ') },
        { status: 400 }
      );
    }

    // Load the seller row so publication state can be decided from real
    // account status rather than anything the request body claims.
    const sellerRow = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, status: true, verificationStatus: true },
    });

    const sellerEligible = isSellerEligibleForAutoPublish(sellerRow);
    const { status: initialStatus, approvalStatus, autoPublished } =
      resolvePublicationState(sellerEligible);

    const imagesJson = normalizeImages(images);
    const variantsJson = typeof variants === 'string' ? variants : JSON.stringify(variants || []);

    const newProduct = await prisma.product.create({
      data: {
        sellerId,
        title,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        stock: parseInt(stock) || 0,
        category,
        shortDescription: shortDescription || null,
        description: description || null,
        sku: sku || null,
        barcode: barcode || null,
        // AUTOMATIC APPROVAL / PUBLICATION.
        //
        // ROOT CAUSE of the long-standing "FACE WASH ... Status: DRAFT" report:
        // this route used to clamp every product into ['DRAFT','PENDING'], so a
        // seller's product could never reach a live state from this API. It was
        // only ever published by a separate manual executive approval action,
        // and a seller posting an unrecognised status silently fell back to
        // 'PENDING'. The seller UI defaults its status field to 'DRAFT', so
        // virtually every real product landed as DRAFT and stayed invisible on
        // the storefront (which only serves ACTIVE) forever.
        //
        // Now a verified, active seller gets ACTIVE + approvalStatus APPROVED
        // the moment the product is valid, so it is immediately eligible for the
        // homepage, category, search, product detail, cart and checkout. The
        // published state comes from the SERVER-SIDE policy, never from the
        // request body, so a seller still cannot self-approve a blocked,
        // suspended, rejected or unverified account - those store PENDING and
        // wait for review.
        status: initialStatus,
        approvalStatus,
        images: imagesJson,
        variants: variantsJson,
        tags: tags || null,
        weight: weight ? parseFloat(weight) : null,
        weightUnit: weightUnit || 'kg',
        dimensionLength: dimensionLength ? parseFloat(dimensionLength) : null,
        dimensionWidth: dimensionWidth ? parseFloat(dimensionWidth) : null,
        dimensionHeight: dimensionHeight ? parseFloat(dimensionHeight) : null,
        packageType: packageType || 'box',
        shippingClass: shippingClass || 'standard',
        fragile: fragile === true,
        dangerousGoods: dangerousGoods === true,
        countryOfOrigin: countryOfOrigin || 'India',
        hsnCode: hsnCode || null,
        estimatedPackingTime: estimatedPackingTime ? parseInt(estimatedPackingTime) : 24
      }
    });

    return NextResponse.json({
      success: true,
      data: newProduct,
      // Explicit, honest confirmation of the publication outcome so the seller
      // UI can tell the user whether the product went live or is awaiting review.
      autoPublished,
      status: newProduct.status,
      approvalStatus: newProduct.approvalStatus,
    });
  } catch (error: any) {
    console.error('Error creating seller product:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/seller/products
export async function PUT(request: Request) {
  try {
    // Ownership gate: a seller may only edit products on their own store.
    const auth = await requireSeller(request);
    if (auth instanceof NextResponse) return auth;
    const isExecutive =
      auth.actingRole === 'ADMIN' || auth.actingRole === 'FOUNDER' || auth.actingRole === 'CEO_MD';

    const body = await request.json();
    const {
      id,
      title,
      price,
      comparePrice,
      stock,
      category,
      shortDescription,
      description,
      sku,
      barcode,
      status,
      images,
      variants,
      tags,
      weight,
      weightUnit,
      dimensionLength,
      dimensionWidth,
      dimensionHeight,
      packageType,
      shippingClass,
      fragile,
      dangerousGoods,
      countryOfOrigin,
      hsnCode,
      estimatedPackingTime
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true, approvalStatus: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // A seller may only modify a product that belongs to their own store. This
    // closes the cross-seller write hole on the update path.
    if (!isExecutive && existing.sellerId !== auth.sellerId) {
      return NextResponse.json(
        { error: 'You are not allowed to modify this product.' },
        { status: 403 }
      );
    }

    const updatePayload: any = {};
    if (title !== undefined) updatePayload.title = title;
    if (price !== undefined) updatePayload.price = parseFloat(price);
    if (comparePrice !== undefined) updatePayload.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
    if (stock !== undefined) updatePayload.stock = parseInt(stock) || 0;
    if (category !== undefined) updatePayload.category = category;
    if (shortDescription !== undefined) updatePayload.shortDescription = shortDescription;
    if (description !== undefined) updatePayload.description = description;
    if (sku !== undefined) updatePayload.sku = sku;
    if (barcode !== undefined) updatePayload.barcode = barcode;
    // STATUS HANDLING ON UPDATE.
    //
    // A seller edit must never silently unpublish a live product. Previously any
    // edit that carried a non-DRAFT/PENDING status was forced back to 'PENDING',
    // which took an ACTIVE product off the storefront as a side effect of e.g.
    // fixing a typo or adjusting stock. Now:
    //   - the request status is ignored for publication purposes; it is NOT a
    //     publication control and a seller cannot self-approve into ACTIVE.
    //   - a product that is currently live stays live (status preserved), and its
    //     approvalStatus is normalised to APPROVED so the two agree.
    //   - a product that is currently not live is re-evaluated against the same
    //     seller-eligibility policy used at creation, so an eligible seller can
    //     finish an incomplete draft and have it publish, while an ineligible
    //     seller stays PENDING.
    const ownerRow = await prisma.seller.findUnique({
      where: { id: existing.sellerId },
      select: { status: true, verificationStatus: true },
    });
    const eligible = isSellerEligibleForAutoPublish(ownerRow);

    const currentStatus = String(existing.status || '').trim().toUpperCase();
    if (currentStatus === 'ACTIVE') {
      updatePayload.status = 'ACTIVE';
      updatePayload.approvalStatus = 'APPROVED';
    } else {
      const next = resolvePublicationState(eligible);
      updatePayload.status = next.status;
      updatePayload.approvalStatus = next.approvalStatus;
    }
    if (tags !== undefined) updatePayload.tags = tags;
    if (weight !== undefined) updatePayload.weight = weight ? parseFloat(weight) : null;
    if (weightUnit !== undefined) updatePayload.weightUnit = weightUnit;
    if (dimensionLength !== undefined) updatePayload.dimensionLength = dimensionLength ? parseFloat(dimensionLength) : null;
    if (dimensionWidth !== undefined) updatePayload.dimensionWidth = dimensionWidth ? parseFloat(dimensionWidth) : null;
    if (dimensionHeight !== undefined) updatePayload.dimensionHeight = dimensionHeight ? parseFloat(dimensionHeight) : null;
    if (packageType !== undefined) updatePayload.packageType = packageType;
    if (shippingClass !== undefined) updatePayload.shippingClass = shippingClass;
    if (fragile !== undefined) updatePayload.fragile = fragile === true;
    if (dangerousGoods !== undefined) updatePayload.dangerousGoods = dangerousGoods === true;
    if (countryOfOrigin !== undefined) updatePayload.countryOfOrigin = countryOfOrigin;
    if (hsnCode !== undefined) updatePayload.hsnCode = hsnCode;
    if (estimatedPackingTime !== undefined) updatePayload.estimatedPackingTime = parseInt(estimatedPackingTime);

    if (images !== undefined) {
      updatePayload.images = normalizeImages(images);
    }
    if (variants !== undefined) {
      updatePayload.variants = typeof variants === 'string' ? variants : JSON.stringify(variants);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updatePayload
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error('Error updating seller product:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/seller/products
export async function DELETE(request: Request) {
  try {
    // Ownership gate on delete, identical to the update path.
    const auth = await requireSeller(request);
    if (auth instanceof NextResponse) return auth;
    const isExecutive =
      auth.actingRole === 'ADMIN' || auth.actingRole === 'FOUNDER' || auth.actingRole === 'CEO_MD';

    const assertOwnership = async (productId: string) => {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { sellerId: true },
      });
      if (!product) return { ok: false as const, code: 404, error: 'Product not found' };
      if (!isExecutive && product.sellerId !== auth.sellerId) {
        return { ok: false as const, code: 403, error: 'You are not allowed to delete this product.' };
      }
      return { ok: true as const };
    };

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      // Try from request body if not in searchParams
      try {
        const body = await request.json();
        if (body && body.id) {
          const guard = await assertOwnership(body.id);
          if (!guard.ok) {
            return NextResponse.json({ error: guard.error }, { status: guard.code });
          }
          const deleted = await prisma.product.delete({ where: { id: body.id } });
          return NextResponse.json({ success: true, data: deleted });
        }
      } catch (e) {
        // Fall through
      }
      return NextResponse.json({ error: 'Product ID is required for deletion' }, { status: 400 });
    }

    const guard = await assertOwnership(id);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.code });
    }

    const deletedProduct = await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: deletedProduct });
  } catch (error: any) {
    console.error('Error deleting seller product:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
