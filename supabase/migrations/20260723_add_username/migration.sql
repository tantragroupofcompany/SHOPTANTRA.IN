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
-- The password column below holds a PLACEHOLDER hash that no password can
-- match. It is not a real credential and is not a secret. It only ensures the
-- three role rows exist with the correct usernames so the runtime provisioning
-- has something to attach to; on first corporate login the provisioning detects
-- that the stored hash does not verify and rewrites it with a proper bcrypt
-- hash of the configured environment password. Do not treat these values as
-- working credentials.
INSERT INTO "User" (id, username, email, password, role, "fullName", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'founder_2027', 'founder@shoptantra.in', '$2a$12$LJ3m4ys3Lk3k3k3k3k3k3u3k3k3k3k3k3k3k3k3k3k3k3k3k3', 'FOUNDER', 'Founder', NOW(), NOW()),
  (gen_random_uuid()::text, 'ceo_2027', 'ceo@shoptantra.in', '$2a$12$LJ3m4ys3Lk3k3k3k3k3k3u3k3k3k3k3k3k3k3k3k3k3k3k3k3', 'CEO_MD', 'CEO & MD', NOW(), NOW()),
  (gen_random_uuid()::text, 'chairman_2027', 'chairman@shoptantra.in', '$2a$12$LJ3m4ys3Lk3k3k3k3k3k3u3k3k3k3k3k3k3k3k3k3k3k3k3k3', 'CHAIRMAN', 'Chairman', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;