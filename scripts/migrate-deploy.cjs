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
 * Every migration in prisma/migrations is written additively and IDEMPOTENTLY
 * (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS / guarded constraints),
 * so executing ALL of them in chronological order on every build is safe.
 *
 * NOTE: this script used to hard-code a single migration folder, which meant
 * newer migrations (e.g. 20260826000000_shipping_xpress_integration) were never
 * applied in production. It now discovers and replays every migration folder.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'prisma', 'migrations');

/** Every migration folder containing a migration.sql, oldest first. */
function migrationFiles() {
  let entries = [];
  try {
    entries = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true });
  } catch (e) {
    console.error('[migrate-deploy] Could not read migrations directory:', e.message);
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(MIGRATIONS_DIR, entry.name, 'migration.sql'))
    .filter((file) => fs.existsSync(file))
    .sort();
}

if (!process.env.DATABASE_URL) {
  console.log('[migrate-deploy] No DATABASE_URL found - skipping schema migration.');
  process.exit(0);
}

const files = migrationFiles();
if (!files.length) {
  console.log('[migrate-deploy] No migration files found - nothing to apply.');
  process.exit(0);
}

console.log(
  `[migrate-deploy] DATABASE_URL detected - applying ${files.length} idempotent migration(s)...`
);

let failed = false;
for (const file of files) {
  console.log(`[migrate-deploy] Applying ${path.relative(process.cwd(), file)}...`);
  // Paths are quoted because the workspace path / Vercel output path may contain
  // spaces, and `shell: true` would otherwise split the argument.
  const result = spawnSync(
    'npx',
    ['prisma', 'db', 'execute', '--file', `"${file}"`, '--schema', `"${SCHEMA_FILE}"`],
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
    console.error(`[migrate-deploy] Migration reported a failure: ${file}`);
    failed = true;
  }
}

if (failed) {
  console.error('[migrate-deploy] One or more migrations reported a failure.');
}

process.exit(failed ? 1 : 0);
