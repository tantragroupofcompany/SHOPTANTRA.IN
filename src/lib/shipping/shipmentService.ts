/**
 * SHOP TANTRA — Shipment orchestration service (Phases 2, 4, 6, 7, 9, 16).
 *
 * Single source of truth for turning an Order into one-or-more Shipments,
 * grouped per seller/pickup location (Phase 7), with idempotency (Phase 9),
 * graceful provider fallback (Phase 17) and safe async triggering (Phase 6).
 *
 * SCHEMA NOTES (must match prisma/schema.prisma exactly):
 *   - Seller 1—1 PickupAddress  (Seller.pickupAddress / PickupAddress.sellerId @unique)
 *   - Order → items (OrderItem) → product → seller
 *   - Order → buyer (User)      (Order has NO buyerName/buyerPhone columns)
 *   - Shipment → courierPartner (CourierPartner), provider columns added by the
 *     20260826000000_shipping_xpress_integration migration.
 *
 * Stock is decremented ONCE at order creation (see lib/orderProcessor.ts), so
 * this service never touches stock — it only books a carrier order and links
 * the already-created OrderItems to their Shipment row.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { getShippingProvider, isShippingEnabled } from './config';
import { MasterCourierService } from '../masterCourierService';
import type { CreateShipmentInput, CreateShipmentResult, ShipmentStatus } from './types';
import {
  groupItemsBySeller,
  computeIdempotencyKey,
  validateSellerForShipment,
  aggregatePackageMetrics,
  estimateCodAmount,
  sanitizeForLog,
} from './helpers';
import type { GroupItem, SellerForShipping, PickupForShipping } from './helpers';

export interface CreatedShipmentView {
  id: string;
  shipmentNumber: string;
  provider: string;
  awbNumber: string | null;
  trackingNumber: string | null;
  trackingLink: string | null;
  labelUrl: string | null;
  status: string;
  shippingCost: number;
  codAmount: number;
  providerShipmentId: string | null;
  failureReason: string | null;
  source: 'PROVIDER' | 'FALLBACK' | 'BLOCKED';
}

export interface ShipmentPreflightResult {
  eligible: boolean;
  reason: string | null;
  sellerId: string;
  pickupLocationMapped: boolean;
  deliveryPincode: string | null;
}

const SHIPMENT_PROVIDER = 'SHIPPING_XPRESS' as const;
const MASTER_PROVIDER = 'MASTER_ACCOUNT' as const;

/**
 * Opt-in flag. The local master-account path (`MasterCourierService`) is a
 * SIMULATION that fabricates AWB numbers, so it is never used as an automatic
 * "successful" booking unless a deployment explicitly enables it.
 */
function allowLocalFallback(): boolean {
  return String(process.env.SHIPPING_LOCAL_FALLBACK_ENABLED || '').toLowerCase() === 'true';
}

/**
 * Optional strict mode. The verified Shipping Xpress contract takes no origin /
 * warehouse field (the pickup address belongs to the account behind the token),
 * so mapping a pickup location id is NOT required by default.
 */
function requirePickupLocationId(): boolean {
  return String(process.env.SHIPPING_XPRESS_REQUIRE_PICKUP_LOCATION_ID || '').toLowerCase() === 'true';
}

