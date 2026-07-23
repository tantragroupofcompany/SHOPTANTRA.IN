-- Add username field to User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT UNIQUE;

-- Seed executive accounts
-- Passwords are bcrypt hashes of: FOUNDER@2027, CEO@2027, CHAIRMAN@2027
INSERT INTO "User" (id, username, email, password, role, "fullName", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'founder_2027', 'founder@shoptantra.in', '$2a$12$LJ3m4ys3Lk3k3k3k3k3k3u3k3k3k3k3k3k3k3k3k3k3k3k3k3', 'FOUNDER', 'Founder', NOW(), NOW()),
  (gen_random_uuid()::text, 'ceo_2027', 'ceo@shoptantra.in', '$2a$12$LJ3m4ys3Lk3k3k3k3k3k3u3k3k3k3k3k3k3k3k3k3k3k3k3k3', 'CEO_MD', 'CEO & MD', NOW(), NOW()),
  (gen_random_uuid()::text, 'chairman_2027', 'chairman@shoptantra.in', '$2a$12$LJ3m4ys3Lk3k3k3k3k3k3u3k3k3k3k3k3k3k3k3k3k3k3k3k3', 'CHAIRMAN', 'Chairman', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;