/**
 * SHOP TANTRA — Pure shipping helpers (Phase 2 / Phase 7 / Phase 9).
 *
 * Framework-free and DB-free so they can be unit tested in isolation.
 */
import type { PaymentMode, ShipmentStatus, ProviderName } from './types';

export interface SellerForShipping {
  id: string;
  storeName?: string | null;
  status: string; // PENDING | ACTIVE | SUSPENDED
  verificationStatus: string; // PENDING_VERIFICATION | VERIFIED | ...
}

export interface PickupForShipping {
  id: string;
  sellerId: string;
  storeName: string;
  contactName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  pickupLocationId?: string | null;
  verificationStatus: string; // PENDING | VERIFIED | REJECTED
}

export interface GroupItem {
  /** ShopTantra OrderItem id — used to link items to the created Shipment. */
  orderItemId?: string | null;
  productId?: string | null;
  title: string;
  sku?: string | null;
  quantity: number;
  price: number;
  total: number;
  sellerId: string; // resolved from product.sellerId
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  description?: string | null;
}

/** Phase 7 — one seller/pickup location => one shipment. Groups line items by seller. */
export function groupItemsBySeller(items: GroupItem[]): Record<string, GroupItem[]> {
  const grouped: Record<string, GroupItem[]> = {};
  if (!Array.isArray(items)) return grouped;
  for (const item of items) {
    const sellerId = item.sellerId || 'default-seller';
    if (!grouped[sellerId]) grouped[sellerId] = [];
    grouped[sellerId].push({ ...item, sellerId });
  }
  return grouped;
}

/** Phase 9 — deterministic idempotency key preventing duplicate provider orders. */
export function computeIdempotencyKey(orderNumber: string, sellerId: string, provider: ProviderName): string {
  return `${provider}:${orderNumber}:${sellerId}`;
}

/**
 * Phase 4 / Phase 6 pre-flight: an approved+active+verified seller with a
 * verified pickup location (and a provider warehouse id for Xpress) is required.
 * Returns null when eligible; otherwise a human-readable block reason.
 */
export function validateSellerForShipment(
  seller: SellerForShipping | null | undefined,
  pickup: PickupForShipping | null | undefined,
  provider: ProviderName,
  options: { requirePickupLocationId?: boolean } = {}
): string | null {
  if (!seller) return 'Seller profile not found for this order.';
  if (seller.status !== 'ACTIVE') {
    return `Seller account is not active (status=${seller.status}). Shipment blocked until approved and active.`;
  }
  if (seller.verificationStatus !== 'VERIFIED' && seller.verificationStatus !== 'verified') {
    return `Seller verification is not complete (status=${seller.verificationStatus}).`;
  }
  if (!pickup) {
    return 'Seller has no pickup location on file. A verified pickup location is required.';
  }
  if (pickup.verificationStatus !== 'VERIFIED' && pickup.verificationStatus !== 'verified') {
    return `Pickup location verification is not complete (status=${pickup.verificationStatus}).`;
  }
  // VERIFIED LIVE: `POST /api/order/store` accepts NO origin/warehouse field —
  // the pickup location is bound to the API token on the provider side. Mapping
  // `PickupAddress.pickupLocationId` is therefore OPTIONAL and only enforced when
  // the shop explicitly opts in via `requirePickupLocationId`.
  if (provider === 'SHIPPING_XPRESS' && options.requirePickupLocationId && !pickup.pickupLocationId) {
    return 'Shipping Xpress pickup location id is required by configuration (SHIPPING_XPRESS_REQUIRE_PICKUP_LOCATION_ID=true) but is not mapped for this seller.';
  }
  return null;
}

/** Package metrics fallback. Never send zero weight/dims to a carrier. */
export function aggregatePackageMetrics(items: GroupItem[], fallbackWeight = 0.5): {
  weight: number; length: number; width: number; height: number;
} {
  let weight = 0;
  let length = 0;
  let width = 0;
  let height = 0;
  let hasDims = false;
  for (const it of items) {
    const w = it.weight ?? 0;
    weight += w * it.quantity;
    if (it.length && it.width && it.height) {
      hasDims = true;
      length = Math.max(length, it.length);
      width = Math.max(width, it.width);
      height = Math.max(height, it.height);
    }
  }
  if (weight <= 0) weight = fallbackWeight;
  if (!hasDims) { length = 25; width = 20; height = 5; }
  return { weight: round2(weight), length: round2(length), width: round2(width), height: round2(height) };
}

