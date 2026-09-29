import { prisma } from './prisma';

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface PickupAddressInput {
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
}

export interface BookingItemInput {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CreateShipmentParams {
  orderId: string;
  sellerId: string;
  pickupAddress: PickupAddressInput;
  shippingAddress: ShippingAddressInput;
  items: BookingItemInput[];
  weight: number; // in kg
  isCod: boolean;
  codAmount: number;
  courierCode?: string; // Optional manual override
}

export interface CourierServiceRate {
  courierId: string;
  name: string;
  code: string;
  rate: number;
  expectedDays: number;
  isCodSupported: boolean;
  /**
   * True when the number is a ShopTantra platform estimate rather than a quote
   * returned by a courier. The UI must label it as such.
   */
  isEstimate: boolean;
}

/**
 * Raised by every operation in this service that would otherwise have to invent
 * a result.
 *
 * SHOP TANTRA — Master Courier Service
 *
 * IMPORTANT / HONESTY CONTRACT
 * This service used to be a simulation. `createShipment()` minted a random AWB
 * (`DEL##########IN`), `trackShipment()` invented a courier history with made-up
 * hubs and back-dated timestamps, and `schedulePickup()` / `cancelShipment()`
 * answered `{ success: true }` without contacting anybody. No courier was ever
 * reached, so an operator (and the buyer) could believe a parcel was booked,
 * picked up and in transit when nothing existed.
 *
 * ShopTantra now has a real, verified provider integration
 * (`src/lib/shipping/shippingXpressProvider.ts`, reached through
 * `shipmentService.createShipmentsForOrder`). That is the only path allowed to
 * produce an AWB. This class therefore NEVER fabricates logistics data:
 *   - `createShipment()`  -> throws (no provider configured for this account)
 *   - `trackShipment()`   -> returns [] (the provider exposes no tracking API)
 *   - `schedulePickup()`  -> throws (the provider exposes no pickup API)
 *   - `cancelShipment()`  -> throws (the provider exposes no cancel API)
 *   - `calculateRates()`  -> returns clearly-flagged platform ESTIMATES
 *                            (the provider exposes no rate-quote API)
 * `logAction()` is a real database write and is kept.
 *
 * `createShipment()` now has NO caller: `shipmentService.localFallback()` (and
 * the `SHIPPING_LOCAL_FALLBACK_ENABLED` opt-in that gated it) were deleted so a
 * carrier failure can never be replaced by a simulated success.
 */
export class MasterShippingNotConfiguredError extends Error {
  public readonly code = 'SHIPPING_PROVIDER_NOT_CONFIGURED';
  constructor(operation: string, detail: string) {
    super(
      `Shipping Xpress cannot perform "${operation}": ${detail} ` +
        `No AWB, tracking event or label was created.`
    );
    this.name = 'MasterShippingNotConfiguredError';
  }
}

/**
 * Master courier account client.
 *
 * Every mutating operation here REFUSES by design (see the class-level honesty
 * contract above). The only verified carrier integration is Shipping Xpress,
 * reached through `shipmentService.createShipmentsForOrder()`.
 *
 * NOTE: Shiprocket was removed from ShopTantra. The credentials below used to be
 * read from `SHOPTANTRA_SHIPROCKET_EMAIL` / `SHOPTANTRA_SHIPROCKET_PASSWORD` and
 * handed to a Shiprocket login call; ShopTantra no longer integrates Shiprocket
 * (or any courier other than Shipping Xpress), so those reads are gone.
 */
export class MasterCourierService {
  private static getApiCredentials() {
    return {
      apiKey: process.env.SHOPTANTRA_MASTER_SHIPPING_API_KEY || null,
      apiSecret: process.env.SHOPTANTRA_MASTER_SHIPPING_API_SECRET || null,
    };
  }

  /**
   * Book a shipment on ShopTantra's master account.
   *
   * REFUSED BY DESIGN. The only verified carrier integration is
   * `shippingXpressProvider.createShipment()` (POST /api/order/store), reached
   * via `shipmentService.createShipmentsForOrder()`. This method has no live
   * endpoint, so instead of returning a random AWB it throws and the caller
   * records the booking as PENDING_PROVIDER_CONFIRMATION.
   */
  public static async createShipment(_params: CreateShipmentParams): Promise<never> {
    throw new MasterShippingNotConfiguredError(
      'create shipment',
      'no courier API is wired to this master account. ' +
        'Set SHIPTANTRA_MASTER_SHIPPING_API_KEY only together with a real endpoint implementation.'
    );
  }

