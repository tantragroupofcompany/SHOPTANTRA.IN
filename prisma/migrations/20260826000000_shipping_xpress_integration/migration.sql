-- SHOPTANTRA x Shipping Xpress integration (Phase 8 / Phase 3 / Phase 4).
--
-- Extends the Shipment model with provider-tracking columns so a single
-- marketplace order can carry one Shipment row per seller/pickup location,
-- each tagged with the originating shipping provider.
--
-- These columns are ADDITIVE only — existing marketplace, payment,
-- authentication, corporate and seller functionality is untouched.

-- Idempotency guard: only add columns that do not already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'provider'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'MASTER_ACCOUNT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Shipment' AND column_name = 'providerShipmentId'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "providerShipmentId" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'providerOrderId'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "providerOrderId" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'paymentMode'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "paymentMode" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'length'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "length" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'width'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "width" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'height'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "height" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'declaredValue'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "declaredValue" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'clientRef'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "clientRef" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'failureReason'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "failureReason" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'rawResponse'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "rawResponse" JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'lastProviderSyncAt'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "lastProviderSyncAt" TIMESTAMP(3);
  END IF;
END $$;

-- Partial unique indexes supporting admin search and provider idempotency.
-- NOTE: a partial UNIQUE *constraint* is not valid SQL, hence unique INDEXes.
-- They only apply to real values, so retried/blocked rows holding NULL or an
-- empty client ref can never collide.
CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_providerShipmentId_key"
  ON "Shipment" ("providerShipmentId") WHERE "providerShipmentId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_clientRef_key"
  ON "Shipment" ("clientRef") WHERE "clientRef" IS NOT NULL AND "clientRef" <> '';
