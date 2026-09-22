/**
 * SHOP TANTRA — Shipping module barrel (Phase 2).
 *
 * Import server-side shipping functionality from here:
 *   import { getShippingProvider, createShipmentsForOrder } from '@/lib/shipping';
 *
 * SECURITY: everything in this module tree is server-only. The Shipping Xpress
 * token is read from `process.env` (never NEXT_PUBLIC_) and is never returned in
 * an API response.
 */
export * from './types';
export * from './config';
export * from './helpers';
export * from './shipmentService';
export { SHIPPING_XPRESS_CONTRACT } from './shippingXpressProvider';


