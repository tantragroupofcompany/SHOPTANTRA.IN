/**
 * END-TO-END proof that the REAL `processVerifiedOrder()` — the exact function
 * the COD checkout route calls — now completes successfully.
 *
 * Before the fix this function threw
 *   "Invalid prisma.payment.create() invocation ... Argument gatewayLogs:
 *    Invalid value provided. Expected String or Null, provided Object"
 * and aborted the whole checkout transaction.
 *
 * This script runs the real, unmodified processor against an ISOLATED
 * throwaway SQLite database built from the FULL production schema
 * (prisma/e2e/schema.prisma is prisma/schema.prisma with the datasource
 * swapped to SQLite). It seeds a buyer, a seller and a product, then places a
 * real COD order through the real code path and asserts that the order, the
 * payment row (with a REAL string gatewayLogs value), the commission, the
 * wallet and the settlement ledger are all written, and that COD stays
 * PENDING and is never marked webhook-verified.
 *
 * The production Postgres database is NEVER contacted and no production
 * row, stock level or wallet balance is touched.
 *
 * Run: node scripts/setup-cod-e2e-harness.cjs && node scripts/run-cod-e2e.mjs
 */
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const E2E_DB = 'file:' + path.join(HERE, '..', 'prisma', 'e2e', 'e2e.db').replace(/\\/g, '/');

// The real `orderProcessor` uses the application's own Prisma client, which
// reads DATABASE_URL. Point it at the ISOLATED SQLite harness database
// (src/lib/databaseUrl.ts explicitly supports `file:` URLs) so the real
// processor code runs end-to-end without ever touching production Postgres.
//
// The application client itself is generated for PostgreSQL, so the harness
// loader (scripts/e2e-loader.mjs) redirects the `@prisma/client` import to the
// SQLite client generated from prisma/e2e/schema.prisma. The application
// module `src/lib/prisma.ts` is therefore executed UNMODIFIED and builds a
// real Prisma client - it simply is a SQLite one, talking to the throwaway
// database.
process.env.DATABASE_URL = E2E_DB;

// The application's own Prisma client - the exact instance the real
// `processVerifiedOrder()` uses. The assertions read the very same database
// through the very same client, so nothing can diverge.
const { prisma } = await import('../src/lib/prisma');
const { processVerifiedOrder } = await import('../src/lib/orderProcessor');

