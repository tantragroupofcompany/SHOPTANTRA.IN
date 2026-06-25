const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  
  // Delete in correct order to avoid foreign key constraint violations
  await prisma.walletTransaction.deleteMany();
  await prisma.vendorWallet.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.pickupAddress.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.adminNotification.deleteMany();
  
  console.log('Database tables cleared successfully!');
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
