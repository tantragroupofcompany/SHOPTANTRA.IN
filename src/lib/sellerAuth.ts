import { NextResponse } from 'next/server';
import { prisma } from './prisma';
import { requireRole } from '../middleware/index';

/**
 * Shared seller-scoped authorization.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * Ten `/api/seller/*` routes, plus `/api/vendor/wallet` and `/api/vendor/withdraw`,
 * resolved "which store is this request about" purely from a `sellerId` / `userId`
 * query or body parameter and never compared it to the authenticated session.
 * Worse, several of them fell through to an ARBITRARY seller:
 *
 *     let seller = await prisma.seller.findFirst({ where: { OR: [...] } });
 *     if (!seller) {
 *       seller = await prisma.seller.findFirst({ where: { status: 'ACTIVE' } });
 *     }
 *
 * That fallback meant an unauthenticated caller who passed any id that did not
 * resolve to a seller was silently served the FIRST active seller's orders,
 * earnings, wallet, coupons and inventory — a full cross-tenant leak — while
 * `/api/vendor/withdraw` let anyone drain any seller's wallet balance on request.
 *
 * The contract enforced here:
 *   1. The caller must present a valid auth JWT cookie (any logged-in role).
 *   2. A store they ask for must belong to them, UNLESS they are an executive /
 *      admin (the only deliberate cross-store capability).
 *   3. There is NEVER a silent fallback to somebody else's store.
 */

/** Roles that may legitimately act on any store. */
const ELEVATED_ROLES = new Set(['ADMIN', 'FOUNDER', 'CEO_MD', 'CHAIRMAN']);

/** Every role allowed to reach a seller-scoped endpoint at all. */
export const SELLER_SCOPE_ROLES = ['SELLER', 'BUYER', 'ADMIN', 'FOUNDER', 'CEO_MD', 'CHAIRMAN'];

export type SellerScope =
  | {
      ok: true;
      /** The seller profile id the request is authorised to act on. */
      sellerId: string;
      /** Canonical role from the JWT. */
      role: string;
      /** The authenticated user id. */
      userId?: string;
      /** True for ADMIN / executive sessions. */
      elevated: boolean;
    }
  | { ok: false; response: NextResponse };

/** Roles allowed to act on shipments. Buyers are excluded: fulfilment is staff/seller work. */
export const SHIPMENT_ROLES = ['SELLER', 'ADMIN', 'FOUNDER', 'CEO_MD', 'CHAIRMAN'];

/**
 * Authorise access to a single Shipment row.
 *
 * WHY THIS EXISTS
 * Four shipment routes shipped with NO authentication at all:
 *   - `/api/shipment/cancel`        cancelled any order and restocked its items
 *   - `/api/shipment/label`         printed buyer name/address/phone for any AWB
 *   - `/api/shipment/schedule-pickup` mutated any shipment
 *   - `/api/shipment/create`        booked real carrier shipments for any order
 *
 * `cancel` was the worst of them: an anonymous caller could cancel arbitrary
 * orders (killing a real customer's order) and have stock incremented back into
 * inventory, while `label` leaked customer PII by id enumeration.
 *
 * A shipment belongs to exactly one seller, so ownership is a simple equality
 * check against the caller's own seller row.
 *
 * @returns The authorised role/userId, or a ready-to-return NextResponse (401 /
 *          403 / 404).
 */
export async function requireShipmentAccess(
  request: Request,
  shipmentId: string,
): Promise<{ ok: true; role: string; userId?: string; sellerId: string | null } | { ok: false; response: NextResponse }> {
  const guard = await requireRole(request as any, SHIPMENT_ROLES);
  if (guard instanceof NextResponse) return { ok: false, response: guard };

  const role = String((guard as any).role || '');
  const userId = (guard as any).userId as string | undefined;

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: { id: true, sellerId: true },
  });
  // 404 (not 403) when the shipment does not exist, so this cannot be used as an
  // oracle to distinguish "exists but not yours" from "does not exist".
  if (!shipment) {
    return { ok: false, response: NextResponse.json({ error: 'Shipment not found' }, { status: 404 }) };
  }

  if (ELEVATED_ROLES.has(role)) {
    return { ok: true, role, userId, sellerId: shipment.sellerId };
  }

  const own = userId
    ? await prisma.seller.findFirst({ where: { userId }, select: { id: true } })
    : null;
  if (!own || own.id !== shipment.sellerId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Access Denied – this shipment belongs to another store.' },
        { status: 403 },
      ),
    };
  }

  return { ok: true, role, userId, sellerId: shipment.sellerId };
}

