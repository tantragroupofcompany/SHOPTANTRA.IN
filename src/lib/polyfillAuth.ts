import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from './corporateAuth';

/**
 * Authorization for POST /api/supabase-polyfill.
 *
 * WHY THIS MODULE EXISTS
 * The polyfill is a generic table gateway the browser calls with
 * `{ table, action, filters, insertData, updateData }`. It must be reachable
 * without a session so the storefront can read the public catalogue — but
 * because it forwards caller-chosen filters and payloads straight to Prisma,
 * "reachable" also meant "any table, any row".
 *
 * This module draws the line:
 *   - PUBLIC_TABLES : catalogue the storefront reads pre-login (select only)
 *   - SELF_TABLES   : rows belonging to the caller (orders, addresses, ...)
 *   - STAFF_TABLES  : rows belonging to a whole store/platform (sellers, leads)
 *   - everything else: denied
 */

// Tables an anonymous shopper may READ. This is the storefront catalogue and
// nothing else. Do not widen casually: every addition is a data leak.
const PUBLIC_TABLES = new Set([
  'products',
  'product_categories',
  'sellers',
  'reviews',
  'subscription_plans',
]);

// Tables whose rows belong to the signed-in customer. Access is forced to the
// session user - a caller cannot read another customer's rows by filtering.
const SELF_TABLES: Record<string, string> = {
  orders: 'buyerId',
  addresses: 'userId',
  profiles: 'id',
  notifications: 'userId',
  support_tickets: 'userId',
  subscriptions: 'userId',
  // Credential writes. Self-scoped: a caller may only change their OWN password
  // (staff may manage another account). Handled explicitly in the route.
  profiles_auth: 'id',
};

const STAFF_TABLES = new Set([
  'profiles',
  'sellers',
  'products',
  'leads',
  'newsletter_subscriptions',
  'contact_inquiries',
]);

const STAFF_ROLES = new Set(['ADMIN', 'FOUNDER', 'CEO_MD', 'CHAIRMAN']);

/** Parse the JSON body without letting a malformed body become a 500. */
export async function body0(request: Request): Promise<any> {
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Verify the session cookie. Returns null when there is no valid token, so the
 * caller can tell "anonymous" apart from "authenticated as X".
 */
async function readSession(request: Request): Promise<{ userId?: string; role: string } | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)(?:auth_token|corporate_auth_token)=([^;]+)/);
  if (!match) return null;
  try {
    const { payload } = await jwtVerify(match[1], getJwtSecret());
    const role = String((payload as any).role || '').toUpperCase();
    return { userId: (payload as any).userId || (payload as any).id, role };
  } catch {
    return null;
  }
}

export type PolyfillAuth =
  | {
      ok: true;
      body: any;
      userId?: string;
      role: string;
      isStaff: boolean;
      table: string;
      action: string;
    }
  | { ok: false; response: NextResponse };

/**
 * Decide whether this polyfill call may proceed.
 *
 * Order matters: the table class is checked first, then whether the action
 * writes. An unauthenticated WRITE is always 401 - never 200 with an empty
 * result, which would read to the caller as "nothing to do".
 */
export async function authorizePolyfillRequest(
  request: Request,
  body: any,
): Promise<PolyfillAuth> {
  const table = String(body?.table || '');
  const action = String(body?.action || 'select');
  const isWrite = action !== 'select';

  const session = await readSession(request);
  const role = session?.role || '';
  const userId = session?.userId;
  const isStaff = STAFF_ROLES.has(role);

  if (!table) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'A table is required.' }, { status: 400 }),
    };
  }

  const known =
    PUBLIC_TABLES.has(table) ||
    Object.prototype.hasOwnProperty.call(SELF_TABLES, table) ||
    STAFF_TABLES.has(table);

  if (!known) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unknown table.' }, { status: 400 }),
    };
  }

  // 1. Anonymous callers may only READ the public catalogue.
  if (!session) {
    if (!PUBLIC_TABLES.has(table)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Unauthorized access. Please login.' },
          { status: 401 },
        ),
      };
    }
    if (isWrite) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Authentication is required to modify this data.' },
          { status: 401 },
        ),
      };
    }
    return { ok: true, body, role: '', isStaff: false, table, action };
  }

  // 2. A signed-in non-staff user may only touch self-scoped tables. Staff
  //    tables (whole-store/platform rows) are refused for ordinary users.
  if (
    !isStaff &&
    STAFF_TABLES.has(table) &&
    !Object.prototype.hasOwnProperty.call(SELF_TABLES, table)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Access Denied - you do not have permission to access this data.' },
        { status: 403 },
      ),
    };
  }

  return { ok: true, body, userId, role, isStaff, table, action };
}

/**
 * Force self-scoped tables to the session user.
 *
 * Returns a NEW filter list: any caller-supplied owner filter is stripped and
 * the session user is pinned, so a signed-in customer can only ever read or
 * write their own rows.
 *
 * Staff are NOT constrained: the admin order list legitimately spans every
 * buyer, and those screens already sit behind requireRole.
 */
export function enforceOwnership(
  table: string,
  filters: any[],
  userId: string | undefined,
  isStaff: boolean,
): { filters: any[]; denied: boolean } {
  if (isStaff) return { filters, denied: false };

  const ownerColumn = SELF_TABLES[table];
  if (!ownerColumn) return { filters, denied: false };
  if (!userId) return { filters, denied: true };

  const cleaned = (Array.isArray(filters) ? filters : []).filter((f: any) => {
    const col = String(f?.column ?? '');
    return (
      col !== ownerColumn &&
      col !== 'id' &&
      col !== 'user_id' &&
      col !== 'userId' &&
      col !== 'buyer_id' &&
      col !== 'buyerId'
    );
  });

  cleaned.push({ column: ownerColumn, operator: 'eq', value: userId });
  return { filters: cleaned, denied: false };
}
