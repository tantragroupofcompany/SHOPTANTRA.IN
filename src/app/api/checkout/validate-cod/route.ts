import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Max limit for COD orders to reduce RTO (Return to Origin) risks
const COD_MAX_AMOUNT = 5000; 

export async function POST(request: Request) {
  try {
    const { amount, pincode } = await request.json();

    if (!amount || !pincode) {
      return NextResponse.json({ error: 'Amount and pincode are required.' }, { status: 400 });
    }

    if (amount > COD_MAX_AMOUNT) {
      return NextResponse.json({
        isEligible: false,
        reason: `Cash on Delivery is not available for orders above ₹${COD_MAX_AMOUNT}.`
      });
    }

    const serviceability = await prisma.pincodeServiceability.findUnique({
      where: { pincode }
    });

    // When the serviceability table has not yet been seeded, default to allowing
    // COD so that production orders are not rejected due to missing seed data.
    // Pincodes can be blocked explicitly once the table is populated.
    if (!serviceability) {
      return NextResponse.json({
        isEligible: true,
        reason: 'Cash on Delivery available.',
        isMetro: false,
        estimatedDays: 7
      });
    }

    if (!serviceability.allowCod) {
      return NextResponse.json({
        isEligible: false,
        reason: 'Cash on Delivery is not supported in your area. Please use online payment.'
      });
    }

    return NextResponse.json({
      isEligible: true,
      reason: 'Cash on Delivery available.',
      isMetro: serviceability.isMetro,
      estimatedDays: serviceability.deliveryDays
    });

  } catch (error) {
    console.error('Error validating COD:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
