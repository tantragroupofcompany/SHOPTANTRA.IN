/**
 * Proves the REAL Prisma engine's behaviour for Payment.gatewayLogs.
 *
 * Prisma validates the shape of `data` for a model BEFORE the query reaches
 * the database, so the production crash is reproduced exactly — with a raw
 * object, Prisma answers "Expected String or Null, provided Object".
 *
 * This runs against an ISOLATED throwaway SQLite database
 * (prisma/harness/schema.prisma + prisma/harness/harness.db) whose
 * `gatewayLogs` column mirrors the production `Payment.gatewayLogs String?`
 * exactly. The production Postgres database is never contacted, and no
 * production rows are created.
 *
 * The harness client is generated to node_modules/.prisma/harness-client
 * (git-ignored), so the application's own generated client is untouched.
 *
 * Run: npx tsx scripts/test-prisma-gateway-logs-types.ts
 */
import { PrismaClient } from '../node_modules/.prisma/harness-client/index.js';
import { serializeGatewayLogs } from '../src/lib/orderProcessor';

import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Absolute path: Prisma resolves a relative `file:` URL against the process
// CWD, which differs between `prisma db push` and this script.
const HARNESS_DB = 'file:' + path.join(HERE, '..', 'prisma', 'harness', 'harness.db').replace(/\\/g, '/');

const prisma = new PrismaClient({
  datasources: { db: { url: HARNESS_DB } },
});

let passed = 0;
let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) { passed++; console.log('  PASS  ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (detail ? '\n        ' + detail : '')); }
};

async function main() {
  console.log('[1] The OLD payload (raw object) is rejected by the Prisma engine');
  let oldError: any = null;
  try {
    await prisma.payment.create({
      data: {
        orderId: 'order_crash',
        gateway: 'COD',
        amount: 624,
        status: 'PENDING',
        method: 'COD',
        // EXACTLY what the old code wrote: a raw object.
        gatewayLogs: { verifiedAt: new Date().toISOString() } as any,
      },
    });
  } catch (e: any) { oldError = e; }

  const oldMessage = String(oldError?.message || '');
  check(
    'a raw object fails with "Expected String or Null, provided Object"',
    /Expected String or Null, provided Object/i.test(oldMessage),
    oldMessage.slice(0, 400) || '(no error thrown — the write was accepted!)',
  );

  console.log('\n[2] The NEW payload (serialized string) is accepted and persisted');
  const logs = serializeGatewayLogs({ verifiedAt: '2026-10-13T18:22:38.965Z' });
  check('serializeGatewayLogs returns a string', typeof logs === 'string', String(typeof logs));

  const created = await prisma.payment.create({
    data: {
      orderId: 'order_cod_ok',
      gateway: 'COD',
      amount: 624,
      status: 'PENDING',
      method: 'COD',
      gatewayLogs: logs,
    },
  });
  check('the COD payment row was actually created', !!created.id);
  check('the stored gatewayLogs is a string', typeof created.gatewayLogs === 'string');
  check(
    'the stored gatewayLogs round-trips back to the original object',
    JSON.parse(created.gatewayLogs as string).verifiedAt === '2026-10-13T18:22:38.965Z',
  );
  check('the COD amount is preserved (624)', created.amount === 624, String(created.amount));
  check('the COD status is PENDING', created.status === 'PENDING', created.status);
  check('COD is NOT marked webhook-verified', created.webhookVerified === false);


  console.log('\n[3] A null/empty log still produces a valid row (never a null column)');
  for (const [label, value] of [['null', null], ['undefined', undefined], ['empty string', '']] as const) {
    const row = await prisma.payment.create({
      data: {
        orderId: `order_cod_${label}`,
        gateway: 'COD',
        amount: 100,
        method: 'COD',
        gatewayLogs: serializeGatewayLogs(value),
      },
    });
    check(`${label} logs are stored as a valid string`, typeof row.gatewayLogs === 'string' && row.gatewayLogs.length > 0);
  }

  console.log('\n[4] The Razorpay / webhook payloads are accepted too');
  const razorpayRow = await prisma.payment.create({
    data: {
      orderId: 'order_razorpay_ok',
      gateway: 'RAZORPAY',
      amount: 999,
      status: 'PAID',
      method: 'RAZORPAY',
      gatewayLogs: serializeGatewayLogs({
        razorpay_order_id: 'order_X',
        razorpay_payment_id: 'pay_Y',
        razorpay_signature: 'sig_Z',
        verifiedAt: '2026-10-13T18:22:38.965Z',
      }),
    },
  });
  check('the Razorpay payment row was created', !!razorpayRow.id);
  check(
    'the Razorpay ids survive serialization',
    JSON.parse(razorpayRow.gatewayLogs as string).razorpay_payment_id === 'pay_Y',
  );
  check('the Razorpay status is PAID', razorpayRow.status === 'PAID');

  const webhookRow = await prisma.payment.create({
    data: {
      orderId: 'order_webhook_ok',
      gateway: 'RAZORPAY',
      amount: 499,
      status: 'PAID',
      method: 'RAZORPAY',
      gatewayLogs: serializeGatewayLogs({ event: 'payment.captured', payload: { id: 'pay_1' } }),
    },
  });
  check('the webhook payment row was created', !!webhookRow.id);
  check(
    'the webhook event survives serialization',
    JSON.parse(webhookRow.gatewayLogs as string).event === 'payment.captured',
  );

  console.log('\n[5] The payment write is idempotent on transactionReference');
  const ref = 'txn_cod_idem_1';
  await prisma.payment.create({
    data: { orderId: 'order_idem_1', gateway: 'COD', amount: 624, method: 'COD', transactionReference: ref, gatewayLogs: serializeGatewayLogs(null) },
  });
  let dupeError: any = null;
  try {
    await prisma.payment.create({
      data: { orderId: 'order_idem_1', gateway: 'COD', amount: 624, method: 'COD', transactionReference: ref, gatewayLogs: serializeGatewayLogs(null) },
    });
  } catch (e: any) { dupeError = e; }
  check(
    'a duplicate transactionReference is rejected (no duplicate payment row)',
    /Unique constraint/i.test(String(dupeError?.message || '')),
    String(dupeError?.message || '(no error — a duplicate payment was created!)').slice(0, 300),
  );

  const count = await prisma.payment.count();
  console.log(`\nRows in the isolated harness DB: ${count}`);

  console.log(`\nPrisma engine suite: ${passed} passed, ${failed} failed`);
  console.log(`RESULT: ${failed === 0 ? 'PASS' : 'FAIL'}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main()
  .catch((e) => { console.error('UNEXPECTED:', e?.message || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
