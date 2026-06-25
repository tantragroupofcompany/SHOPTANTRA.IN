import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Database verification check...');
  const users = await prisma.user.findMany();
  console.log('Users in database:', users);
  const sellers = await prisma.seller.findMany();
  console.log('Sellers in database:', sellers);
}

main().catch(console.error);