/** Phase 6 — normalise the many historic Order.shippingAddress shapes. */
export function normalizeShippingAddress(order: any): {
  fullName: string; phone: string; email: string;
  addressLine1: string; addressLine2: string | null;
  city: string; state: string; pincode: string; country: string;
} | null {
  const sa = order?.shippingAddress;
  let raw: any = sa;
  if (typeof sa === 'string') {
    try { raw = JSON.parse(sa); } catch { raw = null; }
  }
  if (!raw || typeof raw !== 'object') return null;

  const buyer = order?.buyer || null;
  const pick = (...vals: any[]) => {
    for (const v of vals) {
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };

  const normalized = {
    fullName: pick(raw.fullName, raw.full_name, raw.name, raw.customerName, buyer?.fullName),
    phone: pick(raw.phone, raw.mobile, raw.contactPhone, buyer?.phone),
    email: pick(raw.email, buyer?.email),
    addressLine1: pick(raw.addressLine1, raw.address_line1, raw.address, raw.line1),
    addressLine2: pick(raw.addressLine2, raw.address_line2, raw.address2, raw.line2) || null,
    city: pick(raw.city, raw.town),
    state: pick(raw.state, raw.deliveryState),
    pincode: pick(raw.pincode, raw.postalCode, raw.zip, raw.pin),
    country: pick(raw.country) || 'India',
  };

  // A usable delivery address needs a name and at least an address line.
  if (!normalized.fullName || !normalized.addressLine1) return null;
  return normalized;
}

/** Map OrderItem rows (with product include) to the provider-agnostic group shape. */
export function toGroupItems(items: any[]): GroupItem[] {
  return (items || []).map((it) => ({
    orderItemId: it.id ?? null,
    productId: it.productId ?? it.product?.id ?? null,
    title: it.title || it.product?.title || 'Item',
    sku: it.product?.sku ?? null,
    quantity: Number(it.quantity) || 1,
    price: Number(it.price) || 0,
    total: Number(it.total) || 0,
    sellerId: it.product?.sellerId || it.sellerId || '',
    weight: typeof it.product?.weight === 'number' ? it.product.weight : null,
    length: it.product?.dimensionLength ?? null,
    width: it.product?.dimensionWidth ?? null,
    height: it.product?.dimensionHeight ?? null,
    description: it.product?.shortDescription ?? null,
  }));
}

/** Resolve (or lazily create) the CourierPartner row backing a shipment. */
async function resolveCourierPartnerId(courierName: string | null | undefined, provider: string): Promise<string | null> {
  const name = (courierName || '').trim();
  if (!name) return null;
  const code = `${provider === SHIPMENT_PROVIDER ? 'SXP' : 'MST'}_${name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')}`.slice(0, 60);
  try {
    const existing = await prisma.courierPartner.findFirst({
      where: { OR: [{ code }, { name }] },
    });
    if (existing) return existing.id;
    const created = await prisma.courierPartner.create({
      data: { name, code, isActive: true, baseRatePrepaid: 40, baseRateCOD: 60, averageDeliveryDays: 4 },
    });
    return created.id;
  } catch (e: any) {
    console.warn('Could not resolve courier partner:', sanitizeForLog({ msg: e?.message }));
    return null;
  }
}

/** Determine the stored ShopTantra shipment status from a provider result. */
function statusFromProviderResult(res: CreateShipmentResult): ShipmentStatus {
  if (res.success && res.awb) return 'CONFIRMED';
  if (res.success) return 'BOOKED';
  return 'PENDING_PROVIDER_CONFIRMATION';
}

function createError(msg: string): Error {
  const e = new Error(msg);
  (e as any).code = 'SHIPMENT_VALIDATION_ERROR';
  return e;
}

/**
 * Phase 6 pre-flight validation (no side effects).
 * Returns the first blocking reason, or null when a shipment may be created.
 */
export function evaluateSellerEligibility(
  seller: SellerForShipping | null | undefined,
  pickup: PickupForShipping | null | undefined,
  provider: string,
  options: { requirePickupLocationId?: boolean } = {}
): string | null {
  return validateSellerForShipment(seller, pickup, provider, options);
}

/**
 * Phase 6 — validate an order before any carrier call is made.
 * Used by checkout/admin so an ineligible order is reported instead of shipped.
 */
export async function preflightShipmentEligibility(orderId: string): Promise<ShipmentPreflightResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      items: { include: { product: { include: { seller: true } } } },
      seller: { include: { pickupAddress: true } },
    },
  });
  if (!order) throw createError(`Order ${orderId} not found.`);

  const items = toGroupItems(order.items || []);
  if (!items.length) throw createError('Order has no items.');

  const address = normalizeShippingAddress(order);
  const sellerId = items[0]?.sellerId || order.sellerId || '';
  const seller = sellerId
    ? await prisma.seller.findUnique({ where: { id: sellerId }, include: { pickupAddress: true } })
    : order.seller;

  const reason =
    validateSellerForShipment(
      seller
        ? { id: seller.id, storeName: seller.storeName, status: seller.status, verificationStatus: seller.verificationStatus }
        : null,
      (seller?.pickupAddress as PickupForShipping | null) ?? null,
      SHIPMENT_PROVIDER,
      { requirePickupLocationId: requirePickupLocationId() }
    ) || (address ? null : 'Buyer delivery address is incomplete.');

  return {
    eligible: !reason,
    reason,
    sellerId,
    pickupLocationMapped: !!seller?.pickupAddress?.pickupLocationId,
    deliveryPincode: address?.pincode || null,
  };
}


