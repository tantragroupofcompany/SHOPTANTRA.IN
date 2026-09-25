/**
 * SHOP TANTRA — DATABASE_URL resolution.
 *
 * Production runs on Vercel, where the value of `DATABASE_URL` can only be
 * maintained through the dashboard. A very easy mistake there is to paste the
 * whole `.env` LINE — key, quotes and all — into the value field:
 *
 *     DATABASE_URL="postgresql://user:pw@host:6543/postgres?pgbouncer=true"
 *
 * Prisma then rejects EVERY query with:
 *
 *     Error validating datasource `db`: the URL must start with the protocol
 *     `postgresql://` or `postgres://`.
 *
 * ...which takes the entire site down (logins 503, admin checks 500, product
 * reads 500) even though the credentials themselves are perfectly valid.
 *
 * This module turns that copy/paste shape into a working connection:
 *   1. trims surrounding whitespace
 *   2. removes a leading `KEY=` assignment (`DATABASE_URL=`)
 *   3. removes one layer of surrounding quotes (' or ")
 *   4. adds `connection_limit=1` when the URL talks to Supabase's PgBouncer
 *      pooler (`pgbouncer=true`) and no explicit limit was given — the
 *      documented serverless setting for that pooler.
 *   5. replaces a leftover `PROJECT_REF` placeholder in the username/host with
 *      the project's real, public ref, and re-points the host at the pooler
 *      cluster that serves the project (`SUPABASE_POOLER_HOST`) when the stored
 *      value names a different one — Supavisor answers both mistakes with
 *      `FATAL: (ENOTFOUND) tenant/user postgres.<...> not found`.
 *
 * The VALUE is never logged or returned to a client: only one warning line is
 * emitted, stating WHICH repair was applied, so a misconfiguration stays
 * visible in the deployment logs.
 * (The shape of the mistake was diagnosed from production via
 * `/api/diag/db-shape`, which reports booleans only.)
 */

/**
 * The public Supabase project ref, e.g. `abcdefghijklmnop` taken from
 * `https://abcdefghijklmnop.supabase.co`. This is NOT a secret: Next.js inlines
 * `NEXT_PUBLIC_SUPABASE_URL` into the browser bundle, so the ref is already
 * public. It is read here so that a connection string which still carries the
 * template's `PROJECT_REF` placeholder can be repaired without ever needing the
 * database password (which stays inside Vercel).
 */
export function resolveSupabaseProjectRef(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const raw = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
  const match = String(raw).match(/^https?:\/\/([a-z0-9]{6,})\.supabase\.(?:co|in|net)\b/i);
  return match ? match[1] : undefined;
}

/**
 * The Supabase POOLER (Supavisor) host that actually serves this project, e.g.
 * `aws-1-ap-south-1.pooler.supabase.com`. This is NOT a secret either — it is a
 * public DNS name — but it cannot be derived from the project ref, so it has its
 * own variable.
 *
 * Why it is needed: Supavisor resolves the tenant from the USERNAME
 * (`postgres.<project-ref>`) *inside the cluster the hostname belongs to*. A
 * connection string whose host names a different Supavisor cluster/region than
 * the one serving the project is answered with
 *
 *     FATAL: (ENOTFOUND) tenant/user postgres.<project-ref> not found
 *
 * even though the project ref and the password are both correct. Repairing the
 * host needs no secret, so the credential keeps living only inside Vercel.
 */
export function resolveSupabasePoolerHost(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const raw = String(env.SUPABASE_POOLER_HOST || '').trim().toLowerCase();
  return /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(raw) ? raw : undefined;
}

/**
 * Matches `PROJECT_REF`, `PROJECT-REF`, `<project-ref>`, `[YOUR-PROJECT-REF]`, ...
 * The `%5B`/`%5D` alternatives matter because `new URL()` percent-encodes square
 * brackets inside a username, so a bracketed template username is seen as
 * `postgres.%5BYOUR-PROJECT-REF%5D`.
 */
const PROJECT_REF_PLACEHOLDER = /(?:%5B|\x5B)?\s*(?:your[-_ ]?)?project[-_ ]?ref\s*(?:%5D|\x5D)?/gi;

