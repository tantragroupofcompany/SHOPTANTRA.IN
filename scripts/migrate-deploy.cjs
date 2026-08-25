/**
 * Runs `prisma migrate deploy` only when a DATABASE_URL is present in the
 * environment (i.e. during Vercel production/preview builds that have database
 * access). Locally or in environments without a database the step is skipped so
 * builds never break.
 *
 * All SHOPTANTRA migrations are written additively (ADD COLUMN IF NOT EXISTS /
 * CREATE TABLE IF NOT EXISTS), so re-running them is safe and idempotent.
 */
const { spawnSync } = require('child_process');

if (!process.env.DATABASE_URL) {
  console.log('[migrate-deploy] No DATABASE_URL found - skipping prisma migrate deploy.');
  process.exit(0);
}

console.log('[migrate-deploy] DATABASE_URL detected - applying pending Prisma migrations...');
const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (result.error) {
  console.error('[migrate-deploy] Failed to start prisma migrate deploy:', result.error);
  // Do not fail the whole deployment because migrations could not be launched;
  // application code degrades gracefully until the migration is applied.
  process.exit(0);
}

process.exit(result.status === null ? 0 : result.status);