let passed = 0;
let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) { passed++; console.log('  PASS  ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (detail ? '\n        ' + detail : '')); }
};

const ORDER_DATA = (buyerId: string, sellerId: string, productId: string) => ({
  buyerId,
  sellerId,
  subtotal: 499,
  shippingAmount: 0,
  taxAmount: 0,
  discountAmount: 0,
  totalAmount: 499,
  items: [{ productId, title: 'E2E Test Product', price: 499, quantity: 1, category: 'Beauty' }],
  shippingAddress: { addressLine1: '1 Buyer Street', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
});

async function seed() {
  const buyer = await prisma.user.create({
    data: { id: 'e2e-buyer', email: 'e2e-buyer@example.test', password: 'x', fullName: 'E2E Buyer', phone: '9000000001', role: 'BUYER' },
  });
  const sellerUser = await prisma.user.create({
    data: { id: 'e2e-seller-user', email: 'e2e-seller@example.test', password: 'x', fullName: 'E2E Seller', phone: '9000000002', role: 'SELLER' },
  });
  const seller = await prisma.seller.create({
    data: {
      id: 'e2e-seller', userId: sellerUser.id, storeName: 'E2E Store',
      status: 'ACTIVE', verificationStatus: 'VERIFIED', commissionRate: 10,
    },
  });
  await prisma.pickupAddress.create({
    data: {
      id: 'e2e-pickup', sellerId: seller.id, storeName: 'E2E Store',
      addressLine1: '1 Test Street', city: 'Bengaluru', state: 'Karnataka',
      pincode: '560001', verificationStatus: 'VERIFIED',
      contactName: 'E2E Seller', phone: '9000000002', email: 'e2e-seller@example.test',
    },
  });
  const product = await prisma.product.create({
    data: {
      id: 'e2e-product', sellerId: seller.id, title: 'E2E Test Product',
      price: 499, stock: 10, status: 'ACTIVE', category: 'Beauty',
    },
  });
  return { buyer, seller, product };
}

async function main() {
  const { buyer, seller, product } = await seed();

  console.log('[1] The real processVerifiedOrder() places a COD order');
  let result: any = null;
  let error: any = null;
  try {
    result = await processVerifiedOrder({
      gateway: 'COD',
      transactionReference: 'txn_cod_e2e_1',
      amount: 499,
      method: 'COD',
      // This is EXACTLY the shape the COD checkout route sends. The old code
      // wrote `gatewayLogs: gatewayLogs || { verifiedAt }` — a raw object.
      orderData: ORDER_DATA(buyer.id, seller.id, product.id),
    });
  } catch (e: any) { error = e; }

  check(
    'the COD checkout completed WITHOUT the gatewayLogs crash',
    !error,
    error ? String(error?.message || error).slice(0, 600) : '',
  );
  if (error) {
    console.log('\nABORT: the real processor still throws.');
    process.exitCode = 1;
    return;
  }

  const order = result?.data?.order || result?.order;
  const payment = result?.data?.payment || result?.payment;
  check('the order was created', !!order?.id, JSON.stringify(result).slice(0, 200));
  check('the payment row was created', !!payment?.id);

  console.log('\n[2] The stored gatewayLogs is a real string (the crash is fixed)');
  check('Payment.gatewayLogs is a string', typeof payment.gatewayLogs === 'string', `typeof = ${typeof payment.gatewayLogs}`);
  check('Payment.gatewayLogs is not null', payment.gatewayLogs !== null && payment.gatewayLogs !== undefined);
  check('Payment.gatewayLogs carries the audit envelope', /verifiedAt/.test(String(payment.gatewayLogs)), String(payment.gatewayLogs).slice(0, 200));

  console.log('\n[3] COD semantics are unchanged');
  check('the order payment status is COD_PENDING', order.paymentStatus === 'COD_PENDING', String(order.paymentStatus));
  check('the Payment status is PENDING', payment.status === 'PENDING', String(payment.status));
  check('COD is never marked webhook-verified', payment.webhookVerified === false, String(payment.webhookVerified));
  check('the order is CONFIRMED (fulfilment lifecycle)', order.status === 'CONFIRMED', String(order.status));

  console.log('\n[4] The rest of the ledger was written');
  const commission = await prisma.commission.findFirst({ where: { orderId: order.id } });
  check('the commission row exists', !!commission);
  check('the commission is 10% of 499 = 49.9', Math.abs((commission?.commissionAmount || 0) - 49.9) < 0.01, String(commission?.commissionAmount));
  check('the COD commission is PENDING', commission?.status === 'PENDING', String(commission?.status));

  const wallet = await prisma.vendorWallet.findFirst({ where: { sellerId: seller.id } });
  check('the vendor wallet exists', !!wallet);
  check('the COD earnings went to pendingEarnings, not balance', (wallet?.pendingEarnings || 0) > 0 && (wallet?.balance || 0) === 0, `balance=${wallet?.balance} pending=${wallet?.pendingEarnings}`);

  const settlement = await prisma.sellerSettlement.findFirst({ where: { orderId: order.id } });
  check('the settlement ledger row exists', !!settlement);
  check('the COD settlement is PENDING', settlement?.status === 'PENDING', String(settlement?.status));

  const stockAfter = await prisma.product.findUnique({ where: { id: product.id } });
  check('the stock was decremented exactly once (9)', stockAfter?.stock === 9, String(stockAfter?.stock));

  const paymentCount = await prisma.payment.count({ where: { orderId: order.id } });
  check('exactly ONE payment row exists for the order (no duplicate)', paymentCount === 1, String(paymentCount));

  console.log('\n[5] A second COD order for the same reference is idempotent');
  let dupe: any = null;
  let dupeError: any = null;
  try {
    dupe = await processVerifiedOrder({
      gateway: 'COD',
      transactionReference: 'txn_cod_e2e_1',
      amount: 499,
      method: 'COD',
      orderData: ORDER_DATA(buyer.id, seller.id, product.id),
    });
  } catch (e: any) { dupeError = e; }
  if (dupeError) {
    console.log('  DUPLICATE ERROR: ' + String(dupeError?.message || dupeError).slice(0, 400));
    console.log('  DUPLICATE CODE: ' + String(dupeError?.code || 'n/a'));
  }
  const ordersAfterDupe = await prisma.order.count();
  const paymentsAfterDupe = await prisma.payment.count();
  check('the duplicate did NOT create a second order', ordersAfterDupe === 1, String(ordersAfterDupe));
  check('the duplicate did NOT create a second payment', paymentsAfterDupe === 1, String(paymentsAfterDupe));
  check('the duplicate was reported as already processed', dupe?.alreadyProcessed === true || dupe?.data?.order?.id === order.id, JSON.stringify(dupe).slice(0, 200));
  const stockAfterDupe = await prisma.product.findUnique({ where: { id: product.id } });
  check('the stock was NOT decremented twice (still 9)', stockAfterDupe?.stock === 9, String(stockAfterDupe?.stock));

  console.log(`\nEnd-to-end COD suite: ${passed} passed, ${failed} failed`);
  console.log(`RESULT: ${failed === 0 ? 'PASS' : 'FAIL'}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main()
  .catch((e) => { console.error('UNEXPECTED:', e?.message || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
