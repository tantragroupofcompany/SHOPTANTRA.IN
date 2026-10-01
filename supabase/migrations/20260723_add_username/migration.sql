-- Add username field to User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT UNIQUE;

-- Seed executive accounts.
--
-- SECURITY: the passwords are NOT recorded here. They are supplied out-of-band
-- through EXECUTIVE_FOUNDER_PASSWORD / EXECUTIVE_CEO_PASSWORD /
-- EXECUTIVE_CHAIRMAN_PASSWORD and hashed at runtime by the provisioning in
-- /api/corporate/login (src/app/api/corporate/login/route.ts). This file used to
-- state the plaintext passwords in a comment; that has been removed.
--
-- The password column below holds a NON-HASH sentinel, not a credential and not
-- a fabricated bcrypt hash. verifyPassword() only treats a value as a hash when
-- it matches a real bcrypt/pbkdf2 format, so this sentinel fails closed for
-- every possible input. Its only job is to create the three role rows with the
-- correct usernames so the runtime provisioning has something to attach to; on
-- the first corporate login the provisioning detects that the stored value does
-- not verify and rewrites it with a proper bcrypt hash of the configured
-- environment password.
--
-- These rows are ON CONFLICT DO NOTHING, so re-running this migration never
-- resets a working executive password back to the sentinel.
INSERT INTO "User" (id, username, email, password, role, "fullName", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'founder_2026', 'founder@shoptantra.in', '!no-credential-until-provisioned', 'FOUNDER', 'Founder', NOW(), NOW()),
  (gen_random_uuid()::text, 'ceo_2026', 'ceo@shoptantra.in', '!no-credential-until-provisioned', 'CEO_MD', 'CEO & MD', NOW(), NOW()),
  (gen_random_uuid()::text, 'chairman_2026', 'chairman@shoptantra.in', '!no-credential-until-provisioned', 'CHAIRMAN', 'Chairman', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Retire superseded credential generations.
--
-- Any row still carrying a previous generation's username (e.g. the 2027
-- generation) is neutralised: it keeps its id -- and therefore any orders,
-- audit rows or other records that reference it -- but can no longer be used to
-- sign in.
--
-- Two cases, because the current username may or may not already be taken:
--   * free  -> rename to the current username, so the executive keeps one
--              account rather than gaining a second one.
--   * taken -> leave the username alone and only blank the password, since the
--              current-generation row above already exists. The stale row is
--              then simply an inert extra account; the seed script's duplicate
--              check reports it for manual removal.
--
-- The password is set to a NON-HASH sentinel. verifyPassword() fails closed on
-- any value that is not a recognised bcrypt/pbkdf2 hash, so this row rejects
-- every possible input, including by email.
DO $$
DECLARE
  retire TEXT;
  current TEXT;
BEGIN
  FOREACH retire IN ARRAY ARRAY['founder_2027', 'ceo_2027', 'chairman_2027'] LOOP
    current := replace(retire, '_2027', '_2026');

    IF EXISTS (SELECT 1 FROM "User" WHERE username = retire) THEN
      IF EXISTS (SELECT 1 FROM "User" WHERE username = current) THEN
        UPDATE "User"
        SET password = '!retired-credential-disabled',
            "updatedAt" = NOW()
        WHERE username = retire;
      ELSE
        UPDATE "User"
        SET username = current,
            password = '!retired-credential-disabled',
            "updatedAt" = NOW()
        WHERE username = retire;
      END IF;
    END IF;
  END LOOP;
END $$;
