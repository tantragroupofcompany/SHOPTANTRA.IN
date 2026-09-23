import { PrismaClient } from '@prisma/client';
import path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { resolveDatabaseUrl } from './databaseUrl';
import { SUPABASE_ROOT_CA_2021_PEM } from './supabaseCa';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Resolve the connection URL defensively: a dashboard value that was pasted as a
// whole `.env` line (`DATABASE_URL="postgresql://..."`) is normalised back to a
// bare URL here, otherwise Prisma rejects every query with
// "the URL must start with the protocol `postgresql://`". See lib/databaseUrl.ts.
let dbUrl = resolveDatabaseUrl();

// Dynamically resolve absolute path to SQLite file at runtime for Vercel lambdas
if (dbUrl && dbUrl.startsWith('file:')) {
  const relativePath = dbUrl.substring(5); // remove 'file:'
  if (!path.isAbsolute(relativePath)) {
    let absolutePath;
    if (relativePath.startsWith('prisma/') || relativePath.startsWith('./prisma/')) {
      absolutePath = path.resolve(process.cwd(), relativePath);
    } else {
      absolutePath = path.resolve(process.cwd(), 'prisma', relativePath);
    }
    dbUrl = `file:${absolutePath}`;
  }
}

/**
 * Postgres traffic goes through the `pg` driver adapter.
 *
 * Why: Supabase's PgBouncer pooler (`*.pooler.supabase.com:6543`) serves a
 * certificate chain anchored at "Supabase Root 2021 CA" — a private CA that is
 * NOT present in any system/Node trust store. Prisma's built-in connector
 * therefore aborts the TLS handshake and reports
 *
 *     P1001: Can't reach database server at `aws-1-...pooler.supabase.com:6543`
 *
 * even though the database is perfectly reachable (proved: the `pg` driver
 * reaches authentication against the same host from the same Vercel runtime).
 *
 * The driver adapter hands TLS back to Node's `pg`, which lets us pass
 * Supabase's PUBLIC root CA explicitly — so the connection keeps full
 * certificate verification. No `rejectUnauthorized: false`, no MITM exposure.
 */
function createPrismaClient(): PrismaClient {
  const log: any = process.env.NODE_ENV === 'production' ? ['error'] : ['warn'];

  if (dbUrl && /^postgres(ql)?:\/\//i.test(dbUrl)) {
    // An explicit `sslmode=disable` in the URL always wins (local overrides).
    const sslDisabled = /[?&]sslmode=disable/i.test(dbUrl);
    const adapter = new PrismaPg({
      connectionString: dbUrl,
      ssl: sslDisabled
        ? undefined
        : { ca: SUPABASE_ROOT_CA_2021_PEM, rejectUnauthorized: true },
    });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log,
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Self-healing schema bootstrap (see src/lib/dbBootstrap.ts).
// Kicked off once per server process so the additive marketplace tables/columns
// exist before application queries need them. Fire-and-forget: critical routes
// additionally await ensureSchema() directly.
import('./dbBootstrap')
  .then((m) => m.ensureSchema())
  .catch(() => {
    /* never block module load */
  });
