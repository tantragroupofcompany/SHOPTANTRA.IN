import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { MasterCourierService } from '../../../../lib/masterCourierService';

export async function POST(request: Request) {
  try {
    const { cartItems, deliveryPincode } = await request.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart items are required.' }, { status: 400 });
    }

    if (!deliveryPincode) {
      return NextResponse.json({ error: 'Delivery pincode is required.' }, { status: 400 });
    }

    let totalWeight = 0;
    let maxShippingCost = 0;
    const errors: string[] = [];
    const courierOptionsMap: Record<string, { rate: number; days: number; name: string }> = {};

    for (const item of cartItems) {
      const dbProduct = await prisma.product.findUnique({
        where: { id: item.productId || item.product?.id },
        include: {
          seller: {
            include: {
              pickupAddress: true
            }
          }
        }
      });

      if (!dbProduct) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      // Requirement: Prevent seller from receiving orders without verified warehouse
      const pickupAddress = dbProduct.seller?.pickupAddress;
      if (!pickupAddress || pickupAddress.verificationStatus !== 'VERIFIED') {
        return NextResponse.json({
          success: false,
          error: `Seller warehouse for "${dbProduct.title}" is not verified. Warehouse verification status is currently ${pickupAddress?.verificationStatus || 'PENDING'}. Order cannot be processed.`
        }, { status: 400 });
      }

      // Calculate weight for this item (default 0.5kg if not specified)
      const weight = dbProduct.weight ? dbProduct.weight * item.quantity : 0.5 * item.quantity;
      totalWeight += weight;

      // Query rates for this item segment
      const rates = await MasterCourierService.calculateRates(
        pickupAddress.pincode,
        deliveryPincode,
        weight,
        'COD', // Currently platform is COD only
        dbProduct.price * item.quantity
      );

      // Accumulate segment costs to get the total shipping charge
      if (rates && rates.length > 0) {
        const cheapest = rates[0]; // Delhivery is usually first
        maxShippingCost += cheapest.rate;

        // Group courier rates options to present to client
        for (const r of rates) {
          if (!courierOptionsMap[r.code]) {
            courierOptionsMap[r.code] = { rate: 0, days: r.expectedDays, name: r.name };
          }
          courierOptionsMap[r.code].rate += r.rate;
        }
      }
    }

    // Format list of couriers with accumulated rates
    const couriers = Object.entries(courierOptionsMap).map(([code, val]) => ({
      code,
      name: val.name,
      rate: val.rate,
      expectedDays: val.days
    }));

    return NextResponse.json({
      success: true,
      shippingCharge: maxShippingCost,
      totalWeight,
      couriers
    });

  } catch (error: any) {
    console.error('Error calculating shipping charges:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate shipping charges' },
      { status: 500 }
    );
  }
}
