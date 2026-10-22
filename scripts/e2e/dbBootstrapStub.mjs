/**
 * No-op replacement for `src/lib/dbBootstrap` used by the isolated COD
 * end-to-end harness.
 *
 * The production bootstrap applies PostgreSQL-only DDL (ALTER TABLE ...
 * ADD COLUMN IF NOT EXISTS, `DO $$ ... $$` blocks, JSONB columns) that SQLite
 * cannot parse. The harness database is created with `prisma db push` from the
 * FULL production schema (prisma/e2e/schema.prisma), so every table and column
 * the application expects already exists and nothing has to be bootstrapped.
 *
 * Resolution of this file is performed by scripts/e2e-loader.mjs.
 */
export function ensureSchema() {
  return Promise.resolve();
}

export function applyStatements() {
  return Promise.resolve();
}

export default { ensureSchema, applyStatements };