/**
 * Main entry: create one shipment per seller (Phase 7). Idempotent (Phase 9).
 * No-ops silently when Shipping Xpress is disabled so the existing
 * master-account flow is preserved.
 */
export async function createShipmentsForOrder(params: {
  orderId: string;
  paymentMode: 'PREPAID' | 'COD';
  autoTrigger?: boolean;
}): Promise<{ shipments: CreatedShipmentView[]; blocked: boolean; reason?: string | null }> {
  if (!isShippingEnabled()) return { shipments: [], blocked: false, reason: null };
  if (params.autoTrigger === false) return { shipments: [], blocked: false, reason: null };

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      buyer: true,
      items: { include: { product: { include: { seller: true } } } },
      seller: { include: { pickupAddress: true } },
    },
  });
  if (!order) throw createError(`Order ${params.orderId} not found.`);

  // Phase 6 — never book a carrier order before the payment state is valid.
  const pm = params.paymentMode;
  if (pm === 'PREPAID' && order.paymentStatus !== 'PAID') {
    throw createError(`PREPAID order ${params.orderId} is not paid (status=${order.paymentStatus}).`);
  }
  if (pm === 'COD' && order.paymentStatus !== 'COD_PENDING') {
    throw createError(`COD order ${params.orderId} is not in COD_PENDING (status=${order.paymentStatus}).`);
  }

  const shipAddress = normalizeShippingAddress(order);
  if (!shipAddress) throw createError('Buyer delivery address is incomplete.');

  const items = toGroupItems(order.items || []);
  if (!items.length) throw createError('Order has no items.');

  const grouped = groupItemsBySeller(items);
  const results: CreatedShipmentView[] = [];

  for (const [sellerId, sellerItems] of Object.entries(grouped)) {
    // Phase 9 idempotency: reuse an already-booked shipment for (order, seller).
    const existing = await prisma.shipment.findFirst({
      where: {
        orderId: params.orderId,
        sellerId,
        provider: SHIPMENT_PROVIDER,
        OR: [{ providerShipmentId: { not: null } }, { awbNumber: { not: null } }],
      },
    });
    if (existing) {
      results.push(shipmentToView(existing));
      continue;
    }

    const seller =
      order.seller && order.seller.id === sellerId
        ? order.seller
        : await prisma.seller.findUnique({ where: { id: sellerId }, include: { pickupAddress: true } });

    const pickup = (seller?.pickupAddress as PickupForShipping | null) ?? null;
    const blockReason = validateSellerForShipment(
      seller
        ? { id: seller.id, storeName: seller.storeName, status: seller.status, verificationStatus: seller.verificationStatus }
        : null,
      pickup,
      SHIPMENT_PROVIDER,
      { requirePickupLocationId: requirePickupLocationId() }
    );

    if (blockReason) {
      results.push(await persistBlocked(params.orderId, sellerId, pm, sellerItems, blockReason));
      continue;
    }

    const pkg = aggregatePackageMetrics(sellerItems);
    const idempotencyKey = computeIdempotencyKey(order.orderNumber, sellerId, SHIPMENT_PROVIDER);
    const input: CreateShipmentInput = {
      orderId: params.orderId,
      orderNumber: order.orderNumber,
      sellerId,
      sellerName: pickup?.storeName || seller?.storeName || '',
      idempotencyKey,
      paymentMode: pm,
      codAmount: estimateCodAmount(sellerItems, pm, order.shippingAmount || 0),
      declaredAmount: sellerItems.reduce((a, i) => a + i.total, 0),
      weight: pkg.weight,
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
      items: sellerItems,
      shippingAddress: shipAddress,
      pickupAddress: {
        sellerId,
        fullName: pickup?.contactName || seller?.storeName || 'Seller',
        pickupLocationId: pickup?.pickupLocationId ?? null,
        storeName: pickup?.storeName || seller?.storeName || '',
        contactName: pickup?.contactName || seller?.storeName || '',
        phone: pickup?.phone || '',
        email: pickup?.email || '',
        addressLine1: pickup?.addressLine1 || '',
        addressLine2: pickup?.addressLine2 ?? null,
        city: pickup?.city || '',
        state: pickup?.state || '',
        pincode: pickup?.pincode || '',
        country: pickup?.country || 'India',
      },
    };

    let res: CreateShipmentResult;
    let source: 'PROVIDER' | 'FALLBACK';
    const provider = getShippingProvider();
    if (!provider) {
      // Reached only when the provider registry is empty; the marketplaces flow
      // normally no-ops earlier via `isShippingEnabled()`.
      res = await localFallback(pm, input, sellerItems);
      source = 'FALLBACK';
    } else {
      try {
        res = await provider.createShipment(input);
        if (res.success) {
          source = 'PROVIDER';
        } else if (allowLocalFallback()) {
          // Explicit opt-in only: MasterCourierService.createShipment is a
          // simulated master account that fabricates AWB numbers, so it must
          // never be used silently as a "successful" booking.
          console.warn(
            'Shipping Xpress booking failed; using configured local fallback:',
            sanitizeForLog({ order: order.orderNumber, reason: res.failureReason })
          );
          res = await localFallback(pm, input, sellerItems);
          source = 'FALLBACK';
        } else {
          // Honest failure: keep the provider's reason, store no AWB, and let
          // admin retry. Never invent a shipment number.
          source = 'PROVIDER';
        }
      } catch (e: any) {
        console.warn('Shipping provider threw; evaluating fallback:', sanitizeForLog({ msg: e?.message }));
        if (allowLocalFallback()) {
          res = await localFallback(pm, input, sellerItems);
          source = 'FALLBACK';
        } else {
          res = {
            provider: SHIPMENT_PROVIDER,
            success: false,
            status: 'PENDING_PROVIDER_CONFIRMATION',
            failureReason: `Shipping Xpress call threw: ${e?.message || String(e)}`,
            awb: null,
            trackingNumber: null,
            trackingLink: null,
            labelUrl: null,
            shippingCost: null,
            courierName: null,
            codAmount: null,
            rawResponse: null,
            providerShipmentId: null,
            providerOrderId: null,
          };
          source = 'PROVIDER';
        }
      }
    }

    const persisted = await persistShipment(params.orderId, sellerId, sellerItems, input, res);
    results.push(shipmentResultToView(res, source, persisted));
  }

  const blocked = results.some((r) => r.source === 'BLOCKED');
  return {
    shipments: results,
    blocked,
    reason: blocked ? results.find((r) => r.source === 'BLOCKED')?.failureReason ?? null : null,
  };
}


