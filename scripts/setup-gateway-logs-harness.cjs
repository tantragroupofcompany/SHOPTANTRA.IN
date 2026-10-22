/**
 * Prepares the ISOLATED Prisma harness used by
 * scripts/test-prisma-gateway-logs-types.ts.
 *
 * It:
 *   1. generates a throwaway Prisma client from prisma/harness/schema.prisma
 *      (a minimal `Payment` model whose `gatewayLogs` column mirrors the
 *      production `Payment.gatewayLogs String?` exactly), and
 *   2. creates a throwaway SQLite database for it.
 *
 * The production Postgres database is NEVER contacted, and no production
 * row is created, read or modified.
 *
 * Run: node scripts/setup-gateway-logs-harness.cjs
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA = path.join('prisma', 'harness', 'schema.prisma');
const HARNESS_DB = path.join(ROOT, 'prisma', 'harness', 'harness.db');
const GENERATED_CLIENT = path.join(ROOT, 'node_modules', '.prisma', 'harness-client');
const GENERATED_CLIENT_REL = path.join('prisma', 'node_modules', '.prisma', 'harness-client');

function run(args, env) {
  console.log('> ' + args.join(' '));
  // The workspace path contains spaces, so every path argument is quoted.
  const quoted = args.map((a) => (/[\s]/.test(a) ? `"${a}"` : a));
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', quoted, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
}

function main() {
  if (!fs.existsSync(path.join(ROOT, SCHEMA))) {
    throw new Error('Missing harness schema: ' + SCHEMA);
  }

  // 1. Generate the isolated client.
  run(['prisma', 'generate', '--schema', SCHEMA], { HARNESS_DATABASE_URL: 'file:./harness.db' });

  // Prisma writes the generated client next to the schema by default; move it
  // into node_modules so the script's import path is stable and the app's own
  // generated client (node_modules/.prisma/client) is left untouched.
  const generated = path.join(ROOT, GENERATED_CLIENT_REL);
  if (fs.existsSync(generated)) {
    fs.mkdirSync(path.dirname(GENERATED_CLIENT), { recursive: true });
    fs.rmSync(GENERATED_CLIENT, { recursive: true, force: true });
    fs.cpSync(generated, GENERATED_CLIENT, { recursive: true });
    console.log('  copied isolated client -> ' + GENERATED_CLIENT);
  }

  // 2. Create the throwaway SQLite database.
  run(['prisma', 'db', 'push', '--schema', SCHEMA, '--skip-generate', '--accept-data-loss'], {
    HARNESS_DATABASE_URL: 'file:./harness.db',
  });

  console.log('\nHarness ready: ' + HARNESS_DB);
}

try {
  main();
} catch (e) {
  console.error('\nHarness setup FAILED: ' + (e && e.message ? e.message : e));
  process.exitCode = 1;
}
