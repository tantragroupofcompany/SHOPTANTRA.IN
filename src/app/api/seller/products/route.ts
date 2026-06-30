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

// GET /api/seller/products
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
    if (!idToResolve) {
      return NextResponse.json({ error: 'sellerId or userId is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(idToResolve);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    if (!title || price === undefined || !category) {
      return NextResponse.json({ error: 'Missing required fields: title, price, category' }, { status: 400 });
    }

    const imagesJson = typeof images === 'string' ? images : JSON.stringify(images || []);
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
        status: status || 'draft',
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

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    console.error('Error creating seller product:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/seller/products
export async function PUT(request: Request) {
  try {
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
    if (status !== undefined) updatePayload.status = status;
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
      updatePayload.images = typeof images === 'string' ? images : JSON.stringify(images);
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      // Try from request body if not in searchParams
      try {
        const body = await request.json();
        if (body && body.id) {
          const deleted = await prisma.product.delete({ where: { id: body.id } });
          return NextResponse.json({ success: true, data: deleted });
        }
      } catch (e) {
        // Fall through
      }
      return NextResponse.json({ error: 'Product ID is required for deletion' }, { status: 400 });
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