/** Phase 6 — persist a blocked (not-booked) shipment so admins can act on it. */
async function persistBlocked(
  orderId: string,
  sellerId: string,
  paymentMode: 'PREPAID' | 'COD',
  sellerItems: GroupItem[],
  reason: string
): Promise<CreatedShipmentView> {
  const pkg = aggregatePackageMetrics(sellerItems);
  try {
    const created = await prisma.shipment.create({
      data: {
        shipmentNumber: `STBLK-${Date.now().toString(36).toUpperCase()}`,
        orderId,
        sellerId,
        provider: SHIPMENT_PROVIDER,
        status: 'PENDING_PROVIDER_CONFIRMATION',
        paymentMode,
        codAmount: estimateCodAmount(sellerItems, paymentMode),
        weight: pkg.weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        declaredValue: sellerItems.reduce((a, i) => a + i.total, 0),
        failureReason: reason,
        clientRef: computeIdempotencyKey(`BLOCKED-${orderId}`, sellerId, SHIPMENT_PROVIDER),
      },
    });
    await linkOrderItems(created.id, sellerItems);
    return {
      id: created.id,
      shipmentNumber: created.shipmentNumber,
      provider: SHIPMENT_PROVIDER,
      awbNumber: null,
      trackingNumber: null,
      trackingLink: null,
      labelUrl: null,
      status: 'PENDING_PROVIDER_CONFIRMATION',
      shippingCost: 0,
      codAmount: created.codAmount,
      providerShipmentId: null,
      failureReason: reason,
      source: 'BLOCKED',
    };
  } catch (e: any) {
    console.warn('Could not persist blocked shipment:', sanitizeForLog({ msg: e?.message }));
    return {
      id: '', shipmentNumber: '', provider: SHIPMENT_PROVIDER,
      awbNumber: null, trackingNumber: null, trackingLink: null, labelUrl: null,
      status: 'PENDING_PROVIDER_CONFIRMATION', shippingCost: 0, codAmount: 0,
      providerShipmentId: null, failureReason: reason, source: 'BLOCKED',
    };
  }
}

