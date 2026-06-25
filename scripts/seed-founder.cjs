const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedFounder() {
  try {
    const email = 'jadavnileshbhai2006@gmail.com';
    const password = 'FounderSecurePassword123!';
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Ensure role is upgraded if they already exist
      await prisma.user.update({
        where: { email },
        data: { role: 'FOUNDER' },
      });
      console.log(`User ${email} found and upgraded to FOUNDER.`);
    } else {
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'FOUNDER',
          fullName: 'ShopTantra Founder',
        },
      });
      console.log(`Founder account ${email} created successfully.`);
    }
  } catch (error) {
    console.error('Error seeding founder:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFounder();
