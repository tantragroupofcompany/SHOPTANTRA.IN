/**
 * SHOP TANTRA — Shipping Provider Abstractions
 *
 * A `ShippingProvider` is a pluggable strategy (Phase 2 of the Shipping Xpress
 * integration). ShopTantra talks to every logistics provider exclusively through
 * these contracts, so the checkout / order flow never hard-codes a carrier.
 *
 * SECURITY: implementations MUST keep provider credentials server-side only and
 * must never surface raw provider responses / tokens to the browser.
 */

export type ProviderName = 'SHIPPING_XPRESS' | 'MASTER_ACCOUNT' | string;

export type ShipmentStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'BOOKED'
  | 'PICKUP_REQUESTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'NDR'
  | 'RTO'
  | 'RETURNED'
  | 'FAILED'
  | 'PENDING'
  | 'PENDING_PROVIDER_CONFIRMATION';

export type PaymentMode = 'PREPAID' | 'COD';

export interface AddressInput {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface PickupAddressInput extends AddressInput {
  /** Owning ShopTantra seller (Shipment rows are grouped per seller). */
  sellerId?: string | null;
  storeName?: string | null;
  contactName?: string | null;
  /**
   * Provider-side pickup location / warehouse identifier.
   * For Shipping Xpress this maps to the warehouse location id shown in the
   * merchant dashboard (field name confirmed against the dashboard by the
   * seller). Kept generic here so the same column serves every provider.
   */
  pickupLocationId?: string | null;
}

export interface ShipmentItemInput {
  productId?: string | null;
  title: string;
  sku?: string | null;
  quantity: number;
  price: number; // unit price, INR
  total: number; // line total, INR
  weight?: number | null; // kg
  length?: number | null; // cm
  width?: number | null; // cm
  height?: number | null; // cm
  description?: string | null;
}

export interface CreateShipmentInput {
  orderId: string; // ShopTantra order id (UUID)
  orderNumber: string; // ShopTantra order number (human readable)
  sellerId: string;
  sellerName?: string | null;
  pickupAddress: PickupAddressInput;
  shippingAddress: AddressInput;
  items: ShipmentItemInput[];
  weight: number; // total kg
  length?: number | null;
  width?: number | null;
  height?: number | null;
  paymentMode: PaymentMode;
  codAmount?: number; // INR (0 for prepaid)
  declaredAmount?: number; // INR (sum of line totals)
  provider: ProviderName;
  /**
   * Unique per (order, seller). Prevents duplicate shipment creation across
   * retries, webhook re-deliveries and double-clicks (Phase 9 idempotency).
   */
  idempotencyKey: string;
}

export interface CreateShipmentResult {
  provider: ProviderName;
  success: boolean;
  status: ShipmentStatus;
  providerShipmentId?: string | null;
  providerOrderId?: string | null;
  awb?: string | null;
  trackingNumber?: string | null;
  trackingLink?: string | null;
  labelUrl?: string | null;
  shippingCost?: number | null;
  /** Cash-on-delivery amount booked with the carrier (0 for prepaid). */
  codAmount?: number | null;
  courierName?: string | null;
  failureReason?: string | null;
  /**
   * Raw provider response (token-free). Stored only on the server. Never sent
   * to the browser verbatim.
   */
  rawResponse: unknown;
}

export interface ShipmentStatusUpdate {
  status: ShipmentStatus;
  location?: string | null;
  message?: string | null;
  timestamp?: string | null;
}

export interface ProviderCapabilities {
  /** VERIFIED live: `POST /api/order/store` (HTTP 422 on validation failure). */
  createShipment: boolean;
  /** VERIFIED absent: `GET /api/order/track` → HTTP 404. */
  getTracking: boolean;
  /** VERIFIED absent: `GET /api/order/cancel` → HTTP 404. */
  cancelShipment: boolean;
  /** VERIFIED absent: `GET /api/order/label` → HTTP 404. */
  generateLabel: boolean;
  /** VERIFIED absent: `GET /api/pickup/{store,list}` → HTTP 404. */
  requestPickup: boolean;
  /** VERIFIED absent: `GET /api/rate/calculate` → HTTP 404. */
  getShippingRate: boolean;
  checkServiceability: boolean;
}

export interface ConnectionTestResult {
  configured: boolean; // token + base url present
  reachable: boolean; // host responded
  /** True only when the endpoint accepted the bearer token (proved by an
   *  authenticated 422 validation response rather than a 401). */
  authorized?: boolean;
  statusCode?: number;
  provider: ProviderName;
  /** Safe, token-free explanation (validation/auth message from the provider). */
  message?: string;
  error?: string;
}

/**
 * Raised when a capability is NOT officially supported by the provider. Thrown
 * instead of inventing an endpoint/fields that may not exist.
 */
export class ProviderNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderNotSupportedError';
  }
}

/**
 * Abstract contract every shipping provider implements. Methods for
 * capabilities the provider does not officially support MUST throw
 * `ProviderNotSupportedError` — never a silent fake response.
 */
export abstract class ShippingProvider {
  abstract readonly name: ProviderName;
  abstract readonly capabilities: ProviderCapabilities;

  abstract createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  abstract getTracking(trackingNumber: string): Promise<ShipmentStatusUpdate[]>;
  abstract cancelShipment(providerShipmentId: string): Promise<{ success: boolean; failureReason?: string }>;
  abstract requestPickup(shipment: CreateShipmentInput): Promise<{ success: boolean; failureReason?: string }>;
  abstract testConnection(): Promise<ConnectionTestResult>;
}