/** Link the OrderItem rows of one seller to their Shipment (Shipment.items relation). */
async function linkOrderItems(shipmentId: string, sellerItems: GroupItem[]): Promise<void> {
  const ids = sellerItems.map((i) => i.orderItemId).filter((v): v is string => !!v);
  if (!ids.length) return;
  try {
    await prisma.orderItem.updateMany({
      where: { id: { in: ids }, shipmentId: null },
      data: { shipmentId },
    });
  } catch (e: any) {
    console.warn('Could not link order items to shipment:', sanitizeForLog({ msg: e?.message }));
  }
}


/** Persist a Shipment row from a provider/fallback result. */
async function persistShipment(
  orderId: string,
  sellerId: string,
  sellerItems: GroupItem[],
  input: CreateShipmentInput,
  res: CreateShipmentResult
): Promise<any | null> {
  const status = statusFromProviderResult(res);
  const courierPartnerId = await resolveCourierPartnerId(res.courierName, String(res.provider));
  const raw = sanitizeForLog(res.rawResponse ?? null);

  const base: Prisma.ShipmentUncheckedCreateInput = {
    shipmentNumber: `STSXP-${Date.now().toString(36).toUpperCase()}`,
    orderId,
    sellerId,
    courierPartnerId,
    provider: String(res.provider),
    providerShipmentId: res.providerShipmentId ?? null,
    providerOrderId: res.providerOrderId ?? null,
    status,
    awbNumber: res.awb ?? null,
    trackingNumber: res.trackingNumber ?? res.awb ?? null,
    trackingLink: res.trackingLink ?? null,
    labelUrl: res.labelUrl ?? null,
    paymentMode: input.paymentMode,
    codAmount: input.paymentMode === 'COD' ? (input.codAmount ?? 0) : 0,
    shippingCost: res.shippingCost ?? 0,
    weight: input.weight,
    length: input.length ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    declaredValue: input.declaredAmount ?? null,
    clientRef: input.idempotencyKey,
    failureReason: res.failureReason ?? null,
    lastProviderSyncAt: new Date(),
    rawResponse: raw == null ? Prisma.JsonNull : (raw as Prisma.InputJsonValue),
  };

  let created: any = null;
  try {
    created = await prisma.shipment.create({ data: base });
  } catch (e: any) {
    // Unique AWB/tracking/clientRef collision → retry without the unique values
    // so the attempt is still recorded (never lose the provider response).
    console.warn('Shipment insert failed; retrying without unique identifiers:', sanitizeForLog({ msg: e?.message }));
    try {
      created = await prisma.shipment.create({
        data: { ...base, awbNumber: null, trackingNumber: null, clientRef: null },
      });
    } catch (e2: any) {
      console.error('Shipment could not be persisted:', sanitizeForLog({ msg: e2?.message }));
      return null;
    }
  }

  await linkOrderItems(created.id, sellerItems);

  try {
    await prisma.trackingUpdate.create({
      data: {
        shipmentId: created.id,
        status,
        location: input.pickupAddress.city || null,
        message: res.awb
          ? `${String(res.provider)} shipment booked. AWB ${res.awb}${res.courierName ? ` via ${res.courierName}` : ''}.`
          : `Shipment not booked: ${res.failureReason || 'unknown provider error'}`,
      },
    });
  } catch { /* tracking timeline is best-effort */ }

  try {
    await MasterCourierService.logAction(
      prisma,
      created.id,
      res.awb ? 'PROVIDER_SHIPMENT_CREATED' : 'PROVIDER_SHIPMENT_FAILED',
      input.sellerId,
      'SELLER',
      {
        orderId: input.orderId,
        provider: String(res.provider),
        awb: res.awb ?? null,
        courier: res.courierName ?? null,
        failureReason: res.failureReason ?? null,
        clientRef: input.idempotencyKey,
      }
    );
  } catch { /* audit logging is best-effort */ }

  return created;
}


