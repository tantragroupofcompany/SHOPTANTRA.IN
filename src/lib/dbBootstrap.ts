/**
 * Self-healing database schema bootstrap.
 *
 * The production database sits behind Supabase's PgBouncer pooler where
 * `prisma migrate deploy` cannot run (it needs session-level advisory locks).
 * This module applies the additive marketplace DDL directly through Prisma at
 * runtime, once per server process, before critical flows touch new tables.
 *
 * Every statement is additive + idempotent and failures are caught so startup
 * is never blocked.
 */

import { prisma } from './prisma';

const globalForSchema = global as unknown as { __shoptantraSchemaReady?: Promise<void> };

const STATEMENTS: string[] = [
  `ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "razorpayLinkedAccountId" TEXT`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "commissionPercent" DOUBLE PRECISION`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundStatus" TEXT`,
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "platformAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`,
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "sellerTransferAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`,
  `ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION`,
  `ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "transferId" TEXT`,
  `ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "failureReason" TEXT`,
  `ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
];

export async function applyStatements(): Promise<void> {
  let applied = 0;
  for (const sql of STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(sql);
      applied += 1;
    } catch (error: any) {
      console.error('[db-bootstrap] Statement failed:', error?.message || error);
    }
  }
  await createMarketplaceTables();
  console.log(`[db-bootstrap] Marketplace schema ensured (${applied}/${STATEMENTS.length} column statements applied).`);
}

async function createMarketplaceTables(): Promise<void> {
  // implemented in dbBootstrapTables.ts to keep this module small
  const { ensureMarketplaceTables } = await import('./dbBootstrapTables');
  await ensureMarketplaceTables();
}

async function bootstrapInternal(): Promise<void> {
  try {
    await applyStatements();
  } catch (error: any) {
    console.error('[db-bootstrap] Unexpected bootstrap error:', error);
    globalForSchema.__shoptantraSchemaReady = undefined;
  }
}

export function ensureSchema(): Promise<void> {
  if (!globalForSchema.__shoptantraSchemaReady) {
    console.log('[db-bootstrap] Ensuring marketplace schema...');
    globalForSchema.__shoptantraSchemaReady = bootstrapInternal();
  }
  return globalForSchema.__shoptantraSchemaReady ?? Promise.resolve();
}