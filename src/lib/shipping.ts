export interface ShippingDetails {
  carrier: 'SHIPROCKET' | 'DELHIVERY' | 'BLUEDART';
  trackingNumber: string;
  trackingLink: string;
  courierSlipUrl: string;
  shippingLabelUrl: string;
  expectedDeliveryDate: string;
}

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
