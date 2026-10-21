/**
 * COD checkout regression tests: gatewayLogs must be schema-compatible.
 *
 * WHY THIS SUITE EXISTS
 * Production COD checkout crashed with:
 *   "Invalid prisma.payment.create() invocation ... Argument gatewayLogs:
 *    Invalid value provided. Expected String or Null, provided Object."
 * because Payment.gatewayLogs is `String?` in prisma/schema.prisma, while
 * src/lib/orderProcessor.ts wrote a raw object
 * (`gatewayLogs || { verifiedAt: ... }`) straight into tx.payment.create().
 * The same crash also hit every Razorpay path (checkout/verify passes an
 * object, the Razorpay webhook passes { event, payload }), since all of them
 * funnel through orderProcessor's single payment.create call.
 *
 * The fix: ALL gatewayLogs payloads are serialized with
 * serializeGatewayLogs() in src/lib/orderProcessor.ts before the write.
 * No production records are created or mutated: pure serialization logic
 * plus static source assertions, matching the other script tests.
 *
 * Run: node scripts/test-cod-gateway-logs.cjs
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS  ' + name);
  } catch (err) {
    failed++;
    console.log('  FAIL  ' + name);
    console.log('        ' + (err && err.message ? err.message : err));
  }
}

const section = (t) => console.log('\n' + t);

(async () => {
  // NOTE: src/lib/orderProcessor.ts cannot be imported by plain node (it uses
  // extensionless TS imports like './prisma'). The serializer below is a
  // line-for-line mirror of serializeGatewayLogs() in that file; section [2]
  // statically asserts the real function is unchanged by diffing its body.
  function serializeGatewayLogs(value) {
    if (value == null) {
      return JSON.stringify({ verifiedAt: new Date().toISOString() });
    }
    if (typeof value === 'string') {
      return value === ''
        ? JSON.stringify({ verifiedAt: new Date().toISOString() })
        : value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return JSON.stringify({
        verifiedAt: new Date().toISOString(),
        note: 'gatewayLogs payload was not JSON-serializable',
      });
    }
  }

  // ===========================================================================
  // 1. Serialization contract: output is ALWAYS a String (never an object).
  // ===========================================================================
  section('[1] serializeGatewayLogs always returns a String');

  check('an object payload (the production crash input) becomes a String', () => {
    const out = serializeGatewayLogs({ verifiedAt: '2026-10-13T18:22:38.965Z' });
    assert.strictEqual(typeof out, 'string');
    assert.ok(out.includes('2026-10-13T18:22:38.965Z'));
  });

  check('the Razorpay verify payload serializes with all ids intact', () => {
    const out = serializeGatewayLogs({
      razorpay_order_id: 'order_X',
      razorpay_payment_id: 'pay_Y',
      razorpay_signature: 'sig_Z',
      verifiedAt: '2026-10-13T18:22:38.965Z',
    });
    assert.strictEqual(typeof out, 'string');
    const back = JSON.parse(out);
    assert.strictEqual(back.razorpay_order_id, 'order_X');
    assert.strictEqual(back.razorpay_payment_id, 'pay_Y');
    assert.strictEqual(back.razorpay_signature, 'sig_Z');
  });

  check('the webhook payload { event, payload } serializes', () => {
    const out = serializeGatewayLogs({ event: 'payment.captured', payload: { id: 'pay_1' } });
    assert.strictEqual(typeof out, 'string');
    assert.strictEqual(JSON.parse(out).event, 'payment.captured');
  });

  check('a pre-serialized string passes through unchanged', () => {
    const s = JSON.stringify({ verifiedAt: '2026-10-13T18:22:38.965Z' });
    assert.strictEqual(serializeGatewayLogs(s), s);
  });

  check('null/undefined/empty fall back to a verifiedAt envelope (never null)', () => {
    for (const v of [null, undefined, '']) {
      const out = serializeGatewayLogs(v);
      assert.strictEqual(typeof out, 'string');
      assert.ok(JSON.parse(out).verifiedAt, `no verifiedAt for ${String(v)}`);
    }
  });

  check('a circular payload degrades to a safe envelope instead of throwing', () => {
    const circular = {};
    circular.self = circular;
    const out = serializeGatewayLogs(circular);
    assert.strictEqual(typeof out, 'string');
    assert.ok(JSON.parse(out).verifiedAt);
  });


  // ===========================================================================
  // 2. Wiring: every payment write path funnels through the serializer.
  // ===========================================================================
  section('[2] Every gatewayLogs write is schema-compatible');

  check('orderProcessor payment.create uses serializeGatewayLogs', () => {
    const src = read('src/lib/orderProcessor.ts');
    assert.ok(
      /gatewayLogs:\s*serializeGatewayLogs\(gatewayLogs\)/.test(src),
      'payment.create no longer serializes gatewayLogs',
    );
    assert.ok(
      !/gatewayLogs:\s*gatewayLogs\s*\|\|/.test(src),
      'the raw-object fallback is still present',
    );
    // The mirror above must match the shipped function body exactly.
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const real = src.match(/export function serializeGatewayLogs\(value: unknown\): string \{([\s\S]*?)\n\}/);
    assert.ok(real, 'serializeGatewayLogs not found in orderProcessor.ts');
    const mirrored = `
    if (value == null) {
      return JSON.stringify({ verifiedAt: new Date().toISOString() });
    }
    if (typeof value === 'string') {
      return value === ''
        ? JSON.stringify({ verifiedAt: new Date().toISOString() })
        : value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return JSON.stringify({
        verifiedAt: new Date().toISOString(),
        note: 'gatewayLogs payload was not JSON-serializable',
      });
    }`;
    assert.strictEqual(
      norm(real[1]),
      norm(mirrored),
      'the test mirror drifted from the shipped serializeGatewayLogs — update both',
    );
  });

  check('no call site writes a raw gatewayLogs object into a payment write', () => {
    const proc = read('src/lib/orderProcessor.ts');
    const verifyRoute = read('src/app/api/checkout/verify/route.ts');
    const webhook = read('src/app/api/webhooks/razorpay/route.ts');
    for (const [name, src] of [['orderProcessor', proc], ['verify route', verifyRoute], ['webhook', webhook]]) {
      assert.ok(
        !/\.payment\.(create|update|upsert)\([\s\S]{0,400}?gatewayLogs:\s*\{/.test(src),
        `${name} writes a raw object literal into a payment write`,
      );
    }
  });

  // ===========================================================================
  // 3. COD semantics preserved: status/verification unchanged by the fix.
  // ===========================================================================
  section('[3] COD stays COD (serialization changed nothing else)');

  check('COD still lands in PENDING, not PAID', () => {
    const src = read('src/lib/orderProcessor.ts');
    assert.ok(
      /isPendingMethod\s*=\s*gateway === 'COD'/.test(src),
      'COD pending-method classification missing',
    );
    assert.ok(
      /const finalPaymentRecordStatus = isPendingMethod \? 'PENDING' : 'PAID'/.test(src),
      'COD PENDING / Razorpay PAID split missing',
    );
  });

  check('COD payments are still never marked webhook-verified', () => {
    const src = read('src/lib/orderProcessor.ts');
    assert.ok(/webhookVerified:\s*!isPendingMethod/.test(src));
  });

  check('the checkout error path no longer leaks Prisma internals', () => {
    const src = read('src/app/api/checkout/verify/route.ts');
    assert.ok(
      !/error\.message \|\| 'Payment signature verification failed'/.test(src),
      'raw error.message is still echoed to the browser',
    );
    assert.ok(
      /Unable to process this order\. Please try again\./.test(src),
      'safe fallback message missing',
    );
  });

  console.log('\n========================================');
  console.log(`COD gatewayLogs suite: ${passed} passed, ${failed} failed`);
  console.log(`RESULT: ${failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log('========================================');
  process.exit(failed === 0 ? 0 : 1);
})();
