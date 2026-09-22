/**
 * SHOP TANTRA — Shipping Xpress provider implementation.
 *
 * ============================================================================
 * VERIFIED PROVIDER CONTRACT
 * Established by live probing of the marketplace's OWN production account on
 * 2026-09-22 (no public API documentation exists for Shipping Xpress). Every
 * fact below is an observed HTTP response, not an assumption:
 *
 *  1. Base host .................. https://shippingxpress.in/ship
 *  2. Auth ....................... `Authorization: Bearer <API token>`
 *       no header  -> HTTP 401 {"status":false,"message":"Authorization token missing"}
 *       bad token  -> HTTP 401 {"status":false,"message":"Invalid API token"}
 *  3. Order creation ............. POST /api/order/store  (GET -> HTTP 405)
 *  4. Body encoding .............. application/x-www-form-urlencoded
 *       (an application/json body is IGNORED — every field was reported as
 *        "required", including fields that were present in the JSON payload)
 *  5. Validation failure ......... HTTP 422
 *       {"status":false,"message":"Validation errors occurred.","errors":{...}}
 *  6. Required fields ............ customer[first_name|mobile|address|country|
 *       state|city|zip_code], shipping_mode, order_date (YYYY-MM-DD accepted),
 *       order_type, total_amount, weight, length, width, height, items[][
 *       product_name|amount|quantity]
 *  7. order_type ................. only `prepaid` and `cod` were accepted;
 *       forward/reverse/return/rto/delivery/pickup/B2C/1/2 all returned
 *       "The selected order type is invalid."
 *  8. shipping_mode .............. required but NOT value-restricted (any string
 *       passed validation, including "TEST"), i.e. it is free-form. The value
 *       comes from SHIPPING_XPRESS_SHIPPING_MODE (default "Surface").
 *  9. Origin / warehouse ......... NO pickup-location field is accepted or
 *       required — the pickup address is bound to the account behind the token.
 * 10. NOT AVAILABLE on this API (all HTTP 404):
 *       order/list, order/index, order/show, order/track, order/cancel,
 *       order/label, pickup/store, pickup/list, rate/calculate.
 *
 * The payload builder is therefore written ONLY against fields the provider
 * itself validated. Nothing is invented, and capabilities that do not exist
 * throw `ProviderNotSupportedError` instead of returning fake data.
 *
 * NOT YET OBSERVED (and deliberately NOT guessed): the success (2xx) body of
 * order creation. `parseProviderResponse()` extracts ids/AWB/tracking
 * defensively from whichever key the body uses, and the verbatim body is always
 * persisted on `Shipment.rawResponse`, so the mapping can be confirmed from the
 * first live booking instead of an assumption.
 *
 * SECURITY: the token is read from `process.env.SHIPPING_XPRESS_API_TOKEN` only,
 * is never returned in a response, and is scrubbed from every error message this
 * module produces.
 * ============================================================================
 */
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentStatusUpdate,
  ConnectionTestResult,
  ProviderName,
} from './types';
import { ShippingProvider, ProviderNotSupportedError } from './types';
import {
  parseProviderResponse,
  sanitizeForLog,
  round2,
  mapProviderStatus,
  normalizeMobile,
  toProviderDate,
  flattenValidationErrors,
} from './helpers';
import { getShippingConfig } from './envConfig';

/** Machine-readable summary of the verified contract (safe to return to admins). */
export const SHIPPING_XPRESS_CONTRACT = {
  baseUrl: 'https://shippingxpress.in/ship',
  createOrderPath: '/api/order/store',
  method: 'POST',
  auth: 'Authorization: Bearer <SHIPPING_XPRESS_API_TOKEN>',
  contentType: 'application/x-www-form-urlencoded (JSON bodies are ignored)',
  orderTypeValues: ['prepaid', 'cod'],
  requiredFields: [
    'customer[first_name]',
    'customer[mobile]',
    'customer[address]',
    'customer[country]',
    'customer[state]',
    'customer[city]',
    'customer[zip_code]',
    'shipping_mode',
    'order_date',
    'order_type',
    'total_amount',
    'weight',
    'length',
    'width',
    'height',
    'items[][product_name]',
    'items[][amount]',
    'items[][quantity]',
  ],
  unavailableRoutes: [
    'GET /api/order/list',
    'GET /api/order/index',
    'GET /api/order/show',
    'GET /api/order/track',
    'GET /api/order/cancel',
    'GET /api/order/label',
    'GET /api/pickup/store',
    'GET /api/pickup/list',
    'GET /api/rate/calculate',
  ],
  unverified: ['success (2xx) response body of POST /api/order/store'],
} as const;

