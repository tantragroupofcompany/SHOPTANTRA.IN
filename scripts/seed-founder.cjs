const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function seedFounder() {
  try {
    const email = 'jadavnileshbhai2006@gmail.com';
    const password = 'Niles@2006';
    const hashedPassword = hashPassword(password);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: { 
          role: 'ADMIN',
          password: hashedPassword,
          fullName: 'ShopTantra Founder'
        },
      });
      console.log(`User ${email} found, updated role to ADMIN, and reset password.`);
    } else {
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN',
          fullName: 'ShopTantra Founder',
        },
      });
      console.log(`Founder account ${email} created successfully with role ADMIN.`);
    }
  } catch (error) {
    console.error('Error seeding founder:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFounder();
