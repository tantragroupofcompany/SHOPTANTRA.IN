export interface ShippingDetails {
  carrier: 'SHIPROCKET' | 'DELHIVERY' | 'BLUEDART';
  trackingNumber: string;
  trackingLink: string;
  courierSlipUrl: string;
  shippingLabelUrl: string;
  expectedDeliveryDate: string;
}

// Re-export the real shipping module (src/lib/shipping/). NOTE: this file shadows
// the directory for the specifier `@/lib/shipping`, so anything consumed from
// '@/lib/shipping' MUST be re-exported here explicitly — otherwise the bundler
// reports "The export X was not found in module [project]/src/lib/shipping.ts".
export {
  getShippingConfig,
  getShippingProvider,
  isShippingEnabled,
  ShippingXpressProvider,
  SHIPPING_XPRESS_CONTRACT,
} from './shipping/index';
export type { ProviderName } from './shipping/index';

/**
 * @deprecated FABRICATES logistics data: it invents a random AWB, tracking link
 * and label/slip paths for SHIPROCKET/DELHIVERY/BLUEDART without contacting any
 * courier. It is no longer reachable from any API route (POST /api/shipping now
 * answers 501) and is kept only so older imports compile. Never use it to
 * represent a real shipment — use src/lib/shipping/shipmentService.ts instead.
 */
export function generateShippingData(carrier: 'SHIPROCKET' | 'DELHIVERY' | 'BLUEDART' = 'DELHIVERY'): ShippingDetails {
  const randomAWB = Math.floor(1000000000 + Math.random() * 9000000000);
  const expectedDate = new Date();
  expectedDate.setDate(expectedDate.getDate() + 5);

  const formattedDate = expectedDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    carrier,
    trackingNumber: `AWB-${randomAWB}`,
    trackingLink: `https://track.shoptantra.in/track?carrier=${carrier}&awb=${randomAWB}`,
    courierSlipUrl: `/shipping/courier_slips/${randomAWB}.pdf`,
    shippingLabelUrl: `/shipping/labels/${randomAWB}.pdf`,
    expectedDeliveryDate: formattedDate,
  };
}
