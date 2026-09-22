/**
 * SHOP TANTRA — Shipping environment configuration (Phase 2 / Phase 3).
 *
 * Pure `process.env` reads with NO dependency on any provider class. Both the
 * provider registry (`config.ts`) and the provider implementation
 * (`shippingXpressProvider.ts`) import from THIS module, which keeps the
 * dependency graph acyclic:
 *
 *     config.ts  ──▶ envConfig.ts
 *         │              ▲
 *         ▼              │
 *     shippingXpressProvider.ts
 *
 * (Previously the provider imported `config.ts` while `config.ts` instantiated
 * the provider — a circular import that could crash at module load time
 * depending on load order.)
 *
 * SECURITY: the API token is deliberately NOT part of `ShippingConfig`, so this
 * structure can never leak the credential into a JSON response or a log line.
 */

export interface ShippingConfig {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  requestTimeoutMs: number;
  environment: 'production' | 'sandbox' | 'disabled';
}

export const SHIPPING_XPRESS_DEFAULT_BASE_URL = 'https://shippingxpress.in/ship';
export const SHIPPING_XPRESS_DEFAULT_TIMEOUT_MS = 15000;

/** Read-only, server-side view of the Shipping Xpress configuration. */
export function getShippingConfig(): ShippingConfig {
  const enabled = String(process.env.SHIPPING_XPRESS_ENABLED || '').toLowerCase() === 'true';
  const baseUrl =
    String(process.env.SHIPPING_XPRESS_BASE_URL || '').trim() || SHIPPING_XPRESS_DEFAULT_BASE_URL;
  const parsedTimeout = parseInt(process.env.SHIPPING_XPRESS_TIMEOUT_MS || '', 10);
  const timeout =
    Number.isFinite(parsedTimeout) && parsedTimeout >= 1000
      ? parsedTimeout
      : SHIPPING_XPRESS_DEFAULT_TIMEOUT_MS;
  const environment = (process.env.SHIPPING_XPRESS_ENVIRONMENT ||
    'production') as ShippingConfig['environment'];
  return {
    enabled,
    provider: 'SHIPPING_XPRESS',
    baseUrl,
    requestTimeoutMs: timeout,
    environment,
  };
}

export function isShippingEnabled(): boolean {
  return getShippingConfig().enabled;
}
