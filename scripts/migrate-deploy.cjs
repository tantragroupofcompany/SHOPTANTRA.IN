/**
 * Applies pending SHOPTANTRA database schema changes when a DATABASE_URL is
 * present in the environment (i.e. during Vercel production builds that have
 * database access). Locally, or in environments without a database, the step is
 * skipped so builds never break.
 *
 * Why `prisma db execute` instead of `prisma migrate deploy`:
 * the production database is reached through Supabase's PgBouncer pooler
 * (port 6543), which does not support the session-level advisory locks that the
 * Prisma Migrate engine requires - `migrate deploy` hangs on it. Raw SQL via
 * `db execute` works fine.
 *
 * The migration SQL is written additively and IDEMPOTENTLY
 * (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS / guarded constraints),
 * so executing it on every build is safe and fast.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const MIGRATION_FILE = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260825000000_marketplace_auth_settlement',
  'migration.sql'
);

if (!process.env.DATABASE_URL) {
  console.log('[migrate-deploy] No DATABASE_URL found - skipping schema migration.');
  process.exit(0);
}

console.log('[migrate-deploy] DATABASE_URL detected - applying idempotent marketplace schema migration...');
const result = spawnSync(
  'npx',
  ['prisma', 'db', 'execute', '--file', MIGRATION_FILE, '--schema', path.join(__dirname, '..', 'prisma', 'schema.prisma')],
  {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  }
);

if (result.error) {
  console.error('[migrate-deploy] Failed to start prisma db execute:', result.error);
  // Do not fail the whole deployment because the migration could not be launched;
  // application code degrades gracefully until the migration is applied.
  process.exit(0);
}

if (result.status !== 0) {
  console.error('[migrate-deploy] Schema migration reported a failure.');
}

process.exit(result.status === null ? 0 : result.status);