/**
 * Authorise a route that acts on a whole ORDER (e.g. booking shipments for it).
 * Same ownership rule, keyed on the order's seller.
 */
export async function requireOrderAccess(
  request: Request,
  orderId: string,
): Promise<{ ok: true; role: string; userId?: string } | { ok: false; response: NextResponse }> {
  const guard = await requireRole(request as any, SHIPMENT_ROLES);
  if (guard instanceof NextResponse) return { ok: false, response: guard };

  const role = String((guard as any).role || '');
  const userId = (guard as any).userId as string | undefined;
  if (ELEVATED_ROLES.has(role)) return { ok: true, role, userId };

  // A seller may only book shipments for an order that contains their products.
  const owned = userId
    ? await prisma.orderItem.findFirst({
        where: {
          orderId,
          product: { seller: { userId } },
        },
        select: { id: true },
      })
    : null;
  if (!owned) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Access Denied – you may only manage shipments for your own orders.' },
        { status: 403 },
      ),
    };
  }

  return { ok: true, role, userId };
}

/**
 * Resolve a seller profile id from either a seller-profile id or a user id.
 * Strict: returns `null` when nothing matches. NEVER falls back to another
 * seller. Exported for routes that only need the mapping helper.
 */
export async function resolveSellerIdStrict(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const seller = await prisma.seller.findFirst({
    where: { OR: [{ id }, { userId: id }] },
    select: { id: true },
  });
  return seller ? seller.id : null;
}

/**
 * Authorise a seller-scoped request.
 *
 * @param request      The incoming route request (cookie source).
 * @param requestedId  The `sellerId` / `userId` the caller asked for, if any.
 *                     When omitted, the caller's own store is used.
 *
 * On success returns the authorised `sellerId`. On failure returns a ready-made
 * `{ ok: false, response }` NextResponse (401 / 403 / 404) the caller returns.
 */
export async function requireSellerScope(
  request: Request,
  requestedId?: string | null,
): Promise<SellerScope> {
  const guard = await requireRole(request as any, SELLER_SCOPE_ROLES);
  if (guard instanceof NextResponse) return { ok: false, response: guard };

  const role = String((guard as any).role || '');
  const userId = (guard as any).userId as string | undefined;
  const elevated = ELEVATED_ROLES.has(role);

  // A user owns at most one store: resolve the caller's own seller row.
  const ownSeller = userId
    ? await prisma.seller.findFirst({ where: { userId }, select: { id: true } })
    : null;

  // Case A — the caller named a specific store. It must be theirs (or they are
  // an executive). No fallback: an unknown id is a 404, never a random store.
  if (requestedId) {
    const target = await prisma.seller.findFirst({
      where: { OR: [{ id: requestedId }, { userId: requestedId }] },
      select: { id: true },
    });
    if (!target) {
      return { ok: false, response: NextResponse.json({ error: 'Seller profile not found' }, { status: 404 }) };
    }
    if (!elevated && (!ownSeller || ownSeller.id !== target.id)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Access Denied – you may only access your own store.' },
          { status: 403 },
        ),
      };
    }
    return { ok: true, sellerId: target.id, role, userId, elevated };
  }

  // Case B — no store named: use the caller's own store.
  if (ownSeller) return { ok: true, sellerId: ownSeller.id, role, userId, elevated };

  // Case C — an executive browsing without a specific store. Pick the oldest
  // active store deterministically (this is the ONLY remaining "pick a store"
  // path, and it is restricted to elevated roles).
  if (elevated) {
    const firstStore = await prisma.seller.findFirst({
      where: { status: 'ACTIVE' },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    if (firstStore) return { ok: true, sellerId: firstStore.id, role, userId, elevated };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Seller profile not found for this account' }, { status: 403 }),
  };
}