export class ShippingXpressProvider extends ShippingProvider {
  readonly name: ProviderName = 'SHIPPING_XPRESS';
  readonly capabilities = {
    createShipment: true, // VERIFIED: POST /api/order/store
    getTracking: false, // VERIFIED absent (404) — no tracking endpoint
    cancelShipment: false, // VERIFIED absent (404)
    generateLabel: false, // VERIFIED absent (404)
    requestPickup: false, // VERIFIED absent (404)
    getShippingRate: false, // VERIFIED absent (404)
    checkServiceability: false, // VERIFIED absent (404)
  };

  private baseUrl(): string {
    const base = process.env.SHIPPING_XPRESS_BASE_URL || SHIPPING_XPRESS_CONTRACT.baseUrl;
    return base.replace(/\/+$/, '');
  }

  private hasToken(): boolean {
    return !!String(process.env.SHIPPING_XPRESS_API_TOKEN || '').trim();
  }

  /** Authorization header value WITHOUT ever handing the raw token to a caller. */
  private authValue(): string {
    const token = process.env.SHIPPING_XPRESS_API_TOKEN;
    return token ? `Bearer ${token}` : '';
  }

  /** Belt-and-braces: nothing this module returns may ever contain the token. */
  private scrub(text: string): string {
    const token = process.env.SHIPPING_XPRESS_API_TOKEN;
    if (!text) return text;
    if (token && token.length > 0 && text.includes(token)) {
      return text.split(token).join('***MASKED***');
    }
    return text;
  }

  /** POST /api/order/store — the only capability the provider actually exposes. */
  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    const config = getShippingConfig();
    if (!config.enabled) {
      return failed(this.name, 'SHIPPING_XPRESS_ENABLED is not true', input);
    }
    if (!this.hasToken()) {
      return failed(this.name, 'SHIPPING_XPRESS_API_TOKEN is not configured on the server', input);
    }
    if (!input.items.length) {
      return failed(this.name, 'Cannot book with Shipping Xpress: the shipment has no items.', input);
    }

