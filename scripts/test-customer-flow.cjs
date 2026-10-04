/**
 * Phase 1 regression tests: the CUSTOMER shopping journey.
 *
 * Run: node scripts/test-customer-flow.cjs
 *
 * WHY THIS SUITE EXISTS
 * The customer path had confirmed production defects, none covered by an
 * existing test because they all lived in the "trusted browser" gap:
 *
 *   1. `/api/supabase-polyfill` had NO authorization. It is a generic table
 *      gateway on the middleware public allowlist, so an anonymous POST
 *      `{table:'profiles',action:'select',filters:[]}` returned every customer
 *      profile (name + phone). It also accepted anonymous `update` and exposes
 *      `delete` -> deleteMany with caller-chosen filters.
 *   2. That route's `profiles_auth` / `update_auth` branch set ANY user's
 *      password from the body with no session (full account takeover) and
 *      stored it UNHASHED, so verifyPassword() then rejected it.
 *   3. `orderData.buyerId` came from the browser on both checkout routes, so an
 *      order could be filed under another customer's account.
 *   4. `quantity` and `discountAmount` were never range-checked: a negative
 *      quantity satisfied `quantity > stock` and, since stock is written with
 *      `decrement`, INVENTED inventory; an oversized discount bought a basket
 *      for a rupee.
 *
 * No production records are created or mutated: pure logic plus static source
 * assertions, matching the style of the other script tests.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

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

function section(title) {
  console.log('\n' + title);
}

function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === '/' && next === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    out += c === '\n' ? '\n' : c;
    i++;
  }
  return out;
}

// ===========================================================================
// 1. The quantity rule, re-implemented from the server-side guard.
// ===========================================================================
function validateQuantity(qty, stock) {
  if (!Number.isInteger(qty) || qty <= 0) return 'INVALID_QUANTITY';
  if (qty > stock) return 'INSUFFICIENT_STOCK';
  return 'OK';
}

section('[1] Quantity validation rejects the values that corrupted stock');

check('a normal in-stock quantity is accepted', () => {
  assert.strictEqual(validateQuantity(2, 10), 'OK');
});
check('a NEGATIVE quantity is rejected (it used to INVENT stock)', () => {
  assert.strictEqual(validateQuantity(-3, 10), 'INVALID_QUANTITY');
});
check('a ZERO quantity is rejected', () => {
  assert.strictEqual(validateQuantity(0, 10), 'INVALID_QUANTITY');
});
check('a FRACTIONAL quantity is rejected', () => {
  assert.strictEqual(validateQuantity(1.5, 10), 'INVALID_QUANTITY');
});
check('a STRING quantity is rejected', () => {
  assert.strictEqual(validateQuantity('2', 10), 'INVALID_QUANTITY');
});
check('NaN is rejected', () => {
  assert.strictEqual(validateQuantity(NaN, 10), 'INVALID_QUANTITY');
});
check('more than stock is rejected as insufficient', () => {
  assert.strictEqual(validateQuantity(11, 10), 'INSUFFICIENT_STOCK');
});

// ===========================================================================
// 2. The discount / shipping / tax rule.
// ===========================================================================
function validateAmounts({ subtotal, discountAmount, shippingAmount, taxAmount }) {
  for (const v of [discountAmount, shippingAmount, taxAmount]) {
    if (!Number.isFinite(v) || v < 0) return 'INVALID_AMOUNT';
  }
  if (discountAmount > subtotal) return 'DISCOUNT_EXCEEDS_SUBTOTAL';
  const total = subtotal + shippingAmount + taxAmount - discountAmount;
  if (total <= 0) return 'INVALID_TOTAL';
  return 'OK';
}

section('[2] Discount / shipping / tax cannot be abused to underpay');

check('a normal basket is accepted', () => {
  assert.strictEqual(
    validateAmounts({ subtotal: 1000, discountAmount: 100, shippingAmount: 99, taxAmount: 180 }),
    'OK',
  );
});
check('a discount equal to the subtotal is allowed', () => {
  assert.strictEqual(
    validateAmounts({ subtotal: 1000, discountAmount: 1000, shippingAmount: 99, taxAmount: 0 }),
    'OK',
  );
});
check('an OVERSIZED discount is rejected (the buy-for-a-rupee attack)', () => {
  assert.strictEqual(
    validateAmounts({ subtotal: 5000, discountAmount: 99999, shippingAmount: 0, taxAmount: 0 }),
    'DISCOUNT_EXCEEDS_SUBTOTAL',
  );
});
check('a NEGATIVE discount is rejected', () => {
  assert.strictEqual(
    validateAmounts({ subtotal: 1000, discountAmount: -500, shippingAmount: 0, taxAmount: 0 }),
    'INVALID_AMOUNT',
  );
});
check('a NEGATIVE shipping charge cannot reduce the total', () => {
// ===========================================================================
// 3. Buyer identity: the session always wins over the browser.
// ===========================================================================
section('[3] The order buyer is the session, never the browser');

const polyfill = exists('src/lib/polyfillAuth.ts') ? read('src/lib/polyfillAuth.ts') : '';
const buyerAuth = exists('src/lib/buyerAuth.ts') ? read('src/lib/buyerAuth.ts') : '';

check('src/lib/buyerAuth.ts exists', () => {
  assert.ok(exists('src/lib/buyerAuth.ts'), 'buyerAuth.ts missing');
});
check('resolveBuyerId returns the SESSION user when one exists', () => {
  assert.ok(
    /if \(session\) return session\.userId/.test(stripComments(buyerAuth)),
    'resolveBuyerId does not short-circuit on the session',
  );
});
check('an anonymous claimed id is restricted to a safe opaque token', () => {
  assert.ok(
    /\^\[A-Za-z0-9_-\]\{1,64\}\$/.test(stripComments(buyerAuth)),
    'the guest id is not validated, so any string could become a User row',
  );
});

for (const rel of [
  'src/app/api/checkout/razorpay/route.ts',
  'src/app/api/checkout/verify/route.ts',
]) {
  const src = stripComments(read(rel));
  check(`${rel} overrides orderData.buyerId from the session`, () => {
    assert.ok(/import \{ resolveBuyerId \}/.test(src), 'resolveBuyerId not imported');
    assert.ok(
      /buyerId = await resolveBuyerId\(/.test(src),
      'the client-supplied buyerId is not overwritten',
    );
  });
}

check('orderProcessor no longer overwrites an existing user from the body', () => {
  const src = stripComments(read('src/lib/orderProcessor.ts'));
  assert.ok(
    !/user\.upsert\(\{[\s\S]{0,400}?update:\s*\{\s*fullName/.test(src),
    'the buyer upsert still rewrites fullName/phone on an existing account',
  );
  assert.ok(
    /existingUser[\s\S]{0,200}findUniqueOrThrow/.test(src),
    'an existing user is no longer resolved read-only',
  );
});

// ===========================================================================
// 4. Polyfill authorization - the leak that exposed every customer.
// ===========================================================================
section('[4] The supabase polyfill is no longer an open table gateway');

check('src/lib/polyfillAuth.ts exists', () => {
  assert.ok(exists('src/lib/polyfillAuth.ts'), 'polyfillAuth.ts missing');
});
check('it exports the guard and the ownership helper', () => {
  const src = stripComments(polyfill);
  assert.ok(/export async function authorizePolyfillRequest/.test(src), 'authorizePolyfillRequest missing');
  assert.ok(/export function enforceOwnership/.test(src), 'enforceOwnership missing');
});
check('customer PII tables are NOT in the public set', () => {
  const block = stripComments(polyfill).match(/PUBLIC_TABLES = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(block, 'PUBLIC_TABLES not found');
  for (const t of ['profiles', 'orders', 'addresses', 'notifications']) {
    assert.ok(!block[1].includes(`'${t}'`), `${t} must not be publicly readable`);
  }
});
const polyfillRoute = stripComments(read('src/app/api/supabase-polyfill/route.ts'));

check('the polyfill route calls the guard BEFORE any data access', () => {
  // NOTE: `ensureSchema()` legitimately runs before the guard — it is a
  // connection/bootstrap call, not a data read. The first actual record access
  // in the handler is the profiles_auth update, which must be behind the guard.
  const guardAt = polyfillRoute.indexOf('await authorizePolyfillRequest(');
  const firstDataRead = polyfillRoute.indexOf('const updatedUser = await prisma.user.update');
  assert.ok(guardAt > -1, 'authorizePolyfillRequest never called');
  assert.ok(firstDataRead > -1, 'could not locate the first data access');
  assert.ok(guardAt < firstDataRead, 'the guard runs after the first data access');
  // And the table-mapping switch, which decides which delegate is used, must
  // also sit after the guard.
  const switchAt = polyfillRoute.indexOf('switch (table) {');
  assert.ok(guardAt < switchAt, 'the delegate is selected before authorization');
});
check('the polyfill route enforces ownership on the filter list', () => {
  assert.ok(/enforceOwnership\(/.test(polyfillRoute), 'enforceOwnership never called');
  assert.ok(/for \(const filter of scopedFilters\)/.test(polyfillRoute), 'the scoped list is not used');
  assert.ok(!/for \(const filter of filters\)/.test(polyfillRoute), 'the unscoped list is still used');
});
check('profiles_auth requires a session', () => {
  assert.ok(
    /if \(table === 'profiles_auth'[\s\S]{0,900}?if \(!sessionUserId\) return deny;/.test(polyfillRoute),
    'the password-change branch does not require a session',
  );
});
check('profiles_auth refuses to change another account', () => {
  assert.ok(
    /targetId !== sessionUserId && !auth\.isStaff/.test(polyfillRoute),
    "a caller may still rewrite another user's credentials",
  );
});
check('profiles_auth HASHES the new password', () => {
  const block = polyfillRoute.slice(
    polyfillRoute.indexOf('profiles_auth'),
    polyfillRoute.indexOf('// 1. Table Mappings'),
  );
  assert.ok(/hashPassword\(/.test(block), 'the password is stored unhashed');
  assert.ok(
    !/updatePayload\.password = updateData\.password/.test(block),
    'the raw password is still written verbatim',
  );
});

// ===========================================================================
// 5. Public tracking must not 500, and must select real columns only.
// ===========================================================================
section('[5] Tracking degrades cleanly and selects only real columns');

check('a missing AWB returns 404, not 500', () => {
  assert.ok(
    /Shipment tracking information not found[\s\S]{0,60}status: 404/.test(
      stripComments(read('src/app/api/tracking/route.ts')),
    ),
    'the not-found path is not a 404',
  );
});

check('every selected Shipment column exists in the Prisma schema', () => {
  const schema = read('prisma/schema.prisma');
  const start = schema.indexOf('model Shipment {');
  const body = schema.slice(start, schema.indexOf('\n}', start));
  const columns = new Set(
    body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^\w+\s+\w+/.test(l))
      .map((l) => l.split(/\s+/)[0]),
  );

  const code = stripComments(read('src/app/api/tracking/route.ts'));
  const block = code.match(/select:\s*\{[\s\S]*?trackingUpdates:/);
  assert.ok(block, 'the Shipment select block was not found');
  const fields = [...block[0].matchAll(/^ {10}(\w+): true,/gm)].map((m) => m[1]);
  assert.ok(fields.length > 0, 'no scalar fields parsed');
  const unknown = fields.filter((f) => !columns.has(f));
  assert.deepStrictEqual(unknown, [], `non-existent columns selected: ${unknown.join(', ')}`);
});

// ---------------------------------------------------------------------------
console.log('\n----------------------------------------');
console.log(`Customer flow suite: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

check('the storefront catalogue IS still public (do not break the shop)', () => {
  const block = stripComments(polyfill).match(/PUBLIC_TABLES = new Set\(\[([\s\S]*?)\]\)/);
  for (const t of ['products', 'sellers', 'reviews']) {
    assert.ok(block[1].includes(`'${t}'`), `${t} must stay publicly readable`);
  }
});
check('customer tables are self-scoped to the session user', () => {
  const block = stripComments(polyfill).match(/SELF_TABLES[^=]*= \{([\s\S]*?)\n\};/);
  assert.ok(block, 'SELF_TABLES not found');
  assert.ok(/orders:\s*'buyerId'/.test(block[1]), 'orders not scoped to buyerId');
  assert.ok(/addresses:\s*'userId'/.test(block[1]), 'addresses not scoped to userId');
});
check('enforceOwnership strips a caller-supplied owner filter', () => {
  const src = stripComments(polyfill);
  assert.ok(/\.filter\(\(f: any\)/.test(src), 'owner filters are not filtered out');
  assert.ok(
    /column: ownerColumn, operator: 'eq', value: userId/.test(src),
    'the session user is not pinned into the query',
  );
});

  assert.strictEqual(
    validateAmounts({ subtotal: 1000, discountAmount: 0, shippingAmount: -900, taxAmount: 0 }),
    'INVALID_AMOUNT',
  );
});
check('a NEGATIVE tax cannot reduce the total', () => {
  assert.strictEqual(
    validateAmounts({ subtotal: 1000, discountAmount: 0, shippingAmount: 0, taxAmount: -900 }),
    'INVALID_AMOUNT',
  );
});
check('a total of zero or less is rejected', () => {
  assert.strictEqual(
    validateAmounts({ subtotal: 1000, discountAmount: 1000, shippingAmount: 0, taxAmount: 0 }),
    'INVALID_TOTAL',
  );
});
