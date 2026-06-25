// Production Database Seed Script for ShopTantra
// Run with: node scripts/seed.js

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${dbPath}` } }
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('\u{1F331} Starting ShopTantra database seed...');

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
  console.log('\u2705 Global settings seeded');

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
    console.log('\u2705 Subscription plans seeded (3 plans)');
  } else {
    console.log(`\u2139\uFE0F  Subscription plans already exist (${planCount} plans)`);
  }

  // 3. Seed Admin Account (only if no admin exists)
  const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@shoptantra.in',
        password: hashPassword('Admin@ShopTantra2026'),
        role: 'ADMIN',
        fullName: 'ShopTantra Admin',
        phone: '+919000000001',
      },
    });
    console.log('\u2705 Admin account created: admin@shoptantra.in / Admin@ShopTantra2026');
  } else {
    console.log(`\u2139\uFE0F  Admin account already exists: ${adminExists.email}`);
  }

  // 4. Seed Demo Seller Account (for testing)
  const demoSellerExists = await prisma.user.findUnique({ where: { email: 'seller@shoptantra.in' } });
  if (!demoSellerExists) {
    const demoSeller = await prisma.user.create({
      data: {
        email: 'seller@shoptantra.in',
        password: hashPassword('Seller@ShopTantra2026'),
        role: 'SELLER',
        fullName: 'Demo Seller',
        phone: '+919000000002',
      },
    });

    const sellerProfile = await prisma.seller.create({
      data: {
        userId: demoSeller.id,
        storeName: 'Demo Kala Store',
        storeDescription: 'Premium Indian handicrafts and ethnic products from Jaipur.',
        businessType: 'PROPRIETORSHIP',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
        status: 'ACTIVE',
        commissionRate: 10.0,
      },
    });

    await prisma.vendorWallet.create({
      data: {
        sellerId: sellerProfile.id,
        balance: 5000.0,
        pendingEarnings: 2500.0,
      },
    });

    await prisma.pickupAddress.create({
      data: {
        sellerId: sellerProfile.id,
        storeName: 'Demo Kala Store',
        contactName: 'Demo Seller',
        phone: '+919000000002',
        email: 'seller@shoptantra.in',
        addressLine1: '12, Jawahar Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
      },
    });

    await prisma.product.createMany({
      data: [
        {
          sellerId: sellerProfile.id,
          title: 'Rajasthani Blue Pottery Vase',
          price: 599.0,
          comparePrice: 999.0,
          stock: 45,
          category: 'Home & Kitchen',
          shortDescription: 'Authentic Jaipur blue pottery hand-painted vase.',
          description: 'Beautiful hand-painted blue pottery vase from Jaipur artisans. Each piece is unique.',
          sku: 'BPV-001',
          status: 'active',
          images: JSON.stringify([{ url: '/placeholder.jpg', isPrimary: true }]),
          tags: 'blue pottery, rajasthani, handmade, vase',
          weight: 0.5,
        },
        {
          sellerId: sellerProfile.id,
          title: 'Sandalwood Incense Sticks Pack',
          price: 149.0,
          comparePrice: 299.0,
          stock: 200,
          category: 'Ayurveda',
          shortDescription: 'Pure sandalwood incense sticks, 100 sticks per pack.',
          description: 'Premium quality pure sandalwood incense sticks for meditation.',
          sku: 'INC-001',
          status: 'active',
          images: JSON.stringify([{ url: '/placeholder.jpg', isPrimary: true }]),
          tags: 'incense, sandalwood, meditation, ayurveda',
          weight: 0.2,
        },
        {
          sellerId: sellerProfile.id,
          title: 'Handloom Cotton Kurta Set',
          price: 899.0,
          comparePrice: 1499.0,
          stock: 30,
          category: 'Fashion',
          shortDescription: 'Handloom cotton kurta with matching bottom.',
          description: 'Premium handloom cotton kurta set made by Rajasthani weavers.',
          sku: 'KUR-001',
          status: 'active',
          images: JSON.stringify([{ url: '/placeholder.jpg', isPrimary: true }]),
          tags: 'kurta, handloom, cotton, ethnic, fashion',
          weight: 0.4,
        },
      ],
    });

    console.log('\u2705 Demo seller created: seller@shoptantra.in / Seller@ShopTantra2026');
  } else {
    console.log(`\u2139\uFE0F  Demo seller already exists: ${demoSellerExists.email}`);
  }

  // 5. Seed Demo Buyer Account
  const demoBuyerExists = await prisma.user.findUnique({ where: { email: 'buyer@shoptantra.in' } });
  if (!demoBuyerExists) {
    await prisma.user.create({
      data: {
        email: 'buyer@shoptantra.in',
        password: hashPassword('Buyer@ShopTantra2026'),
        role: 'BUYER',
        fullName: 'Demo Buyer',
        phone: '+919000000003',
      },
    });
    console.log('\u2705 Demo buyer created: buyer@shoptantra.in / Buyer@ShopTantra2026');
  } else {
    console.log(`\u2139\uFE0F  Demo buyer already exists: ${demoBuyerExists.email}`);
  }

  // 6. Seed Courier Partners
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
    console.log('\u2705 Courier partners seeded (4 partners)');
  } else {
    console.log(`\u2139\uFE0F  Courier partners already exist (${courierCount})`);
  }

  console.log('\n\u{1F389} ShopTantra database seeding completed!');
  console.log('\n\u{1F4CB} Test Accounts:');
  console.log('  Admin:  admin@shoptantra.in    / Admin@ShopTantra2026');
  console.log('  Seller: seller@shoptantra.in   / Seller@ShopTantra2026');
  console.log('  Buyer:  buyer@shoptantra.in    / Buyer@ShopTantra2026');
}

main()
  .catch((e) => {
    console.error('\u274C Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
