/**
 * ESM resolution hook used ONLY by the isolated COD end-to-end harness.
 *
 * It performs two substitutions while the harness runs:
 *
 *   1. `@prisma/client`  ->  the SQLite client generated from
 *      prisma/e2e/schema.prisma (a full copy of the production schema with
 *      the datasource swapped to SQLite). The real `src/lib/prisma.ts` then
 *      builds a REAL Prisma client from it, so the real `processVerifiedOrder()`
 *      runs unmodified against the throwaway SQLite database.
 *
 *   2. `dbBootstrap`  ->  a no-op. The production bootstrap issues
 *      PostgreSQL DDL (ALTER TABLE ... ADD COLUMN IF NOT EXISTS, DO $$ blocks)
 *      which SQLite cannot parse. The harness database is created from the
 *      FULL production schema by `prisma db push`, so the bootstrap has
 *      nothing to add and is skipped.
 *
 * The production Postgres database is never referenced: DATABASE_URL is
 * overridden with a `file:` URL pointing at the throwaway database.
 */
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const E2E_CLIENT = pathToFileURL(
  path.join(ROOT, 'node_modules', '.prisma', 'e2e-client', 'index.js')
).href;
const BOOTSTRAP_STUB = pathToFileURL(
  path.join(ROOT, 'scripts', 'e2e', 'dbBootstrapStub.mjs')
).href;

export async function resolve(specifier, context, next) {
  if (specifier === '@prisma/client') {
    return { url: E2E_CLIENT, shortCircuit: true };
  }
  if (specifier === './dbBootstrap' || specifier.endsWith('/dbBootstrap')) {
    return { url: BOOTSTRAP_STUB, shortCircuit: true };
  }
  return next(specifier, context);
}
