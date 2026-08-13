import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProductStatus() {
  console.log('Starting product status migration...');
  
  // Find all products with lowercase status values
  const productsToFix = await prisma.product.findMany({
    where: {
      OR: [
        { status: 'draft' },
        { status: 'active' },
        { status: 'pending' },
        { status: 'rejected' },
        { status: 'blocked' },
        { status: 'archived' },
      ]
    },
    select: {
      id: true,
      title: true,
      status: true,
    }
  });

  console.log(`Found ${productsToFix.length} products with lowercase status values`);

  if (productsToFix.length === 0) {
    console.log('No products need fixing. Migration complete.');
    await prisma.$disconnect();
    return;
  }

  // Update each product to uppercase status
  for (const product of productsToFix) {
    const upperStatus = product.status.toUpperCase();
    await prisma.product.update({
      where: { id: product.id },
      data: { status: upperStatus },
    });
    console.log(`Updated: ${product.title} (${product.status} → ${upperStatus})`);
  }

  console.log('\nMigration completed successfully!');
  console.log(`Total products updated: ${productsToFix.length}`);
  
  await prisma.$disconnect();
}

fixProductStatus().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
