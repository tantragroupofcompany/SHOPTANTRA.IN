/**
 * Runner for the isolated COD end-to-end harness.
 *
 * It registers two ESM loaders, in this order:
 *   1. tsx          - transpiles the TypeScript sources of the application.
 *   2. e2e-loader   - redirects `@prisma/client` to the isolated SQLite
 *                      client and stubs the PostgreSQL-only `dbBootstrap`.
 *
 * The isolated client is generated from prisma/e2e/schema.prisma (the FULL
 * production schema with the datasource swapped to SQLite) and the database is
 * a throwaway file. The production Postgres database is never contacted.
 *
 * Run: node scripts/setup-cod-e2e-harness.cjs && node scripts/run-cod-e2e.mjs
 */
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const { register } = await import('tsx/esm/api');
// tsx first, so that the harness loader - registered afterwards - gets the
// first shot at resolving '@prisma/client' and the dbBootstrap stub.
register();

const { register: registerLoader } = await import('node:module');
registerLoader(pathToFileURL(path.join(HERE, 'e2e-loader.mjs')).href);

await import(pathToFileURL(path.join(HERE, 'test-cod-checkout-e2e.ts')).href);
