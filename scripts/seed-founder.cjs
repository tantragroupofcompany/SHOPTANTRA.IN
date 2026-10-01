/**
 * Seed the site-owner ADMIN account.
 * Run: node scripts/seed-founder.cjs
 *
 * SECURITY: this file used to contain a literal plaintext password for a real
 * ADMIN account, committed to source control. That is a full-privilege
 * credential readable by anyone with repo access, and it must never be
 * reinstated. The password now arrives only through a server-side environment
 * variable and is hashed before it reaches the database. The value is never
 * printed.
 *
 * This account is the ADMIN site owner and is deliberately SEPARATE from the
 * three executive portal accounts (FOUNDER / CHAIRMAN / CEO_MD), which are
 * provisioned by scripts/seed-executives.cjs and /api/corporate/login.
 *
 * Refuses to run unless the environment variable is set, so an absent variable
 * can never reset the account to something guessable.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_ACCOUNT_EMAIL || 'jadavnileshbhai2006@gmail.com';
const ADMIN_PASSWORD_ENV_KEY = 'ADMIN_ACCOUNT_PASSWORD';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function seedFounder() {
  const plain = process.env[ADMIN_PASSWORD_ENV_KEY];
  if (!plain || plain.trim().length === 0) {
    console.error('Refusing to run: ' + ADMIN_PASSWORD_ENV_KEY + ' is not set.');
    console.error('Set it in the environment (the value is never printed) and re-run.');
    process.exitCode = 1;
    return;
  }

  const email = ADMIN_EMAIL;
  // Hash locally; `plain` is never logged, echoed or returned.
  const hashedPassword = hashPassword(plain);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        password: hashedPassword,
        fullName: 'ShopTantra Founder',
      },
    });
    console.log(`Admin account ${email} found: role set to ADMIN, password rotated from env var.`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        fullName: 'ShopTantra Founder',
      },
    });
    console.log(`Admin account ${email} created with role ADMIN.`);
  }
}

seedFounder()
  .catch((error) => {
    console.error('Error seeding admin account:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

