import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Dynamically resolve absolute path to SQLite file at runtime for Vercel lambdas
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.startsWith('file:')) {
  const relativePath = dbUrl.substring(5); // remove 'file:'
  if (!path.isAbsolute(relativePath)) {
    let absolutePath;
    if (relativePath.startsWith('prisma/') || relativePath.startsWith('./prisma/')) {
      absolutePath = path.resolve(process.cwd(), relativePath);
    } else {
      absolutePath = path.resolve(process.cwd(), 'prisma', relativePath);
    }
    dbUrl = `file:${absolutePath}`;
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
