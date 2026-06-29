// Production Database Seed Script for ShopTantra
// Run with: node scripts/seed.cjs

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Starting ShopTantra database seed...');

  // 1. Seed Global Settings
  await prisma.globalSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: {
      id: 'settings',
      defaultCommissionRate: 10.0,
      categoryCommissions: JSON.stringify({
        Electronics: 8,
        Fashion: 12,
        'Home & Kitchen': 10,
        Beauty: 15,
        Grocery: 5,
        Books: 7,
        Toys: 12,
        Sports: 10,
        Automotive: 8,
        'Mobile Accessories': 10,
        Furniture: 8,
        Health: 12,
        Ayurveda: 10,
      }),
    },
  });
  console.log('✅ Global settings seeded');

  // 2. Seed Subscription Plans
  const planCount = await prisma.subscriptionPlan.count();
  if (planCount === 0) {
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: 'Swadeshi Basic',
          description: 'Perfect for new sellers. List up to 50 products with standard platform fees.',
          price: 999.0,
          features: JSON.stringify([
            'List up to 50 products',
            'Standard reports',
            'Standard payouts (7-day cycle)',
            'Email support',
            '10% platform commission',
          ]),
          durationDays: 30,
        },
        {
          name: 'Udyog Standard',
          description: 'For growing businesses. List up to 500 products with priority support.',
          price: 2499.0,
          features: JSON.stringify([
            'List up to 500 products',
            'Advanced analytics',
            'Priority payouts (3-day cycle)',
            'Priority support',
            '8% platform commission',
            'Promotional tools',
          ]),
          durationDays: 30,
        },
        {
          name: 'Vyapaar Pro',
          description: 'For established businesses. Unlimited listings with premium features.',
          price: 4999.0,
          features: JSON.stringify([
            'Unlimited product listings',
            'Premium analytics & reports',
            'Same-day payouts',
            'Dedicated account manager',
            '6% platform commission',
            'Featured store placement',
            'Bulk upload tools',
            'Custom store branding',
          ]),
          durationDays: 30,
        },
      ],
    });
    console.log('✅ Subscription plans seeded (3 plans)');
  } else {
    console.log(`ℹ️ Subscription plans already exist (${planCount} plans)`);
  }

  // 3. Seed Super-Admin Account
  const adminEmail = 'jadavnileshbhai2006@gmail.com';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashPassword('Niles@2006'),
        role: 'ADMIN',
        fullName: 'ShopTantra Founder',
        phone: '+919099985145',
      },
    });
    console.log(`✅ Super-Admin account created: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Super-Admin account already exists: ${adminExists.email}`);
  }

  // 4. Seed Courier Partners
  const courierCount = await prisma.courierPartner.count();
  if (courierCount === 0) {
    await prisma.courierPartner.createMany({
      data: [
        { name: 'Shiprocket', code: 'SHIPROCKET', isActive: true, baseRatePrepaid: 40.0, baseRateCOD: 65.0, averageDeliveryDays: 3 },
        { name: 'Delhivery', code: 'DELHIVERY', isActive: true, baseRatePrepaid: 38.0, baseRateCOD: 60.0, averageDeliveryDays: 4 },
        { name: 'BlueDart', code: 'BLUEDART', isActive: true, baseRatePrepaid: 55.0, baseRateCOD: 85.0, averageDeliveryDays: 2 },
        { name: 'DTDC', code: 'DTDC', isActive: true, baseRatePrepaid: 35.0, baseRateCOD: 55.0, averageDeliveryDays: 5 },
      ],
    });
    console.log('✅ Courier partners seeded (4 partners)');
  } else {
    console.log(`ℹ️ Courier partners already exist (${courierCount})`);
  }

  console.log('\n🎉 ShopTantra production database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
