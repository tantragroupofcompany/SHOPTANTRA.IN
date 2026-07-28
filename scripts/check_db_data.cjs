const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    const sellerCount = await prisma.seller.count();
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const reviewCount = await prisma.review.count();

    console.log('--- DATABASE DATA COUNTS ---');
    console.log('Users:', userCount);
    console.log('Sellers:', sellerCount);
    console.log('Products:', productCount);
    console.log('Orders:', orderCount);
    console.log('Reviews:', reviewCount);

    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log('\n--- ACTIVE ACCOUNTS ---');
    users.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`));

    const products = await prisma.product.findMany({ select: { id: true, title: true } });
    console.log('\n--- ACTIVE PRODUCTS ---');
    products.forEach(p => console.log(`- ID: ${p.id}, Title: ${p.title}`));

  } catch (e) {
    console.error('Error querying DB:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
