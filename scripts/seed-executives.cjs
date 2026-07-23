/**
 * SEED EXECUTIVE ACCOUNTS
 * Run: node scripts/seed-executives.cjs
 *
 * Creates the three executive accounts (Founder, CEO & MD, Chairman)
 * with Username + Password authentication (no email required for login).
 *
 * Passwords are hashed with bcrypt.
 * Will not overwrite existing accounts.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const executives = [
  {
    username: 'founder_2027',
    email: 'founder@shoptantra.in',
    password: 'FOUNDER@2027',
    role: 'FOUNDER',
    fullName: 'Founder',
  },
  {
    username: 'ceo_2027',
    email: 'ceo@shoptantra.in',
    password: 'CEO@2027',
    role: 'CEO_MD',
    fullName: 'CEO & MD',
  },
  {
    username: 'chairman_2027',
    email: 'chairman@shoptantra.in',
    password: 'CHAIRMAN@2027',
    role: 'CHAIRMAN',
    fullName: 'Chairman',
  },
];

async function seed() {
  console.log('Seeding executive accounts...\n');

  for (const exec of executives) {
    const existing = await prisma.user.findUnique({
      where: { username: exec.username },
    });

    if (existing) {
      console.log(`✓ ${exec.role} (${exec.username}) — already exists, skipping`);
      continue;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(exec.password, salt);

    await prisma.user.upsert({
      where: { email: exec.email },
      update: {
        username: exec.username,
        password: hashedPassword,
        role: exec.role,
        fullName: exec.fullName,
      },
      create: {
        username: exec.username,
        email: exec.email,
        password: hashedPassword,
        role: exec.role,
        fullName: exec.fullName,
      },
    });

    console.log(`✓ ${exec.role} (${exec.username}) — created`);
  }

  console.log('\n✓ Executive seeding complete.');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  prisma.$disconnect();
  process.exit(1);
});