    const url = `${this.baseUrl()}${SHIPPING_XPRESS_CONTRACT.createOrderPath}`;
    const body = buildFormBody(input);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          // VERIFIED: form encoding is mandatory — a JSON body is ignored.
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          Authorization: this.authValue(),
        },
        body: body.toString(),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const raw = await readJsonOrText(res);
      const providerMessage = this.scrub(extractMessage(raw));

      if (res.status === 401) {
        // VERIFIED: {"status":false,"message":"Invalid API token"} | "Authorization token missing"
        return failed(
          this.name,
          `Shipping Xpress rejected the API token (HTTP 401: ${providerMessage || 'unauthorized'}).`,
          input,
          raw
        );
      }
      if (res.status === 422) {
        // VERIFIED: {"status":false,"message":"Validation errors occurred.","errors":{field:[msg]}}
        const details = flattenValidationErrors((raw as any)?.errors);
        return failed(
          this.name,
          `Shipping Xpress rejected the order payload (HTTP 422): ${details || providerMessage || 'validation error'}`,
          input,
          raw
        );
      }
      if (!res.ok) {
        return failed(
          this.name,
          `Shipping Xpress returned HTTP ${res.status}${providerMessage ? `: ${providerMessage}` : ''}.`,
          input,
          raw
        );
      }
      // The API also reports failure inside a 2xx body via {"status": false}.
      if (raw && typeof raw === 'object' && (raw as any).status === false) {
        return failed(
          this.name,
          `Shipping Xpress reported failure: ${providerMessage || 'status:false'}`,
          input,
          raw
        );
      }

      // 2xx success. The exact body shape is UNVERIFIED, so ids/AWB/tracking are
      // extracted defensively and the verbatim body is persisted for review.
      const parsed = parseProviderResponse(raw);
      const awb = parsed.awb ?? parsed.trackingNumber ?? null;
      const mapped = mapProviderStatus(parsed.status);
      return {
        provider: this.name,
        success: true,
        status: mapped === 'PENDING_PROVIDER_CONFIRMATION' ? 'BOOKED' : mapped,
        providerShipmentId: parsed.providerShipmentId ?? null,
        providerOrderId: parsed.providerOrderId ?? null,
        awb,
        trackingNumber: parsed.trackingNumber ?? awb,
        trackingLink: parsed.trackingLink ?? defaultTrackingLink(awb),
        labelUrl: parsed.labelUrl ?? null,
        shippingCost: parsed.shippingCost ?? null,
        codAmount: input.paymentMode === 'COD' ? round2(input.codAmount ?? 0) : 0,
        courierName: parsed.courierName ?? null,
        rawResponse: sanitizeForLog(raw),
      };
    } catch (e: any) {
      clearTimeout(timer);
      const aborted = e?.name === 'AbortError';
      return failed(
        this.name,
        this.scrub(
          aborted
            ? `Shipping Xpress request timed out after ${config.requestTimeoutMs}ms.`
            : `Shipping Xpress request failed: ${e?.message || String(e)}`
        ),
        input
      );
    }
  }
  /**
   * VERIFIED ABSENT: GET /api/order/track returned HTTP 404 during the live API
   * audit. Throws instead of returning an empty list so callers stay honest.
   */
  async getTracking(_trackingNumber: string): Promise<ShipmentStatusUpdate[]> {
    throw new ProviderNotSupportedError(
      'Shipping Xpress exposes no tracking endpoint (GET /api/order/track -> HTTP 404, verified live). Track the AWB in the Shipping Xpress merchant dashboard; ShopTantra stores the AWB and links to its own tracking page.'
    );
  }

  /** VERIFIED ABSENT: GET /api/order/cancel -> HTTP 404. */
  async cancelShipment(_providerShipmentId: string): Promise<{ success: boolean; failureReason?: string }> {
    throw new ProviderNotSupportedError(
      'Shipping Xpress exposes no cancellation endpoint (GET /api/order/cancel -> HTTP 404, verified live). Cancel the order in the Shipping Xpress merchant dashboard and update the Shipment status in ShopTantra admin.'
    );
  }

  /** VERIFIED ABSENT: GET /api/pickup/store and /api/pickup/list -> HTTP 404. */
  async requestPickup(_shipment: CreateShipmentInput): Promise<{ success: boolean; failureReason?: string }> {
    throw new ProviderNotSupportedError(
      'Shipping Xpress exposes no pickup-scheduling endpoint (GET /api/pickup/store and GET /api/pickup/list -> HTTP 404, verified live). Pickups are scheduled in the Shipping Xpress merchant dashboard.'
    );
  }

  /**
   * Phase 5 — safe "Test API Connection" used by the admin UI.
   *
   * Sends POST /api/order/store with an EMPTY body. The endpoint validates and
   * rejects before it can create anything, so this proves host + path + token
   * (HTTP 422 = reachable AND authorized, HTTP 401 = token rejected) without
   * ever booking a real shipment or spending money.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.hasToken()) {
      return {
        provider: this.name,
        configured: false,
        reachable: false,
        authorized: false,
        error: 'SHIPPING_XPRESS_API_TOKEN is not configured on the server.',
      };
    }

    const config = getShippingConfig();
    const url = `${this.baseUrl()}${SHIPPING_XPRESS_CONTRACT.createOrderPath}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: this.authValue(),
        },
        body: '',
        signal: controller.signal,
      });
      clearTimeout(timer);

      const raw = await readJsonOrText(res);
      const message = this.scrub(extractMessage(raw));

      if (res.status === 401) {
        return {
          provider: this.name,
          configured: true,
          reachable: true,
          authorized: false,
          statusCode: 401,
          message,
          error: message || 'Shipping Xpress rejected the API token.',
        };
      }
      if (res.status === 422) {
        return {
          provider: this.name,
          configured: true,
          reachable: true,
          authorized: true,
          statusCode: 422,
          message:
            message ||
            'Endpoint reachable and the API token was accepted (empty-body validation response).',
        };
      }
      if (res.status === 405) {
        return {
          provider: this.name,
          configured: true,
          reachable: true,
          authorized: true,
          statusCode: 405,
          error:
            'Endpoint responded HTTP 405 — POST is not allowed here. Check SHIPPING_XPRESS_BASE_URL.',
        };
      }
      return {
        provider: this.name,
        configured: true,
        reachable: res.status < 500,
        authorized: res.ok,
        statusCode: res.status,
        message,
        error: res.ok ? undefined : `Unexpected HTTP ${res.status}.`,
      };
    } catch (e: any) {
      clearTimeout(timer);
      const aborted = e?.name === 'AbortError';
      return {
        provider: this.name,
        configured: true,
        reachable: false,
        authorized: false,
        error: this.scrub(aborted ? 'Connection timed out' : e?.message || 'Host unreachable'),
      };
    }
  }
}
/** Uniform failure result. `reason` is always token-scrubbed by the caller. */
function failed(
  provider: ProviderName,
  reason: string,
  _input: CreateShipmentInput,
  rawResponse: unknown = null
): CreateShipmentResult {
  return {
    provider,
    success: false,
    status: 'PENDING_PROVIDER_CONFIRMATION',
    failureReason: reason,
    awb: null,
    trackingNumber: null,
    trackingLink: null,
    labelUrl: null,
    shippingCost: null,
    courierName: null,
    codAmount: null,
    rawResponse: rawResponse === null ? null : sanitizeForLog(rawResponse),
    providerShipmentId: null,
    providerOrderId: null,
  };
}

