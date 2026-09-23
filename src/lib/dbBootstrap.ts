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
import { hasDatabaseUrl } from './databaseUrl';

const globalForSchema = global as unknown as { __shoptantraSchemaReady?: Promise<void> };

// `hasDatabaseUrl` normalises the configured value first (see lib/databaseUrl.ts),
// so a dashboard value pasted as `DATABASE_URL="postgresql://..."` no longer
// makes the bootstrap think the database is unconfigured.
function hasValidDatabaseUrl(): boolean {
  return hasDatabaseUrl();
}

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
  // --- Shipping Xpress integration (Phase 8/9) — supplier pickup → carrier ---
  // Applied at runtime because production runs behind Supabase's pooler where
  // `prisma migrate deploy` cannot take its advisory locks. Every statement is
  // additive + idempotent, so re-running on each cold start is safe.
  `ALTER TABLE "PickupAddress" ADD COLUMN IF NOT EXISTS "pickupLocationId" TEXT`,
  `ALTER TABLE "PickupAddress" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING'`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "length" DOUBLE PRECISION`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "width" DOUBLE PRECISION`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "height" DOUBLE PRECISION`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "declaredValue" DOUBLE PRECISION`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'MASTER_ACCOUNT'`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "providerShipmentId" TEXT`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "providerOrderId" TEXT`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "paymentMode" TEXT`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "clientRef" TEXT`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "failureReason" TEXT`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "rawResponse" JSONB`,
  `ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "lastProviderSyncAt" TIMESTAMP(3)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_providerShipmentId_key" ON "Shipment" ("providerShipmentId") WHERE "providerShipmentId" IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_clientRef_key" ON "Shipment" ("clientRef") WHERE "clientRef" IS NOT NULL AND "clientRef" <> ''`,
  // --- Buyer Address table (additive, idempotent) ---
  `CREATE TABLE IF NOT EXISTS "Address" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "label"        TEXT NOT NULL,
    "fullName"     TEXT,
    "phone"        TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city"         TEXT NOT NULL,
    "state"        TEXT NOT NULL,
    "country"      TEXT NOT NULL DEFAULT 'India',
    "pincode"      TEXT NOT NULL,
    "isDefault"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Address_userId_fkey') THEN
       ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey"
         FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     END IF;
   END $$`,
  `CREATE INDEX IF NOT EXISTS "Address_userId_idx" ON "Address" ("userId")`,
];

export async function applyStatements(): Promise<void> {
  if (!hasValidDatabaseUrl()) {
    console.warn('[db-bootstrap] Skipping schema bootstrap: DATABASE_URL is missing or invalid in this environment.');
    return;
  }

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