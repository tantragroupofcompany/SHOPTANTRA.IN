import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { originPincode, destPincode } = await request.json();

    if (!destPincode) {
      return NextResponse.json({ error: 'Destination pincode is required.' }, { status: 400 });
    }

    const serviceability = await prisma.pincodeServiceability.findUnique({
      where: { pincode: destPincode }
    });

    if (!serviceability) {
      return NextResponse.json({
        serviceable: false,
        message: 'Delivery to this pincode is currently unavailable via India Post.'
      });
    }

    // Determine estimated days (2-7 days logic based on Metro status and distance mock)
    let estimatedDays = serviceability.deliveryDays;
    let fastDelivery = false;

    if (serviceability.isMetro) {
      estimatedDays = Math.max(2, estimatedDays - 1); // Metros get faster delivery
      fastDelivery = true;
    }

    return NextResponse.json({
      serviceable: true,
      partner: 'India Post',
      estimatedDays,
      fastDeliveryAvailable: fastDelivery,
      message: fastDelivery ? 'Fast Delivery Available' : `Estimated delivery in ${estimatedDays} days`
    });

  } catch (error) {
    console.error('Error estimating India Post delivery:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
