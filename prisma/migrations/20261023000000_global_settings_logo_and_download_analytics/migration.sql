-- SHOPTANTRA production schema sync
-- Date: 2026-10-23
-- Additive + fully idempotent: safe to re-run on every build/deploy.
--
-- Fixes the checkout-500 root cause (production `GlobalSettings` was missing
-- the `parentCompanyLogoUrl` column), which made
-- `tx.globalSettings.findUnique()` inside the checkout transaction throw
-- P2022 "column does not exist", poisoning the transaction so the next
-- statement (`commission.create`) failed with 25P02.
-- Also backfills the long-missing `DownloadAnalytics` table.

-- 1. GlobalSettings: optional parent-company logo URL (read by the logo
--    settings route & fallback commission-rate resolution).
ALTER TABLE "GlobalSettings" ADD COLUMN IF NOT EXISTS "parentCompanyLogoUrl" TEXT;

-- 2. DownloadAnalytics: marketplace download telemetry. The Prisma model has
--    existed for months; the corresponding table was never created in prod,
--    so /api/download silently failed. Client-side UUID default is filled by
--    Prisma; the DB only needs a plain default for safety.
CREATE TABLE IF NOT EXISTS "DownloadAnalytics" (
    "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "platform"     TEXT NOT NULL,
    "url"          TEXT NOT NULL,
    "userAgent"    TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);