// Top-up seed for ShopTantra - adds missing plans and courier partners
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });

async function main() {
  console.log('Running top-up seed...');

  const plans = await prisma.subscriptionPlan.findMany();
  console.log('Existing plans:', plans.map(p => p.name).join(', '));

  const hasUdyog = plans.find(p => p.name === 'Udyog Standard');
  const hasPro = plans.find(p => p.name === 'Vyapaar Pro');

  if (!hasUdyog) {
    await prisma.subscriptionPlan.create({
      data: {
        name: 'Udyog Standard',
        description: 'For growing businesses. List up to 500 products with priority support.',
        price: 2499.0,
        features: JSON.stringify(['List up to 500 products', 'Advanced analytics', 'Priority payouts', 'Priority support', '8% platform commission']),
        durationDays: 30,
      }
    });
    console.log('Added: Udyog Standard');
  }

  if (!hasPro) {
    await prisma.subscriptionPlan.create({
      data: {
        name: 'Vyapaar Pro',
        description: 'Unlimited listings with premium features.',
        price: 4999.0,
        features: JSON.stringify(['Unlimited products', 'Premium analytics', 'Same-day payouts', 'Dedicated manager', '6% platform commission']),
        durationDays: 30,
      }
    });
    console.log('Added: Vyapaar Pro');
  }

  const couriers = await prisma.courierPartner.findMany();
  const courierCodes = couriers.map(c => c.code);
  console.log('Existing couriers:', courierCodes.join(', '));

  if (!courierCodes.includes('DELHIVERY')) {
    await prisma.courierPartner.create({ data: { name: 'Delhivery', code: 'DELHIVERY', isActive: true, baseRatePrepaid: 38.0, baseRateCOD: 60.0, averageDeliveryDays: 4 } });
    console.log('Added: Delhivery');
  }
  if (!courierCodes.includes('BLUEDART')) {
    await prisma.courierPartner.create({ data: { name: 'BlueDart', code: 'BLUEDART', isActive: true, baseRatePrepaid: 55.0, baseRateCOD: 85.0, averageDeliveryDays: 2 } });
    console.log('Added: BlueDart');
  }
  if (!courierCodes.includes('DTDC')) {
    await prisma.courierPartner.create({ data: { name: 'DTDC', code: 'DTDC', isActive: true, baseRatePrepaid: 35.0, baseRateCOD: 55.0, averageDeliveryDays: 5 } });
    console.log('Added: DTDC');
  }
  if (!courierCodes.includes('SHIPROCKET')) {
    await prisma.courierPartner.create({ data: { name: 'Shiprocket', code: 'SHIPROCKET', isActive: true, baseRatePrepaid: 40.0, baseRateCOD: 65.0, averageDeliveryDays: 3 } });
    console.log('Added: Shiprocket');
  }

  console.log('\nTop-up seed complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