function shipmentResultToView(
  res: CreateShipmentResult,
  source: 'PROVIDER' | 'FALLBACK',
  persisted: any
): CreatedShipmentView {
  return {
    id: persisted?.id || '',
    shipmentNumber: persisted?.shipmentNumber ?? res.awb ?? res.trackingNumber ?? '',
    provider: String(res.provider),
    awbNumber: persisted?.awbNumber ?? res.awb ?? null,
    trackingNumber: persisted?.trackingNumber ?? res.trackingNumber ?? res.awb ?? null,
    trackingLink: persisted?.trackingLink ?? res.trackingLink ?? null,
    labelUrl: persisted?.labelUrl ?? res.labelUrl ?? null,
    status: persisted?.status ?? res.status,
    shippingCost: Number(res.shippingCost) || 0,
    codAmount: Number(persisted?.codAmount ?? res.codAmount) || 0,
    providerShipmentId: persisted?.providerShipmentId ?? res.providerShipmentId ?? null,
    failureReason: res.failureReason ?? null,
    source,
  };
}

function shipmentToView(s: any): CreatedShipmentView {
  return {
    id: s.id,
    shipmentNumber: s.shipmentNumber || s.awbNumber || '',
    provider: s.provider,
    awbNumber: s.awbNumber ?? null,
    trackingNumber: s.trackingNumber ?? null,
    trackingLink: s.trackingLink ?? null,
    labelUrl: s.labelUrl ?? null,
    status: s.status,
    shippingCost: Number(s.shippingCost) || 0,
    codAmount: Number(s.codAmount) || 0,
    providerShipmentId: s.providerShipmentId ?? null,
    failureReason: s.failureReason ?? null,
    source: s.provider === SHIPMENT_PROVIDER ? 'PROVIDER' : 'FALLBACK',
  };
}

