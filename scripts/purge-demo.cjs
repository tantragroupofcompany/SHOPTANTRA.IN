const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purgeDemoAccounts() {
  try {
    const demoKeywords = ['demo', 'mock', 'test', 'sample', 'example.com', 'domain.com'];
    const users = await prisma.user.findMany();
    
    let deletedCount = 0;
    for (const user of users) {
      const email = user.email.toLowerCase();
      if (demoKeywords.some(keyword => email.includes(keyword))) {
        console.log(`Deleting demo user: ${email} (${user.role})`);
        
        // Delete dependent buyer records
        await prisma.orderItem.deleteMany({ where: { order: { buyerId: user.id } } });
        await prisma.payment.deleteMany({ where: { order: { buyerId: user.id } } });
        await prisma.commission.deleteMany({ where: { order: { buyerId: user.id } } });
        await prisma.trackingUpdate.deleteMany({ where: { shipment: { order: { buyerId: user.id } } } });
        await prisma.invoice.deleteMany({ where: { shipment: { order: { buyerId: user.id } } } });
        await prisma.shipment.deleteMany({ where: { order: { buyerId: user.id } } });
        await prisma.order.deleteMany({ where: { buyerId: user.id } });
        await prisma.review.deleteMany({ where: { userId: user.id } });
        await prisma.supportTicket.deleteMany({ where: { userId: user.id } });

        // Check if user is a seller and delete their products/orders
        const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
        if (seller) {
          // Delete seller's orders
          await prisma.orderItem.deleteMany({ where: { order: { sellerId: seller.id } } });
          await prisma.payment.deleteMany({ where: { order: { sellerId: seller.id } } });
          await prisma.commission.deleteMany({ where: { order: { sellerId: seller.id } } });
          await prisma.trackingUpdate.deleteMany({ where: { shipment: { order: { sellerId: seller.id } } } });
          await prisma.invoice.deleteMany({ where: { shipment: { order: { sellerId: seller.id } } } });
          await prisma.shipment.deleteMany({ where: { order: { sellerId: seller.id } } });
          await prisma.order.deleteMany({ where: { sellerId: seller.id } });

          // Products
          await prisma.orderItem.deleteMany({ where: { product: { sellerId: seller.id } } });
          await prisma.review.deleteMany({ where: { product: { sellerId: seller.id } } });
          await prisma.product.deleteMany({ where: { sellerId: seller.id } });
        }

        await prisma.user.delete({
          where: { id: user.id }
        });
        deletedCount++;
      }
    }
    
    console.log(`Successfully deleted ${deletedCount} demo accounts from the production database.`);
  } catch (error) {
    console.error('Error purging demo accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

purgeDemoAccounts();
