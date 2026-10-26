-- SHOPTANTRA production schema sync
-- Date: 2026-10-24
-- Additive + fully idempotent: safe to re-run on every build/deploy.
--
-- Adds a unique constraint on (productId, userId) to the Review table so a
-- buyer can submit at most one review per product. This prevents duplicate
-- / spam review submissions at the database level.
--
-- BEFORE adding the constraint, any pre-existing duplicate (productId, userId)
-- pairs are surfaced: the constraint is only created when no duplicates exist,
-- so the migration never fails on dirty data. Duplicates requiring manual
-- review are reported via the DO block's RAISE NOTICE.

DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  -- Count existing duplicate (productId, userId) pairs
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT "productId", "userId"
    FROM "Review"
    GROUP BY "productId", "userId"
    HAVING COUNT(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE NOTICE 'Review unique constraint skipped: % duplicate (productId, userId) pair(s) exist. Deduplicate manually before re-running.', dup_count;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'Review_productId_userId_key'
    ) THEN
      ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_userId_key" UNIQUE ("productId", "userId");
      RAISE NOTICE 'Review unique constraint (productId, userId) added.';
    ELSE
      RAISE NOTICE 'Review unique constraint (productId, userId) already exists.';
    END IF;
  END IF;
END $$;