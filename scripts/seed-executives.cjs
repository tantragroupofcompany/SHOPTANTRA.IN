/**
 * SEED EXECUTIVE ACCOUNTS
 * Run: node scripts/seed-executives.cjs
 *
 * Creates the three executive accounts (Founder, CEO & MD, Chairman) with
 * Username + Password authentication (no email required for login).
 *
 * Passwords are read from the SAME environment variables the application uses
 * (EXECUTIVE_FOUNDER_PASSWORD / EXECUTIVE_CEO_PASSWORD / EXECUTIVE_CHAIRMAN_PASSWORD)
 * and hashed with bcrypt. Nothing is hardcoded here: this file used to contain
 * literal executive passwords, i.e. a plaintext production credential sitting
 * in source control. It now refuses to run unless every required variable is
 * set, and it never prints a value.
 *
 * If a variable is absent the corresponding account is left completely
 * untouched, matching the runtime provisioning in /api/corporate/login
 * (src/app/api/corporate/login/route.ts), which is the authoritative path. This
 * script is only an optional operator convenience.
 *
 * Never resets a password that already verifies, and never creates duplicates.
 *
 * The usernames are read from src/lib/executives.ts — the single source of truth
 * shared with the login route — so this script can never drift out of sync and
 * provision a second account for an executive who already has one.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { identities, retiredUsernames } = require('../src/lib/executives.json');

const prisma = new PrismaClient();

const executives = identities;

async function seed() {
  const missing = executives.filter(
    (e) => !process.env[e.passwordEnvKey] || process.env[e.passwordEnvKey].trim().length === 0
  );

  if (missing.length > 0) {
    console.error(
      'Refusing to run: no password configured for ' + missing.map((e) => e.role).join(', ') + '.'
    );
    console.error('Set these environment variables first (values are never printed):');
    for (const e of missing) console.error('  - ' + e.passwordEnvKey);
    process.exit(1);
  }

  console.log('Seeding executive accounts...\n');

  // --- 1. Retire superseded credential generations -------------------------
  // A leftover row carrying an old username would keep authenticating, because
  // the login route resolves accounts by username. Rather than deleting the row
  // (which would orphan the executive's orders/audit trail), we clear the
  // username so it can never match, and blank the password hash so it cannot
  // authenticate by email either. The account is then re-identified below by
  // its role and given the current username.
  if (retiredUsernames && retiredUsernames.length > 0) {
    const stale = await prisma.user.findMany({
      where: { username: { in: retiredUsernames } },
      select: { id: true, role: true, username: true },
    });

    for (const row of stale) {
      await prisma.user.update({
        where: { id: row.id },
        data: {
          username: null,
          // An unusable placeholder, NOT a fabricated bcrypt hash. Any value
          // that is not a valid bcrypt/pbkdf2 hash fails closed in
          // verifyPassword(), so this account is inert until re-provisioned.
          password: '!retired-credential-disabled',
        },
      });
      console.log('  RETIRED ' + row.role + ' (' + row.username + ') - can no longer authenticate');
    }

    if (stale.length === 0) {
      console.log('  No superseded executive accounts found (already clean).');
    }
  }

  console.log('');

  // --- 2. Provision the current generation ---------------------------------
  for (const exec of executives) {
    const plain = process.env[exec.passwordEnvKey];

    const existing =
      (await prisma.user.findFirst({ where: { role: exec.role } })) ||
      (await prisma.user.findUnique({ where: { username: exec.username } })) ||
      (await prisma.user.findUnique({ where: { email: exec.email } }));

    if (existing) {
      const passwordMatches = await bcrypt.compare(plain, existing.password);
      const usernameCurrent = existing.username === exec.username;

      // Idempotence must be decided on BOTH fields. Previously the script
      // returned early whenever the password already verified, which left a
      // renamed account stuck on its previous generation's username forever.
      if (passwordMatches && usernameCurrent) {
        console.log('  ' + exec.role + ' (' + exec.username + ') - already provisioned, skipping');
        continue;
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(plain, salt);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: exec.username,
          email: exec.email,
          password: hashedPassword,
          role: exec.role,
          fullName: exec.fullName,
        },
      });
      console.log(
        '  ' + exec.role + ' (' + exec.username + ') - ' +
          (usernameCurrent ? 'password synchronised with env var' : 'account re-identified to current username')
      );
      continue;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(plain, salt);

    await prisma.user.create({
      data: {
        username: exec.username,
        email: exec.email,
        password: hashedPassword,
        role: exec.role,
        fullName: exec.fullName,
      },
    });

    console.log('  ' + exec.role + ' (' + exec.username + ') - created');
  }

  // --- 3. Assert one account per executive role ----------------------------
  // A duplicate executive row is a privilege-escalation hazard: two rows for
  // FOUNDER means two independent passwords granting the same access. Fail loudly.
  for (const exec of executives) {
    const rows = await prisma.user.findMany({
      where: { role: exec.role },
      select: { id: true, username: true },
    });
    if (rows.length > 1) {
      console.error(
        'ERROR: ' + rows.length + ' accounts exist for role ' + exec.role +
          '. Resolve the duplicate manually before going live.'
      );
      process.exitCode = 1;
    }
  }

  console.log('\n  Executive seeding complete.');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('Seed failed:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
