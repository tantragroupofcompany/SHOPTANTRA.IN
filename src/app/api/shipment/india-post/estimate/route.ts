import { NextResponse } from 'next/server';

/**
 * DELETED CARRIER — India Post is NOT a ShopTantra shipping provider.
 *
 * This endpoint used to return India Post Speed Post serviceability and rate
 * estimates (`partner: 'India Post'`). ShopTantra ships through Shipping Xpress
 * ONLY, so quoting India Post would offer buyers a carrier that cannot carry
 * their parcel. No UI ever called this route.
 *
 * Live rates come from POST /api/shipping/calculate. Real bookings come from
 * POST /api/shipment/create.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Not supported: ShopTantra ships through Shipping Xpress only.',
      detail: 'Use POST /api/shipping/calculate for shipping rates.',
    },
    { status: 410 }
  );
}

export async function POST() {
  return GET();
}