export function estimateCodAmount(items: GroupItem[], paymentMode: PaymentMode, extra = 0): number {
  if (paymentMode !== 'COD') return 0;
  return round2(items.reduce((a, it) => a + it.total, 0) + extra);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Shipping Xpress validates `customer.mobile` as a required mobile number.
 * Normalise any Indian phone format to plain digits, dropping a +91 / 0 prefix,
 * so a formatted display value ("+91 98765 43210") never fails validation.
 */
export function normalizeMobile(raw: string | null | undefined): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * `order_date` for POST /api/order/store. VERIFIED: the endpoint accepts the
 * `YYYY-MM-DD` form (probe sent "2026-09-20" and reported no date error).
 */
export function toProviderDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * The endpoint answers HTTP 422 with
 * `{"status":false,"message":"Validation errors occurred.","errors":{"field":["msg"]}}`.
 * Flatten that into one safe, loggable line (values are never echoed back).
 */
export function flattenValidationErrors(errors: unknown, max = 6): string {
  if (!errors || typeof errors !== 'object') return '';
  const parts: string[] = [];
  for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
    const msg = Array.isArray(value) ? value.join(' ') : String(value);
    parts.push(`${field}: ${msg}`);
    if (parts.length >= max) break;
  }
  return parts.join(' | ');
}

/**
 * Map a Shipping Xpress provider status string to a ShopTantra ShipmentStatus.
 * Only statuses commonly used by logistics providers are mapped; anything
 * unknown falls back to PENDING_PROVIDER_CONFIRMATION rather than guessing.
 */
export function mapProviderStatus(raw: string | undefined | null): ShipmentStatus {
  if (!raw) return 'PENDING_PROVIDER_CONFIRMATION';
  const s = String(raw).trim().toLowerCase();
  const table: Record<string, ShipmentStatus> = {
    created: 'CREATED',
    booked: 'BOOKED',
    pickup_requested: 'PICKUP_REQUESTED',
    pickup_scheduled: 'PICKUP_REQUESTED',
    picked_up: 'PICKED_UP',
    pickedup: 'PICKED_UP',
    in_transit: 'IN_TRANSIT',
    transit: 'IN_TRANSIT',
    out_for_delivery: 'OUT_FOR_DELIVERY',
    outfor_delivery: 'OUT_FOR_DELIVERY',
    delivered: 'DELIVERED',
    cancelled: 'CANCELLED',
    canceled: 'CANCELLED',
    cancel: 'CANCELLED',
    ndr: 'NDR',
    rto: 'RTO',
    rto_initiated: 'RTO',
    returned: 'RETURNED',
    return_initiated: 'RETURNED',
    failed: 'FAILED',
    failed_delivery: 'FAILED',
  };
  if (Object.prototype.hasOwnProperty.call(table, s)) return table[s];
  return 'PENDING_PROVIDER_CONFIRMATION';
}

export interface ParsedProviderResponse {
  providerShipmentId?: string | null;
  providerOrderId?: string | null;
  awb?: string | null;
  trackingNumber?: string | null;
  trackingLink?: string | null;
  labelUrl?: string | null;
  shippingCost?: number | null;
  courierName?: string | null;
  status?: string | null;
}

/**
 * Defensively extract AWB/tracking/ids from an *unknown* provider response shape.
 * We never assume a field name that has not been documented.
 */
export function parseProviderResponse(raw: unknown): ParsedProviderResponse {
  if (!raw || typeof raw !== 'object') return {};
  const o: any = raw;
  const nested = o.data ?? o.result ?? o.order ?? o.shipment ?? o;
  const n = nested && typeof nested === 'object' ? nested : o;
  const str = (a: string, b?: string) => {
    const v = n[a] ?? (b ? n[b] : undefined) ?? o[a] ?? (b ? o[b] : undefined);
    return v == null ? null : String(v);
  };
  const num = (a: string, b?: string) => {
    const v = n[a] ?? (b ? n[b] : undefined) ?? o[a] ?? (b ? o[b] : undefined);
    if (v == null) return null;
    const nn = Number(v);
    return Number.isFinite(nn) ? nn : null;
  };
  return {
    providerShipmentId: str('shipment_id', 'provider_shipment_id') ?? str('id'),
    providerOrderId: str('order_id', 'provider_order_id'),
    awb: str('awb', 'awb_number') ?? str('waybill', 'reference_no'),
    trackingNumber: str('tracking_number', 'tracking_no') ?? str('tracking', 'tracking_id'),
    trackingLink: str('tracking_link', 'tracking_url'),
    labelUrl: str('label_url', 'label') ?? str('download_link', 'print_url'),
    shippingCost: num('shipping_cost', 'rate') ?? num('courier_charges', 'amount'),
    courierName: str('courier_name', 'carrier') ?? str('courier_partner', 'partner_name'),
    status: str('status', 'shipment_status'),
  };
}

/**
 * NEVER expose credentials. Masks any key that looks like a secret so raw
 * responses are safe to persist/log even if an endpoint echoes values.
 */
export function sanitizeForLog(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForLog);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const kl = k.toLowerCase();
    if (kl.includes('token') || kl.includes('secret') || kl.includes('password') || kl.includes('authorization') || kl.includes('key')) {
      out[k] = '***MASKED***';
    } else if (v && typeof v === 'object') {
      out[k] = sanitizeForLog(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