/**
 * Shipping Xpress publishes no public tracking URL, so the AWB is surfaced on
 * ShopTantra's own tracking page (which resolves any saved AWB).
 */
function defaultTrackingLink(ref?: string | null): string | null {
  if (!ref) return null;
  return `https://shoptantra.in/track?awb=${encodeURIComponent(ref)}`;
}

/** Read the body exactly once, tolerating both JSON and plain-text responses. */
async function readJsonOrText(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** VERIFIED shape: {"status":false,"message":"...","errors":{...}} */
function extractMessage(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.slice(0, 300);
  if (typeof raw !== 'object') return '';
  const o = raw as Record<string, unknown>;
  const msg = o.message ?? o.error ?? o.msg ?? (o.data as any)?.message;
  return msg == null ? '' : String(msg).slice(0, 300);
}

/**
 * `shipping_mode` is required but NOT value-restricted (verified live), so its
 * value is deployment configuration rather than a guessed enum member.
 */
function shippingMode(): string {
  const raw = String(process.env.SHIPPING_XPRESS_SHIPPING_MODE || '').trim();
  return raw || 'Surface';
}

/**
 * The contract exposes ONE amount field, `total_amount`:
 *   - COD     -> the amount the courier must collect from the buyer;
 *   - PREPAID -> the declared value of the consignment.
 */
function totalAmount(input: CreateShipmentInput): number {
  if (input.paymentMode === 'COD') return round2(input.codAmount ?? 0);
  return round2(
    input.declaredAmount ?? input.items.reduce((sum, it) => sum + (it.total ?? 0), 0)
  );
}
/**
 * Build the ORDER-CREATION body for `POST /api/order/store`.
 *
 * Every key below was confirmed by the provider's own validation messages; no
 * field name is guessed. Encoding is form-urlencoded because the endpoint
 * ignores JSON bodies (see the contract block at the top of this file).
 */
function buildFormBody(input: CreateShipmentInput): URLSearchParams {
  const ship = input.shippingAddress;
  const body = new URLSearchParams();

  // ---- customer (all seven fields are REQUIRED) ----------------------------
  // The contract has a single name field, so the buyer's full name is sent as-is.
  body.append('customer[first_name]', (ship.fullName || 'Customer').slice(0, 190));
  // Mobile is normalised to plain digits so "+91 98765 43210" cannot fail validation.
  body.append('customer[mobile]', normalizeMobile(ship.phone));
  // Single-line `address` only: a second line is folded in rather than inventing a key.
  body.append(
    'customer[address]',
    [ship.addressLine1, ship.addressLine2].filter((v) => !!v && String(v).trim() !== '').join(', ')
  );
  body.append('customer[country]', ship.country || 'India');
  body.append('customer[state]', ship.state || '');
  body.append('customer[city]', ship.city || '');
  body.append('customer[zip_code]', String(ship.pincode || '').trim());

  // ---- order ---------------------------------------------------------------
  body.append('shipping_mode', shippingMode());
  body.append('order_date', toProviderDate());
  // VERIFIED: only `prepaid` and `cod` are accepted values.
  body.append('order_type', input.paymentMode === 'COD' ? 'cod' : 'prepaid');
  body.append('total_amount', String(totalAmount(input)));
  // Never send zero: carriers reject a zero-weight/size consignment.
  body.append('weight', String(Math.max(0.01, round2(input.weight || 0))));
  body.append('length', String(Math.max(1, round2(input.length || 0))));
  body.append('width', String(Math.max(1, round2(input.width || 0))));
  body.append('height', String(Math.max(1, round2(input.height || 0))));

  // ---- items (product_name / amount / quantity are REQUIRED per line) ------
  input.items.forEach((item, index) => {
    body.append(`items[${index}][product_name]`, (item.title || `Item ${index + 1}`).slice(0, 190));
    // `amount` carries the unit price; the provider exposes no separate
    // line-total field, so the line total is left derivable as amount * quantity.
    body.append(`items[${index}][amount]`, String(round2(item.price ?? item.total ?? 0)));
    body.append(`items[${index}][quantity]`, String(Math.max(1, Math.trunc(item.quantity || 1))));
  });

  return body;
}
