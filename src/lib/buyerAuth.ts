import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from './corporateAuth';

/**
 * Bind a checkout to the authenticated customer.
 *
 * WHY THIS EXISTS
 * `/api/checkout/razorpay` and `/api/checkout/verify` must stay reachable without
 * a session so guests can pay (Razorpay posts the callback from the browser) and
 * so COD can be placed. But `orderData.buyerId` is browser-supplied and was used
 * verbatim, so a signed-in customer could post another customer's id and have the
 * order written against that account.
 *
 * The rule is simple and preserves guest checkout:
 *   - a valid session ALWAYS wins; the body's buyerId is ignored
 *   - only a genuinely anonymous caller may supply their own id
 */

/** Roles allowed to place/own a checkout. */
const BUYER_ROLES = new Set(['BUYER', 'ADMIN', 'FOUNDER', 'CEO_MD', 'CHAIRMAN']);

/**
 * Read the signed-in user id from the session cookie, or null.
 *
 * A SELLER placing an order is still a valid buyer (ShopTantra lets any identity
 * shop), so the role is deliberately not restricted to BUYER here.
 */
export async function readBuyerSession(request: Request): Promise<{ userId: string; role: string } | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)(?:auth_token|corporate_auth_token)=([^;]+)/);
  if (!match) return null;
  try {
    const { payload } = await jwtVerify(match[1], getJwtSecret());
    const userId = (payload as any).userId || (payload as any).id;
    if (!userId) return null;
    const role = String((payload as any).role || '').toUpperCase();
    if (!BUYER_ROLES.has(role) && role !== 'SELLER') return null;
    return { userId: String(userId), role };
  } catch {
    return null;
  }
}

/**
 * The buyer id an order must be written under.
 *
 * @param request        The incoming request (cookie source).
 * @param claimedBuyerId The `orderData.buyerId` from the body. Used ONLY when
 *                       there is no session, so guest checkout keeps working.
 */
export async function resolveBuyerId(
  request: Request,
  claimedBuyerId: unknown,
): Promise<string> {
  const session = await readBuyerSession(request);
  if (session) return session.userId;

  const claimed = String(claimedBuyerId ?? '').trim();
  // An anonymous caller may label the order, but an arbitrary string must not
  // become a User row: the processor upserts a User by this id, so an email or a
  // path segment would create junk accounts. Keep it a short opaque token.
  if (claimed && /^[A-Za-z0-9_-]{1,64}$/.test(claimed)) return claimed;

  return `guest_${Math.random().toString(36).slice(2, 12)}`;
}
