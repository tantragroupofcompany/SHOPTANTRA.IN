/**
 * Shared corporate (executive) authentication utilities.
 *
 * IMPORTANT ARCHITECTURAL NOTE
 * ----------------------------
 * ShopTantra has TWO authentication systems:
 *
 *  1. Buyer / Seller — Supabase-backed session (see `src/lib/supabase.ts` and
 *     `src/context/AuthContext.tsx`). These users get `auth_token` + `auth_role`
 *     cookies AND a Supabase/local session that populates `useAuth().profile`.
 *
 *  2. Executive (Founder / CEO & MD / Chairman) — username + password login at
 *     `/api/corporate/login`, which issues a signed JWT (jose) into the
 *     `corporate_auth_token` and `auth_token` cookies. These users have NO
 *     Supabase session, so `useAuth().profile` is ALWAYS null for them.
 *
 * Consequence: executive-only dashboards must be gated on the JWT cookie via
 * `/api/corporate/verify` (see `CorporateRoleGuard`), never on `useAuth()`.
 */

/**
 * The only executive roles that exist in the database.
 *
 * NOTE: there is deliberately NO standalone `CEO` or `MD` role. The CEO &
 * Managing Director is a single combined role stored as `CEO_MD`.
 */
export const CORPORATE_ROLES = ['FOUNDER', 'CEO_MD', 'CHAIRMAN'] as const;

export type CorporateRole = (typeof CORPORATE_ROLES)[number];

/** Landing dashboard for each executive role. */
export const CORPORATE_ROLE_DASHBOARD: Record<CorporateRole, string> = {
  FOUNDER: '/founder/dashboard',
  CEO_MD: '/ceo/dashboard',
  CHAIRMAN: '/chairman/dashboard',
};

/**
 * Canonicalise a role string coming from the DB, a JWT payload, or a request
 * body. Tolerates the legacy/alias spellings `CEO` and `MD`, which both map to
 * the single stored role `CEO_MD`. Returns `null` for non-executive roles so
 * callers can distinguish "not an executive" from "an executive".
 */
export function normalizeCorporateRole(role: unknown): CorporateRole | null {
  if (typeof role !== 'string') return null;

  const upper = role.trim().toUpperCase();
  if (!upper) return null;

  if (upper === 'CEO' || upper === 'MD') return 'CEO_MD';

  return (CORPORATE_ROLES as readonly string[]).includes(upper)
    ? (upper as CorporateRole)
    : null;
}

/** Dashboard route for a role; falls back to the shared control centre. */
export function getCorporateRoleDashboard(role: unknown): string {
  const normalized = normalizeCorporateRole(role);
  return normalized ? CORPORATE_ROLE_DASHBOARD[normalized] : '/corporate/dashboard';
}

/**
 * Development-only fallback secret. It is intentionally obvious and MUST never
 * be reachable in production: `getJwtSecretString()` throws in production when
 * `JWT_SECRET` is missing, because a publicly-known signing key would let
 * anyone forge an executive JWT and take over the platform.
 */
const DEV_ONLY_JWT_SECRET = 'shoptantra_dev_only_insecure_jwt_secret';

/**
 * Resolve the JWT signing secret. Works in both the Edge runtime (Next.js
 * middleware) and the Node.js runtime (route handlers).
 *
 * @throws when `JWT_SECRET` is not configured in a production environment.
 */
export function getJwtSecretString(): string {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim().length > 0) return secret;

  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[corporateAuth] FATAL: JWT_SECRET is not configured. Refusing to sign or ' +
        'verify tokens with a fallback key in production. Set JWT_SECRET in the ' +
        'Vercel project environment variables.'
    );
    throw new Error('JWT_SECRET is not configured for this environment.');
  }

  return DEV_ONLY_JWT_SECRET;
}

/** `getJwtSecretString()` encoded for use with `jose`. */
export function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(getJwtSecretString());
}
