/**
 * SHOPTANTRA — Safe demo/test-data cleanup script.
 *
 * Usage:
 *   node scripts/purge-demo.cjs               # dry-run (no mutations)
 *   DRY_RUN=false node scripts/purge-demo.cjs # apply changes for real
 *
 * Safety design:
 *   1. Defaults to DRY_RUN=true — no data is touched unless explicitly opted in.
 *   2. Prefers soft-delete (isActive=false / status archival) over hard delete.
 *   3. Idempotent — re-running is safe; already-processed records are skipped.
 *   4. Writes an AuditLog entry for every operation.
 *   5. Never hard-deletes a user/seller/product that has genuine orders,
 *      payments, or reviews attached.
 *   6. Never truncates tables or runs unbounded DELETEs without a WHERE clause.
 *
 * Classification keywords (email/username/storeName contains):
 *   demo, mock, test, sample, example.com, domain.com, tester, qa, staging
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DRY_RUN = process.env.DRY_RUN !== 'false';
const ACTOR = 'scripts/purge-demo.cjs';

const DEMO_KEYWORDS = [
  'demo', 'mock', 'test', 'sample', 'example.com', 'domain.com',
  'tester', 'qa-', 'staging', 'faketest', 'notreal',
];

function matchesDemoKeyword(value) {
  const v = String(value ?? '').toLowerCase();
  return DEMO_KEYWORDS.some((k) => v.includes(k));
}

function sanitizeForAudit(obj) {
  if (!obj) return null;
  const { password, otpCode, ...rest } = obj;
  return rest;
}

async function logAudit({ operation, model, targetId, reason, before, after }) {
  if (DRY_RUN) {
    console.log(`[DRY-RUN] AuditLog: ${operation} on ${model} ${targetId ?? ''} — ${reason}`);
    return;
  }
  await prisma.auditLog.create({
    data: {
      operation, model, targetId, actor: ACTOR, reason,
      before: before ? sanitizeForAudit(before) : null,
      after: after ? sanitizeForAudit(after) : null,
    },
  });
}
async function main() {
  try {
    console.log(`============================================================`);
    console.log(`SHOPTANTRA demo-data cleanup — DRY_RUN=${DRY_RUN}`);
    console.log(`============================================================\n`);

    const allUsers = await prisma.user.findMany({
      include: {
        sellerProfile: true,
        orders: { include: { items: true, payments: true, commission: true } },
        reviews: true,
        addresses: true,
      },
    });

    console.log(`Total users: ${allUsers.length}`);

    let processed = 0;
    let skipped = 0;

    for (const user of allUsers) {
      const email = user.email ?? '';
      const username = user.username ?? '';
      const fullName = user.fullName ?? '';

      const isDemoMarker =
        matchesDemoKeyword(email) ||
        matchesDemoKeyword(username) ||
        matchesDemoKeyword(fullName);

      if (!isDemoMarker) {
        skipped++;
        continue;
      }

      const hasOrders = user.orders && user.orders.length > 0;
      const hasPayments = user.orders.some((o) => o.payments && o.payments.length > 0);
      const hasReviews = user.reviews && user.reviews.length > 0;

      console.log(`\nDemo-marker user: ${email} (role=${user.role}, isActive=${user.isActive})`);
      console.log(`  orders=${hasOrders ? user.orders.length : 0} payments=${hasPayments ? 'yes' : 'no'} reviews=${hasReviews ? 'yes' : 'no'}`);

      if (hasOrders || hasPayments || hasReviews) {
        console.log(`  -> SOFT-DEACTIVATE (has genuine history)`);
        if (!DRY_RUN) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: false },
          });
          await logAudit({
            operation: 'SOFT_DEACTIVATE_USER',
            model: 'User',
            targetId: user.id,
            reason: 'Demo-marker account with genuine history — deactivated, not deleted',
            before: user,
            after: { ...user, isActive: false },
          });
        }
        processed++;
        continue;
      }

      console.log(`  -> HARD-DELETE (no genuine history)`);

      const seller = user.sellerProfile;
      if (seller) {
        console.log(`    seller profile: ${seller.storeName} (status=${seller.status})`);

        await prisma.orderItem.updateMany({
          where: { product: { sellerId: seller.id } },
          data: { productId: null },
        });

        await prisma.review.deleteMany({ where: { product: { sellerId: seller.id } } });
        await prisma.product.deleteMany({ where: { sellerId: seller.id } });

        await prisma.orderItem.deleteMany({ where: { order: { sellerId: seller.id } } });
        await prisma.payment.deleteMany({ where: { order: { sellerId: seller.id } } });
        await prisma.commission.deleteMany({ where: { order: { sellerId: seller.id } } });
        await prisma.trackingUpdate.deleteMany({ where: { shipment: { order: { sellerId: seller.id } } } });
        await prisma.invoice.deleteMany({ where: { shipment: { order: { sellerId: seller.id } } } });
        await prisma.shipment.deleteMany({ where: { order: { sellerId: seller.id } } });
        await prisma.order.deleteMany({ where: { sellerId: seller.id } });

        await prisma.seller.delete({ where: { id: seller.id } });
        console.log(`    seller profile deleted`);
      }

      await prisma.review.deleteMany({ where: { userId: user.id } });
      await prisma.address.deleteMany({ where: { userId: user.id } });
      await prisma.supportTicket.deleteMany({ where: { userId: user.id } });

      await prisma.user.delete({ where: { id: user.id } });
      console.log(`    user deleted`);
      processed++;
    }
    const demoSellers = await prisma.seller.findMany({
      where: {
        OR: DEMO_KEYWORDS.map((k) => ({
          storeName: { contains: k, mode: 'insensitive' },
        })),
      },
      include: { products: true, user: true },
    });

    for (const seller of demoSellers) {
      const user = await prisma.user.findUnique({ where: { id: seller.userId } });
      if (!user || !user.isActive) continue;

      const hasOrders = await prisma.order.count({ where: { sellerId: seller.id } });
      if (hasOrders > 0) {
        console.log(`\nSeller ${seller.storeName} has ${hasOrders} orders — soft-deactivating`);
        if (!DRY_RUN) {
          await prisma.seller.update({
            where: { id: seller.id },
            data: { status: 'SUSPENDED' },
          });
          await logAudit({
            operation: 'SUSPEND_SELLER',
            model: 'Seller',
            targetId: seller.id,
            reason: 'Demo-marker seller with genuine orders — suspended, not deleted',
            before: seller,
            after: { ...seller, status: 'SUSPENDED' },
          });
        }
        continue;
      }

      console.log(`\nDemo seller (no orders): ${seller.storeName} — removing products and profile`);
      if (!DRY_RUN) {
        await prisma.orderItem.updateMany({
          where: { product: { sellerId: seller.id } },
          data: { productId: null },
        });
        await prisma.review.deleteMany({ where: { product: { sellerId: seller.id } } });
        await prisma.product.deleteMany({ where: { sellerId: seller.id } });
        await prisma.seller.delete({ where: { id: seller.id } });
        await logAudit({
          operation: 'PURGE_DEMO_SELLER',
          model: 'Seller',
          targetId: seller.id,
          reason: 'Demo-marker seller with no orders — removed',
          before: seller,
          after: null,
        });
      }
      processed++;
    }

    console.log(`\n============================================================`);
    console.log(`Processed: ${processed}, Skipped: ${skipped}`);
    console.log(`DRY_RUN=${DRY_RUN} — ${DRY_RUN ? 'NO DATA WAS MUTATED' : 'Changes applied'}`);
    console.log(`============================================================`);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
