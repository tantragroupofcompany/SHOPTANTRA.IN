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
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const executives = [
  {
    username: 'founder_2027',
    email: 'founder@shoptantra.in',
    role: 'FOUNDER',
    fullName: 'Founder',
    passwordEnvKey: 'EXECUTIVE_FOUNDER_PASSWORD',
  },
  {
    username: 'ceo_2027',
    email: 'ceo@shoptantra.in',
    role: 'CEO_MD',
    fullName: 'CEO & MD',
    passwordEnvKey: 'EXECUTIVE_CEO_PASSWORD',
  },
  {
    username: 'chairman_2027',
    email: 'chairman@shoptantra.in',
    role: 'CHAIRMAN',
    fullName: 'Chairman',
    passwordEnvKey: 'EXECUTIVE_CHAIRMAN_PASSWORD',
  },
];

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

  for (const exec of executives) {
    const plain = process.env[exec.passwordEnvKey];

    const existing =
      (await prisma.user.findFirst({ where: { role: exec.role } })) ||
      (await prisma.user.findUnique({ where: { username: exec.username } })) ||
      (await prisma.user.findUnique({ where: { email: exec.email } }));

    if (existing) {
      // Do not reset a password that already matches the configured value.
      if (await bcrypt.compare(plain, existing.password)) {
        console.log('  ' + exec.role + ' (' + exec.username + ') - already provisioned, skipping');
        continue;
      }
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(plain, salt);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: exec.username,
          password: hashedPassword,
          role: exec.role,
          fullName: exec.fullName,
        },
      });
      console.log('  ' + exec.role + ' (' + exec.username + ') - password synchronised with env var');
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

  console.log('\n  Executive seeding complete.');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('Seed failed:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
