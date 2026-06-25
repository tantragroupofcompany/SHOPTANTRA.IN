const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Metro Pincode Serviceability data...');

  const pincodes = [
    // Mumbai (Metro)
    { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', isMetro: true, allowCod: true, deliveryDays: 2 },
    { pincode: '400050', city: 'Mumbai', state: 'Maharashtra', isMetro: true, allowCod: true, deliveryDays: 2 },
    
    // Delhi (Metro)
    { pincode: '110001', city: 'New Delhi', state: 'Delhi', isMetro: true, allowCod: true, deliveryDays: 2 },
    { pincode: '110020', city: 'New Delhi', state: 'Delhi', isMetro: true, allowCod: true, deliveryDays: 2 },

    // Bangalore (Metro)
    { pincode: '560001', city: 'Bangalore', state: 'Karnataka', isMetro: true, allowCod: true, deliveryDays: 3 },
    { pincode: '560034', city: 'Bangalore', state: 'Karnataka', isMetro: true, allowCod: true, deliveryDays: 3 },

    // Chennai (Metro)
    { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', isMetro: true, allowCod: true, deliveryDays: 3 },
    { pincode: '600028', city: 'Chennai', state: 'Tamil Nadu', isMetro: true, allowCod: true, deliveryDays: 3 },

    // Kolkata (Metro)
    { pincode: '700001', city: 'Kolkata', state: 'West Bengal', isMetro: true, allowCod: true, deliveryDays: 3 },
    { pincode: '700016', city: 'Kolkata', state: 'West Bengal', isMetro: true, allowCod: true, deliveryDays: 3 },

    // Rural / Non-Metro (COD Allowed, slow delivery)
    { pincode: '382010', city: 'Gandhinagar', state: 'Gujarat', isMetro: false, allowCod: true, deliveryDays: 5 },
    { pincode: '390001', city: 'Vadodara', state: 'Gujarat', isMetro: false, allowCod: true, deliveryDays: 4 },

    // Remote (COD Not Allowed)
    { pincode: '793001', city: 'Shillong', state: 'Meghalaya', isMetro: false, allowCod: false, deliveryDays: 7 },
    { pincode: '190001', city: 'Srinagar', state: 'Jammu & Kashmir', isMetro: false, allowCod: false, deliveryDays: 7 },
  ];

  for (const p of pincodes) {
    await prisma.pincodeServiceability.upsert({
      where: { pincode: p.pincode },
      update: p,
      create: p,
    });
  }

  console.log(`Successfully seeded ${pincodes.length} pincodes!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
