-- SHOPTANTRA marketplace migration (Supabase PostgreSQL)
-- Date: 2026-08-25
-- Additive/backwards-compatible only. No columns or tables are dropped.

ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "razorpayLinkedAccountId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "commissionPercent" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundStatus" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "platformAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "sellerTransferAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION;
ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "transferId" TEXT;
ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "CommissionRule" (
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
);

CREATE TABLE IF NOT EXISTS "SellerSettlement" (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS "SellerSettlement_orderId_key" ON "SellerSettlement"("orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "SellerSettlement_paymentId_key" ON "SellerSettlement"("paymentId");
CREATE INDEX IF NOT EXISTS "SellerSettlement_sellerId_idx" ON "SellerSettlement"("sellerId");
CREATE INDEX IF NOT EXISTS "SellerSettlement_status_idx" ON "SellerSettlement"("status");

ALTER TABLE "SellerSettlement" ADD CONSTRAINT "SellerSettlement_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerSettlement" ADD CONSTRAINT "SellerSettlement_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerSettlement" ADD CONSTRAINT "SellerSettlement_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;