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
 *
 * The VALUE is never logged or returned to a client: only one warning line is
 * emitted, stating WHICH repair was applied, so a misconfiguration stays
 * visible in the deployment logs.
 * (The shape of the mistake was diagnosed from production via
 * `/api/diag/db-shape`, which reports booleans only.)
 */

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
 */
export function normalizeDatabaseUrl(
  raw?: string | null
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

  const { url, repairs } = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (repairs.length > 0 && url) {
    console.warn(
      `[database-url] DATABASE_URL was not a clean URL; normalised it (${repairs.join(', ')}). ` +
        'Please store the bare connection URL in the environment to avoid this repair.'
    );
  }
  cached = { url, warned: false };
  return url;
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
