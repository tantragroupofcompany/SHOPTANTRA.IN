import { prisma } from './prisma';

export interface CourierSelectionParams {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number; // in kg
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number;
}

export interface CourierServiceDetails {
  carrier: string;
  carrierName: string;
  awbNumber: string;
  trackingNumber: string;
  trackingLink: string;
  shippingCost: number;
  expectedDeliveryDate: string;
  courierSlipUrl: string;
  shippingLabelUrl: string;
}

/**
 * India Post Speed Post — Manual Shipping Mode
 * 
 * This function always assigns India Post Speed Post as the courier partner.
 * No external shipping API (Shiprocket, Delhivery, etc.) is required.
 * 
 * The seller will:
 * 1. Print the shipping label
 * 2. Pack the parcel
 * 3. Visit the nearest India Post office
 * 4. Ship via Speed Post
 * 5. Manually enter the tracking number in the seller dashboard
 */
export async function autoSelectCourier(params: CourierSelectionParams): Promise<CourierServiceDetails> {
  const { weight, paymentMode, codAmount = 0 } = params;

  // India Post Speed Post rate calculation
  // Base rate: ₹35 prepaid, ₹55 COD (includes COD collection fee)
  const baseRate = paymentMode === 'COD' ? 55 : 35;
  const weightFactor = weight <= 0.5 ? 1 : Math.ceil(weight / 0.5) * 0.8;
  const codCollectionFee = paymentMode === 'COD' ? Math.max(15, codAmount * 0.015) : 0;
  const shippingCost = Math.round(baseRate * weightFactor + codCollectionFee);

  // Expected delivery: India Post Speed Post averages 4-6 business days
  const expectedDate = new Date();
  expectedDate.setDate(expectedDate.getDate() + 5);
  const formattedDate = expectedDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Tracking number and AWB are entered manually by seller after visiting India Post
  // These are placeholder values that will be updated by the seller
  return {
    carrier: 'INDIA_POST',
    carrierName: 'India Post Speed Post',
    awbNumber: 'PENDING',
    trackingNumber: 'PENDING',
    trackingLink: 'https://www.indiapost.gov.in/_layouts/15/dop.indiapost.tracking/tracksp.aspx',
    shippingCost,
    expectedDeliveryDate: formattedDate,
    courierSlipUrl: '',
    shippingLabelUrl: '',
  };
}
