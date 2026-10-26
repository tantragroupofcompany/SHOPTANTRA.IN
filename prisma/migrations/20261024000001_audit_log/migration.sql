-- SHOPTANTRA production schema sync
-- Date: 2026-10-24
-- Additive + fully idempotent: safe to re-run on every build/deploy.
--
-- Creates the AuditLog table used by data-cleanup and moderation scripts
-- to record every destructive or mutative operation. Never dropped;
-- entries are append-only.

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "operation"  TEXT NOT NULL,
    "model"      TEXT NOT NULL,
    "targetId"   TEXT,
    "actor"      TEXT,
    "reason"     TEXT,
    "before"     JSONB,
    "after"      JSONB,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AuditLog_operation_model_idx" ON "AuditLog" ("operation", "model");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");