/** A whole credential that is still the template's placeholder, not a password. */
const PLACEHOLDER_VALUE = /^[<\x5B]?(?:your[-_ ]?)?(?:password|project[-_ ]?ref|sensitive|encrypted)[>\x5D]?$/i;

/** `URL.username`/`URL.password` are returned percent-encoded; compare decoded. */
function decodeIfPossible(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Repairs a connection string that was pasted from Supabase's template with the
 * `PROJECT_REF` placeholder left in it, using the project ref that is already
 * public in `NEXT_PUBLIC_SUPABASE_URL`.
 *
 * Production proof: Supavisor answered every query with
 *   `FATAL: (ENOTFOUND) tenant/user postgres.PROJECT_REF not found`
 * i.e. the USERNAME itself was still the template placeholder — the pooler never
 * even reached password authentication, which is why no password could work.
 *
 * Only the username (and a placeholder inside the host) is rewritten. The
 * password is never read, logged, altered or re-encoded, so the credential that
 * Vercel already holds keeps working untouched.
 */
function repairProjectRefPlaceholders(
  url: string,
  projectRef: string | undefined
): { url: string; repaired: boolean } {
  if (!projectRef || !/project[-_ ]?ref/i.test(url)) return { url, repaired: false };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, repaired: false };
  }

  const username = parsed.username;
  const hostname = parsed.hostname;
  const nextUsername = username.replace(PROJECT_REF_PLACEHOLDER, projectRef);
  const nextHostname = hostname.replace(PROJECT_REF_PLACEHOLDER, projectRef);

  if (nextUsername === username && nextHostname === hostname) return { url, repaired: false };

  parsed.username = nextUsername;
  parsed.hostname = nextHostname;
  // `toString()` round-trips every other part of the URL byte-for-byte
  // (verified against `pg-connection-string` for encoded passwords).
  return { url: parsed.toString(), repaired: true };
}

/**
 * Re-points a pooler connection string at the configured Supabase pooler host.
 *
 * Only the HOST of an existing `*.pooler.supabase.com` URL is touched: user,
 * password, port, database and query parameters are reused byte-for-byte, so the
 * credential never leaves the process and never needs to be re-typed.
 */
function repairPoolerHost(
  url: string,
  poolerHost?: string
): { url: string; previousHost?: string; repaired: boolean } {
  if (!poolerHost) return { url, repaired: false };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, repaired: false };
  }

  if (!/\.pooler\.supabase\.com$/i.test(parsed.hostname)) return { url, repaired: false };
  if (parsed.hostname.toLowerCase() === poolerHost) return { url, repaired: false };

  const previousHost = parsed.hostname;
  parsed.hostname = poolerHost;
  return { url: parsed.toString(), previousHost, repaired: true };
}

function stripOneLayerOfQuotes(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    if ((first === '"' || first === "'") && value[value.length - 1] === first) {
      return value.slice(1, -1);
    }
  }
  return value;
}

const CONNECTION_URL_PREFIX = /^(postgres(ql)?:\/\/|file:|mysql:\/\/)/i;

/**
 * Pure normaliser: converts a dashboard copy/paste shape into a valid
 * connection URL. Returns `undefined` when there is nothing usable.
 *
 * `projectRef` (optional) is the PUBLIC Supabase project ref; when given, a
 * connection string that still contains the template's `PROJECT_REF`
 * placeholder is repaired with it (username/host only — never the password).
 *
 * `poolerHost` (optional) is the PUBLIC Supabase pooler hostname; when given, an
 * existing `*.pooler.supabase.com` host is re-pointed at it. User, password,
 * port, database and parameters are reused verbatim — only the host changes.
 */