  /**
   * Schedule a pickup from the seller's warehouse.
   *
   * REFUSED: Shipping Xpress exposes no pickup endpoint (GET /api/pickup/store
   * and /api/pickup/list were verified live as HTTP 404). This used to answer
   * `{ success: true }` unconditionally. It now throws so the caller reports
   * that the pickup has NOT been raised with the carrier.
   */
  public static async schedulePickup(
    _awbNumber: string,
    _pickupLocationId: string | null,
    _pickupDate: string
  ): Promise<never> {
    throw new MasterShippingNotConfiguredError(
      'schedule pickup',
      'the carrier exposes no pickup-scheduling endpoint (verified 404). ' +
        'Raise the pickup in the Shipping Xpress merchant dashboard.'
    );
  }

  /**
   * Cancel an AWB.
   *
   * REFUSED: Shipping Xpress exposes no cancellation endpoint (GET
   * /api/order/cancel verified live as HTTP 404). This used to answer
   * `{ success: true }` unconditionally. It now throws.
   */
  public static async cancelShipment(_awbNumber: string): Promise<never> {
    throw new MasterShippingNotConfiguredError(
      'cancel shipment',
      'the carrier exposes no cancellation endpoint (verified 404). ' +
        'Cancel the order in the Shipping Xpress merchant dashboard.'
    );
  }

  /**
   * Fetch tracking events from the carrier.
   *
   * Returns an EMPTY list. The carrier exposes no tracking API (verified), and
   * this method used to synthesise a full courier history — made-up hubs, made-up
   * courier assistants and back-dated timestamps derived purely from the current
   * status. Those events were never persisted (see update-status/route.ts), but
   * they were returned to callers as if they were real. Empty is the truth.
   */
  public static async trackShipment(
    _awbNumber: string,
    _currentStatus: string = 'PENDING'
  ): Promise<Array<{ status: string; location: string; message: string; timestamp: string }>> {
    return [];
  }

  /**
   * Weight-based platform shipping ESTIMATE, expressed as Shipping Xpress
   * service levels.
   *
   * The carrier exposes no rate-quote endpoint (verified live), so these are NOT
   * carrier quotes — they are ShopTantra's own published slab rates shown to the
   * buyer before a parcel is booked. Every row is flagged `isEstimate: true` and
   * the API response is flagged too, so nothing here can be mistaken for a
   * carrier quote. The final charge is set at booking time.
   *
   * NOTE: this list used to be keyed `DELHIVERY_EXPRESS` / `BLUEDART_AIR` /
   * `INDIA_POST`. ShopTantra does not integrate any of those carriers — it ships
   * through Shipping Xpress only — so quoting them offered buyers services that
   * could not carry their parcel. The tiers are now Shipping Xpress service
   * levels; the live `shipping_mode` value comes from SHIPPING_XPRESS_SHIPPING_MODE.
   */
  public static async calculateRates(
    _pickupPincode: string,
    _deliveryPincode: string,
    weight: number,
    paymentMode: 'PREPAID' | 'COD',
    codAmount: number
  ): Promise<CourierServiceRate[]> {
    const codFee = paymentMode === 'COD' ? Math.max(15, Math.round(codAmount * 0.015)) : 0;
    const baseW = weight <= 0.5 ? 1 : Math.ceil(weight / 0.5) * 0.85;

    return [
      {
        courierId: 'SXP_ECONOMY',
        name: 'Shipping Xpress Economy (estimated)',
        code: 'SXP_ECONOMY',
        rate: Math.round(35 * baseW),
        expectedDays: 5,
        isCodSupported: false,
        isEstimate: true,
      },
      {
        courierId: 'SXP_SURFACE',
        name: 'Shipping Xpress Surface (estimated)',
        code: 'SXP_SURFACE',
        rate: Math.round(45 * baseW) + codFee,
        expectedDays: 4,
        isCodSupported: true,
        isEstimate: true,
      },
      {
        courierId: 'SXP_PRIORITY',
        name: 'Shipping Xpress Priority (estimated)',
        code: 'SXP_PRIORITY',
        rate: Math.round(85 * baseW) + codFee,
        expectedDays: 2,
        isCodSupported: true,
        isEstimate: true,
      },
    ];
  }


  /**
   * Helper to write shipping audit logs
   */
  public static async logAction(tx: any, shipmentId: string | null, action: string, userId: string, role: string, details: object) {
    try {
      await tx.shippingAuditLog.create({
        data: {
          shipmentId,
          action,
          performedBy: userId,
          role,
          details: JSON.stringify(details),
        },
      });
    } catch (e) {
      console.error('[Master Shipping API] Failed to write audit log:', e);
    }
  }
}