/**
 * Local master-account fallback.
 *
 * IMPORTANT: `MasterCourierService.createShipment` is a SIMULATION — it
 * fabricates AWB/tracking numbers (and even the "live" branch is a placeholder),
 * so it is ONLY invoked when `SHIPPING_LOCAL_FALLBACK_ENABLED=true`. Without that
 * opt-in a failed provider booking is recorded honestly as
 * PENDING_PROVIDER_CONFIRMATION with the provider's failure reason and no AWB.
 *
 * Stock was already decremented at order creation.
 */
async function localFallback(
  pm: 'PREPAID' | 'COD',
  input: CreateShipmentInput,
  sellerItems: GroupItem[]
): Promise<CreateShipmentResult> {
  try {
    const booking: any = await MasterCourierService.createShipment({
      orderId: input.orderId,
      sellerId: input.sellerId,
      items: sellerItems.map((it) => ({
        productId: it.productId || '',
        title: it.title,
        quantity: it.quantity,
        price: it.price,
        total: it.total,
      })),
      weight: input.weight,
      isCod: pm === 'COD',
      codAmount: estimateCodAmount(sellerItems, pm),
      courierCode: 'DELHIVERY_EXPRESS',
      pickupAddress: {
        storeName: input.pickupAddress.storeName || '',
        contactName: input.pickupAddress.contactName || '',
        phone: input.pickupAddress.phone || '',
        email: input.pickupAddress.email || '',
        addressLine1: input.pickupAddress.addressLine1 || '',
        addressLine2: input.pickupAddress.addressLine2 ?? null,
        city: input.pickupAddress.city || '',
        state: input.pickupAddress.state || '',
        pincode: input.pickupAddress.pincode || '',
        country: input.pickupAddress.country || 'India',
        pickupLocationId: input.pickupAddress.pickupLocationId ?? null,
      },
      shippingAddress: {
        fullName: input.shippingAddress.fullName,
        phone: input.shippingAddress.phone,
        email: input.shippingAddress.email || '',
        address: input.shippingAddress.addressLine1,
        city: input.shippingAddress.city,
        state: input.shippingAddress.state,
        pincode: input.shippingAddress.pincode,
        country: input.shippingAddress.country,
      },
    });

    if (booking) {
      const awb = booking.awbNumber ?? booking.trackingNumber ?? null;
      return {
        provider: MASTER_PROVIDER,
        success: true,
        status: 'BOOKED',
        providerShipmentId: booking.trackingNumber ?? awb,
        providerOrderId: input.orderId,
        awb,
        trackingNumber: booking.trackingNumber ?? awb,
        trackingLink:
          booking.trackingLink ||
          (awb ? `https://shoptantra.in/track?awb=${encodeURIComponent(awb)}` : null),
        labelUrl: booking.labelUrl || null,
        shippingCost: typeof booking.shippingCost === 'number' ? booking.shippingCost : null,
        courierName: booking.courierPartnerName ?? booking.courierPartnerCode ?? 'Local Courier',
        rawResponse: sanitizeForLog(booking),
      };
    }
  } catch (e: any) {
    console.warn('Local courier fallback failed:', sanitizeForLog({ msg: e?.message }));
  }

  return {
    provider: MASTER_PROVIDER,
    success: false,
    status: 'PENDING_PROVIDER_CONFIRMATION',
    failureReason: 'No shipping provider available and the local master-account fallback failed.',
    awb: null,
    trackingNumber: null,
    trackingLink: null,
    labelUrl: null,
    shippingCost: null,
    courierName: null,
    rawResponse: null,
    providerShipmentId: null,
    providerOrderId: null,
  };
}

/** Phase 6 hook — auto-create shipments after order confirmation. Never blocks checkout. */
export async function triggerAutoShipment(orderId: string, paymentMode: 'PREPAID' | 'COD'): Promise<void> {
  try {
    await createShipmentsForOrder({ orderId, paymentMode, autoTrigger: true });
  } catch (e: any) {
    console.warn(`Auto-shipment for order ${orderId} could not complete: ${e?.message || e}`);
  }
}

