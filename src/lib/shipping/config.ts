/**
 * SHOP TANTRA — Shipping provider registry (Phase 2 / Phase 3).
 *
 * Resolves the ACTIVE shipping provider. This is the only module that knows
 * which concrete provider class is in use; orchestration code (shipmentService)
 * asks for `getShippingProvider()` and never imports a provider directly.
 *
 * The env reads themselves live in `envConfig.ts` so this module can instantiate
 * the provider without creating a circular import (see envConfig.ts).
 *
 * SECURITY: all credentials are read from the server environment by the provider
 * itself — never from NEXT_PUBLIC_ variables, never returned in any response.
 */
import type { ShippingProvider } from './types';
import { ShippingXpressProvider } from './shippingXpressProvider';
import { getShippingConfig, isShippingEnabled } from './envConfig';

export type { ShippingConfig } from './envConfig';
export { getShippingConfig, isShippingEnabled, SHIPPING_XPRESS_DEFAULT_BASE_URL } from './envConfig';

let activeProvider: ShippingProvider | null = null;

/**
 * Returns the active shipping provider, or null when shipping is disabled so the
 * order flow can gracefully fall back to the local master-account path.
 */
export function getShippingProvider(): ShippingProvider | null {
  if (!isShippingEnabled()) return null;
  if (!activeProvider) {
    activeProvider = new ShippingXpressProvider();
  }
  return activeProvider;
}

export { ShippingXpressProvider };
