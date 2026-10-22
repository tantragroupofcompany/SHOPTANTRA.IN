/**
 * Prepares the ISOLATED end-to-end harness used by
 * scripts/test-cod-checkout-e2e.ts.
 *
 * It:
 *   1. derives prisma/e2e/schema.prisma from the REAL prisma/schema.prisma by
 *      swapping ONLY the datasource provider to SQLite (every model, field,
 *      index and relation is kept byte-for-byte identical), and
 *   2. creates a throwaway SQLite database from it.
 *
 * The generated client goes to node_modules/.prisma/e2e-client, so the
 * application's own generated client is never overwritten.
 *
 * The production Postgres database is NEVER contacted, and no production
 * row, stock level or wallet balance is read or written.
 *
 * Run: node scripts/setup-cod-e2e-harness.cjs
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REAL_SCHEMA = path.join(ROOT, 'prisma', 'schema.prisma');
const E2E_DIR = path.join(ROOT, 'prisma', 'e2e');
const E2E_SCHEMA = path.join(E2E_DIR, 'schema.prisma');
const E2E_DB = path.join(E2E_DIR, 'e2e.db');
const CLIENT_OUT_REL = path.join('prisma', 'node_modules', '.prisma', 'e2e-client');
const CLIENT_OUT = path.join(ROOT, 'node_modules', '.prisma', 'e2e-client');

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
  const real = fs.readFileSync(REAL_SCHEMA, 'utf8');
  const e2e = real
    .replace('provider = "postgresql"', 'provider = "sqlite"')
    .replace('url      = env("DATABASE_URL")', 'url      = env("E2E_DATABASE_URL")')
    .replace(
      'generator client {\n  provider = "prisma-client-js"\n}',
      'generator client {\n  provider = "prisma-client-js"\n  output   = "../node_modules/.prisma/e2e-client"\n}',
    );

  if (!/provider = "sqlite"/.test(e2e)) {
    throw new Error('Could not swap the datasource provider to sqlite.');
  }
  fs.mkdirSync(E2E_DIR, { recursive: true });
  fs.writeFileSync(E2E_SCHEMA, e2e, 'utf8');
  console.log('Wrote ' + E2E_SCHEMA);

  run(['prisma', 'generate', '--schema', E2E_SCHEMA], { E2E_DATABASE_URL: 'file:./e2e.db' });

  const generated = path.join(ROOT, CLIENT_OUT_REL);
  if (fs.existsSync(generated)) {
    fs.mkdirSync(path.dirname(CLIENT_OUT), { recursive: true });
    fs.rmSync(CLIENT_OUT, { recursive: true, force: true });
    fs.cpSync(generated, CLIENT_OUT, { recursive: true });
    console.log('  copied isolated client -> ' + CLIENT_OUT);
  }

  // Start from a clean database so the seed in the test is deterministic.
  for (const f of [E2E_DB, E2E_DB + '-journal']) {
    fs.rmSync(f, { force: true });
  }

  run(['prisma', 'db', 'push', '--schema', E2E_SCHEMA, '--skip-generate', '--accept-data-loss'], {
    E2E_DATABASE_URL: 'file:./e2e.db',
  });

  console.log('\nE2E harness ready: ' + E2E_DB);
}

try {
  main();
} catch (e) {
  console.error('\nE2E harness setup FAILED: ' + (e && e.message ? e.message : e));
  process.exitCode = 1;
}
