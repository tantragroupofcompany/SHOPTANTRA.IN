import { NextResponse } from 'next/server';
import { generateShippingData } from '../../../lib/shipping';

export async function POST(request: Request) {
  try {
    const { carrier } = await request.json();
    const shippingDetails = generateShippingData(carrier);
    return NextResponse.json({ success: true, data: shippingDetails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate shipping details' }, { status: 500 });
  }
}
