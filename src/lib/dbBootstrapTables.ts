import { prisma } from './prisma';

/**
 * Creates the marketplace tables (CommissionRule, SellerSettlement) and their
 * indexes/constraints. Idempotent and safe to run on every cold start.
 */
export async function ensureMarketplaceTables(): Promise<void> {
  const statements: string[] = [
    `CREATE TABLE IF NOT EXISTS "CommissionRule" (
        "id" TEXT NOT NULL,
        "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
        "category" TEXT,
        "productId" TEXT,
        "sellerId" TEXT,
        "rate" DOUBLE PRECISION NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "SellerSettlement" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "sellerId" TEXT NOT NULL,
        "paymentId" TEXT,
        "grossAmount" DOUBLE PRECISION NOT NULL,
        "commissionPercent" DOUBLE PRECISION NOT NULL,
        "commissionAmount" DOUBLE PRECISION NOT NULL,
        "sellerAmount" DOUBLE PRECISION NOT NULL,
        "transferId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "failureReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SellerSettlement_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SellerSettlement_orderId_key" ON "SellerSettlement"("orderId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SellerSettlement_paymentId_key" ON "SellerSettlement"("paymentId")`,
    `CREATE INDEX IF NOT EXISTS "SellerSettlement_sellerId_idx" ON "SellerSettlement"("sellerId")`,
    `CREATE INDEX IF NOT EXISTS "SellerSettlement_status_idx" ON "SellerSettlement"("status")`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (error: any) {
      console.error('[db-bootstrap] Table statement failed:', error?.message || error);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SellerSettlement_orderId_fkey') THEN
              ALTER TABLE "SellerSettlement" ADD CONSTRAINT "SellerSettlement_orderId_fkey"
                  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SellerSettlement_sellerId_fkey') THEN
              ALTER TABLE "SellerSettlement" ADD CONSTRAINT "SellerSettlement_sellerId_fkey"
                  FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SellerSettlement_paymentId_fkey') THEN
              ALTER TABLE "SellerSettlement" ADD CONSTRAINT "SellerSettlement_paymentId_fkey"
                  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
      END $$;
    `);
  } catch (error: any) {
    console.error('[db-bootstrap] Constraint bootstrap failed:', error?.message || error);
  }
}