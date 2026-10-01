/**
 * SINGLE SOURCE OF TRUTH for executive (corporate) identities.
 *
 * SERVER-ONLY DATA. `executives.json` is imported by the login API route and by
 * the operator seed script; this module wraps it with types. It is never
 * imported by a React component, so the usernames can never be bundled into
 * client-side JavaScript. The sign-in form ships with empty fields.
 *
 * SECURITY RULES ENFORCED HERE
 * ----------------------------
 *  1. Usernames are identifiers, not secrets. They are recorded centrally so the
 *     login route, the provisioning logic and the seed script cannot drift apart
 *     and end up with two accounts for one executive.
 *  2. PASSWORDS ARE NOT IN THIS FILE AND MUST NEVER BE ADDED TO IT. The bootstrap
 *     password for each executive arrives through a server-side environment
 *     variable (`passwordEnvKey`) and is hashed with bcrypt before it reaches
 *     the database. See `.env.example`.
 *  3. Accounts are identified by the triple (role, username, email) so that
 *     provisioning updates the existing row in place instead of creating a
 *     duplicate executive on every request.
 */

import executiveData from './executives.json';

export type ExecutiveRole = 'FOUNDER' | 'CEO_MD' | 'CHAIRMAN';

export type ExecutivePasswordEnvKey =
  | 'EXECUTIVE_FOUNDER_PASSWORD'
  | 'EXECUTIVE_CHAIRMAN_PASSWORD'
  | 'EXECUTIVE_CEO_PASSWORD';

export interface ExecutiveIdentity {
  /** Executive role as stored in `User.role` and asserted in the session JWT. */
  role: ExecutiveRole;
  /** The ONLY username accepted at the sign-in form for this executive. */
  username: string;
  /** Stable, role-scoped email used as the secondary provisioning key. */
  email: string;
  fullName: string;
  /** Name of the server-side environment variable holding this account's password. */
  passwordEnvKey: ExecutivePasswordEnvKey;
}

/**
 * The three executive logins, in the order they appear on /corporate-access.
 *
 * The `_2026` suffix is the current credential generation. Superseded generations
 * (e.g. `_2027`) are intentionally absent: provisioning RENAMES the existing row
 * for the role to the username below, so an old generation can no longer
 * authenticate — the row it referred to no longer exists.
 */
export const EXECUTIVE_IDENTITIES: readonly ExecutiveIdentity[] =
  executiveData.identities as ExecutiveIdentity[];

/**
 * Executive usernames that must never authenticate. A login attempt naming one
 * of these is rejected outright with the same generic 401 used for any other bad
 * credential, so the check cannot be used to probe which accounts exist.
 *
 * Superseded generations are retired by RENAMING the account row to the current
 * username rather than by deleting it, so this list is a second line of defence
 * rather than the primary mechanism.
 */
export const RETIRED_EXECUTIVE_USERNAMES: readonly string[] = executiveData.retiredUsernames;

/** True when the submitted username belongs to a superseded credential generation. */
export function isRetiredExecutiveUsername(username: string): boolean {
  return RETIRED_EXECUTIVE_USERNAMES.includes(username);
}
