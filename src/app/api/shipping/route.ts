import { NextResponse } from 'next/server';
import { getShippingConfig } from '../../../lib/shipping';

/**
 * LEGACY PLACEHOLDER — this endpoint never booked a shipment.
 *
 * It used to answer 200 with `generateShippingData()`, which invents a random
 * AWB (`AWB-1234567890`), an internal tracking link and label/slip PDF paths for
 * SHIPROCKET / DELHIVERY / BLUEDART. No courier was ever contacted, so the reply
 * could make an operator believe a shipment existed when nothing was ever
 * booked. Fabricated logistics data is worse than an honest error.
 *
 * The real flows are:
 *   POST /api/shipment/create     - one real Shipment row per seller (idempotent)
 *   GET  /api/shipment/list       - read persisted shipments
 *   POST /api/shipping/calculate  - server-side courier rates for a cart
 *   GET  /api/admin/shipping/connection (admin) - live provider reachability test
 *
 * This route now reports provider configuration only and creates nothing.
 */
export async function POST() {
  const config = getShippingConfig();
  return NextResponse.json(
    {
      success: false,
      error: 'Not implemented: this legacy endpoint does not create shipments.',
      detail:
        'Use POST /api/shipment/create for a real shipment, GET /api/shipment/list to read shipments, or POST /api/shipping/calculate for courier rates. No fabricated AWB or label data is returned.',
      provider: config.provider,
      providerEnabled: config.enabled,
    },
    { status: 501 }
  );
}