export function normalizeDatabaseUrl(
  raw?: string | null,
  projectRef?: string,
  poolerHost?: string
): { url: string | undefined; repairs: string[] } {
  if (typeof raw !== 'string') return { url: undefined, repairs: [] };

  let url = raw.trim();
  if (!url) return { url: undefined, repairs: [] };

  const repairs: string[] = [];

  // A copy/pasted env line can contain several layers of damage
  // (`KEY="URL"`, `KEY='URL'`, `"URL"`), so peel until stable.
  for (let pass = 0; pass < 3; pass += 1) {
    const before = url;

    const assignment = url.match(/^[A-Za-z_][A-Za-z0-9_]*\s*=\s*([\s\S]+)$/);
    if (assignment) {
      const withoutQuotes = stripOneLayerOfQuotes(assignment[1].trim()).trim();
      if (CONNECTION_URL_PREFIX.test(withoutQuotes)) {
        url = assignment[1].trim();
        repairs.push('removed "KEY=" assignment prefix');
      }
    }

    const unquoted = stripOneLayerOfQuotes(url.trim()).trim();
    if (unquoted !== url) {
      url = unquoted;
      repairs.push('removed surrounding quotes');
    }

    if (url === before) break;
  }

  if (!CONNECTION_URL_PREFIX.test(url)) return { url: undefined, repairs };

  // A connection string pasted from Supabase's template still names the tenant
  // as `postgres.PROJECT_REF`, which Supavisor rejects with
  // `FATAL: (ENOTFOUND) tenant/user postgres.PROJECT_REF not found` before it
  // ever checks the password. Substituting the real (public) project ref is the
  // only repair that needs no secret.
  const refRepair = repairProjectRefPlaceholders(url, projectRef);
  if (refRepair.repaired) {
    url = refRepair.url;
    repairs.push('replaced the PROJECT_REF placeholder with the real project ref');
  }

  const hostRepair = repairPoolerHost(url, poolerHost);
  if (hostRepair.repaired) {
    url = hostRepair.url;
    repairs.push(`repointed the pooler host (was ${hostRepair.previousHost}) to ${poolerHost}`);
  }

  if (/^postgres(ql)?:\/\//i.test(url) && /pgbouncer=true/i.test(url) && !/connection_limit=/i.test(url)) {
    url = `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`;
    repairs.push('added connection_limit=1 for the PgBouncer pooler');
  }

  return { url, repairs };
}

let cached: { url: string | undefined; warned: boolean } | null = null;

/**
 * Reads + normalises `process.env.DATABASE_URL` once per server process.
 */
export function resolveDatabaseUrl(): string | undefined {
  if (cached) return cached.url;

  const projectRef = resolveSupabaseProjectRef();
  const poolerHost = resolveSupabasePoolerHost();
  const { url, repairs } = normalizeDatabaseUrl(process.env.DATABASE_URL, projectRef, poolerHost);
  if (repairs.length > 0 && url) {
    console.warn(
      `[database-url] DATABASE_URL was not a clean URL; normalised it (${repairs.join(', ')}). ` +
        'Please store the bare connection URL in the environment to avoid this repair.'
    );
  }
  if (!projectRef && /project[-_ ]?ref/i.test(process.env.DATABASE_URL || '')) {
    console.error(
      '[database-url] DATABASE_URL still contains a PROJECT_REF placeholder, and no public Supabase ' +
        'project URL is configured (NEXT_PUBLIC_SUPABASE_URL), so it cannot be repaired at runtime.'
    );
  }
  cached = { url, warned: false };
  return url;
}

/**
 * Which part of the resolved connection string is still a template placeholder
 * rather than a real value. Coarse and non-sensitive: it is used only to label a
 * database outage honestly (see authUtils.dbErrorReason).
 */
export function describeCredentialPlaceholders(): { username: boolean; password: boolean } {
  const url = resolveDatabaseUrl();
  if (!url) return { username: false, password: false };
  try {
    const parsed = new URL(url);
    return {
      username: /project[-_ ]?ref/i.test(decodeIfPossible(parsed.username)),
      password: PLACEHOLDER_VALUE.test(decodeIfPossible(parsed.password)),
    };
  } catch {
    return { username: false, password: false };
  }
}

/** True when a usable Postgres/connection URL is configured for this process. */
export function hasDatabaseUrl(): boolean {
  const url = resolveDatabaseUrl();
  return !!url && CONNECTION_URL_PREFIX.test(url);
}

/** True when the resolved URL points at a Postgres server (not SQLite). */
export function hasValidDatabaseUrl(): boolean {
  const url = resolveDatabaseUrl();
  return !!url && /^postgres(?:ql)?:\/\//i.test(url);
}
