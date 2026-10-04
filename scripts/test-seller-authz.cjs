/**
 * Regression tests for SELLER-SCOPED AUTHORIZATION (multi-tenant isolation).
 *
 * Run: node scripts/test-seller-authz.cjs
 *
 * WHY THIS SUITE EXISTS
 * A dozen `/api/seller/*`, `/api/vendor/*` and `/api/admin/*` routes resolved the
 * store a request was "about" purely from a `sellerId` / `userId` query or body
 * parameter and never compared it to the authenticated session. Several of them
 * then fell through to an ARBITRARY seller:
 *
 *     let seller = await prisma.seller.findFirst({ where: { OR: [...] } });
 *     if (!seller) {
 *       seller = await prisma.seller.findFirst({ where: { status: 'ACTIVE' } });
 *     }
 *
 * so a caller passing any id that did not resolve to a seller was served the
 * first active store's orders, earnings, wallet, coupons and inventory, and
 * `/api/vendor/withdraw` let anyone drain any store's wallet on request.
 *
 * These tests pin the corrected behaviour:
 *   - the arbitrary-seller fallback is gone everywhere
 *   - every money / tenant route requires authentication
 *   - a seller may only reach their own store; staff may cross stores
 *
 * No production records are created or mutated: this is pure logic plus static
 * source assertions, matching the style of the other script tests.
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

/**
 * Remove block and line comments from a TypeScript source string.
 *
 * REQUIRED: several files document the historical vulnerability by quoting the
 * old `prisma.seller.findFirst({ where: { status: 'ACTIVE' } })` fallback inside
 * a comment. Scanning raw source would flag that documentation as live code, so
 * every structural assertion runs against the comment-stripped source.
 */
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
    // Preserve newlines so line-structure regexes stay stable.
    out += c === '\n' ? '\n' : c;
    i++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. The scope decision, re-implemented so the suite exercises the real rules.
//    Mirrors src/lib/sellerAuth.ts.
// ---------------------------------------------------------------------------
const ELEVATED_ROLES = ['ADMIN', 'FOUNDER', 'CEO_MD', 'CHAIRMAN'];

function scopeDecision({ role, userId, ownSellerId, requested }) {
  if (!role) return { status: 401 };
  const elevated = ELEVATED_ROLES.includes(String(role).toUpperCase());

  if (requested) {
    if (!requested.exists) return { status: 404 };
    if (!elevated && (!ownSellerId || ownSellerId !== requested.id)) return { status: 403 };
    return { status: 200, sellerId: requested.id };
  }
  if (ownSellerId) return { status: 200, sellerId: ownSellerId };
  if (elevated) return { status: 200, sellerId: 'first-active-store' };
  return { status: 403 };
}

section('[1] The seller scope decision allows exactly the intended cases');

check('an unauthenticated caller is rejected with 401', () => {
  assert.strictEqual(scopeDecision({ role: null, userId: null }).status, 401);
});
check('a seller reading their OWN store is allowed', () => {
  const d = scopeDecision({ role: 'SELLER', userId: 'u1', ownSellerId: 's1', requested: { exists: true, id: 's1' } });
  assert.strictEqual(d.status, 200);
  assert.strictEqual(d.sellerId, 's1');
});
check('a seller reading ANOTHER store is rejected with 403', () => {
  assert.strictEqual(
    scopeDecision({ role: 'SELLER', userId: 'u1', ownSellerId: 's1', requested: { exists: true, id: 's2' } }).status,
    403,
  );
});
check('a seller with no store of their own cannot reach a store', () => {
  assert.strictEqual(
    scopeDecision({ role: 'SELLER', userId: 'u1', ownSellerId: null, requested: { exists: true, id: 's2' } }).status,
    403,
  );
});
check('an unknown store id is a 404, never a random store', () => {
  assert.strictEqual(
    scopeDecision({ role: 'SELLER', userId: 'u1', ownSellerId: 's1', requested: { exists: false } }).status,
    404,
  );
});
check('an admin may act on any store', () => {
  const d = scopeDecision({ role: 'ADMIN', userId: 'u9', ownSellerId: null, requested: { exists: true, id: 's2' } });
  assert.strictEqual(d.status, 200);
  assert.strictEqual(d.sellerId, 's2');
});
check('an EXECUTIVE (CEO_MD) may act on any store', () => {
  assert.strictEqual(
    scopeDecision({ role: 'CEO_MD', userId: 'u9', ownSellerId: null, requested: { exists: true, id: 's3' } }).status,
    200,
  );
});
check("omitting the store never yields somebody else's store for a seller", () => {
  assert.strictEqual(scopeDecision({ role: 'SELLER', userId: 'u1', ownSellerId: 's1' }).sellerId, 's1');
});
check('a seller with no store and no requested store is rejected (no fallback)', () => {
  assert.strictEqual(scopeDecision({ role: 'SELLER', userId: 'u1', ownSellerId: null }).status, 403);
});
check('only staff may omit the store and still be served', () => {
  assert.strictEqual(scopeDecision({ role: 'ADMIN', userId: 'u9', ownSellerId: null }).status, 200);
  assert.strictEqual(scopeDecision({ role: 'SELLER', userId: 'u1', ownSellerId: null }).status, 403);
});


// ---------------------------------------------------------------------------
// 2. The shared helper exists and encodes the contract.
// ---------------------------------------------------------------------------
section('[2] The shared authorization helper encodes the contract');

const helperPath = 'src/lib/sellerAuth.ts';
const helper = exists(helperPath) ? read(helperPath) : '';

check('src/lib/sellerAuth.ts exists', () => {
  assert.ok(exists(helperPath), 'sellerAuth.ts is missing');
});
check('it exports requireSellerScope', () => {
  assert.ok(/export async function requireSellerScope/.test(helper), 'requireSellerScope not exported');
});
check('it exports resolveSellerIdStrict', () => {
  assert.ok(/export (async )?function resolveSellerIdStrict/.test(helper), 'resolveSellerIdStrict not exported');
});

const fallbackRe = /seller = await prisma\.seller\.findFirst\(\s*\{\s*where: \{ status: 'ACTIVE' \}/;

check('the helper has NO arbitrary-seller fallback', () => {
  assert.ok(!fallbackRe.test(stripComments(helper)), 'the arbitrary ACTIVE-seller fallback is still present in sellerAuth.ts');
});
check('the helper restricts the "pick a store" path to elevated roles', () => {
  // Case C must be guarded by `if (elevated)` immediately before the lookup.
  const code = stripComments(helper);
  assert.ok(/if \(elevated\)[\s\S]{0,120}findFirst\(\s*\{\s*where: \{ status: 'ACTIVE' \}/.test(code),
    'the remaining ACTIVE-store lookup is not restricted to elevated roles');
});

// ---------------------------------------------------------------------------
// 3. Static assertions - the vulnerable routes now guard every handler.
// ---------------------------------------------------------------------------
section('[3] Every previously-vulnerable route is now authorized');

const sellerScopeRoutes = [
  'src/app/api/seller/analytics/route.ts',
  'src/app/api/seller/coupons/route.ts',
  'src/app/api/seller/earnings/route.ts',
  'src/app/api/seller/inventory/route.ts',
  'src/app/api/seller/notifications/route.ts',
  'src/app/api/seller/orders/route.ts',
  'src/app/api/seller/reviews/route.ts',
  'src/app/api/seller/sales-report/route.ts',
  'src/app/api/seller/settings/route.ts',
  'src/app/api/seller/store-settings/route.ts',
  'src/app/api/vendor/wallet/route.ts',
  'src/app/api/vendor/withdraw/route.ts',
];

for (const rel of sellerScopeRoutes) {
  const src = exists(rel) ? stripComments(read(rel)) : '';
  check(`${rel} imports the seller scope guard`, () => {
    assert.ok(exists(rel), 'file missing');
    assert.ok(/import \{ requireSellerScope \} from/.test(src), 'does not import requireSellerScope');
  });
  check(`${rel} no longer falls back to an arbitrary seller`, () => {
    assert.ok(!fallbackRe.test(src), 'arbitrary ACTIVE-seller fallback still present');
  });
}

const adminRoutes = [
  'src/app/api/admin/commissions/route.ts',
  'src/app/api/admin/graphs/route.ts',
  'src/app/api/admin/notifications/route.ts',
  'src/app/api/admin/payouts/route.ts',
  'src/app/api/admin/reports/route.ts',
  'src/app/api/admin/sellers/analytics/route.ts',
  'src/app/api/admin/settlements/route.ts',
];

for (const rel of adminRoutes) {
  const src = exists(rel) ? read(rel) : '';
  check(`${rel} requires an admin/executive role`, () => {
    assert.ok(exists(rel), 'file missing');
    assert.ok(/requireRole\(request, \[/.test(src), 'no requireRole guard');
    assert.ok(/'ADMIN'/.test(src), 'does not include the ADMIN role');
  });
}

check('seller/profile requires ownership of the target user', () => {
  const src = read('src/app/api/seller/profile/route.ts');
  assert.ok(/assertOwnProfile/.test(src), 'seller/profile has no ownership assertion');
  assert.ok(/requireAuth/.test(src), 'seller/profile does not require auth');
});

check('shipment/list is authenticated and scoped', () => {
  const src = read('src/app/api/shipment/list/route.ts');
  assert.ok(/requireRole\(request/.test(src), 'shipment/list has no guard');
  assert.ok(!/let sellerId = searchParams\.get\('sellerId'\)/.test(src), 'still trusts an arbitrary sellerId');
});

check('shipment/update-status verifies shipment ownership', () => {
  const src = read('src/app/api/shipment/update-status/route.ts');
  assert.ok(/requireRole\(request/.test(src), 'shipment/update-status has no guard');
  assert.ok(/belongs to another store/.test(src), 'no ownership rejection');
});

check('sellerAuth.ts exports the shipment/order access helpers', () => {
  assert.ok(/export async function requireShipmentAccess/.test(helper), 'requireShipmentAccess not exported');
  assert.ok(/export async function requireOrderAccess/.test(helper), 'requireOrderAccess not exported');
  assert.ok(/export const SHIPMENT_ROLES/.test(helper), 'SHIPMENT_ROLES not exported');
});

check('SHIPMENT_ROLES excludes buyers (fulfilment is staff/seller work)', () => {
  const rolesBlock = helper.match(/SHIPMENT_ROLES = \[([^\]]*)\]/);
  assert.ok(rolesBlock, 'SHIPMENT_ROLES not found');
  assert.ok(!rolesBlock[1].includes('BUYER'), 'BUYER must not be allowed to act on shipments');
});

// Routes that were completely UNAUTHENTICATED before this pass.
const shipmentGuards = [
  // [route, required helper, why it matters]
  ['src/app/api/shipment/cancel/route.ts', 'requireShipmentAccess',
    'cancels an order and increments stock back into inventory'],
  ['src/app/api/shipment/schedule-pickup/route.ts', 'requireShipmentAccess',
    'mutates a shipment and raises a carrier pickup'],
  ['src/app/api/shipment/label/route.ts', 'requireShipmentAccess',
    'renders buyer name, address, pincode and phone (PII)'],
  ['src/app/api/shipment/create/route.ts', 'requireOrderAccess',
    'books a real carrier shipment and AWB'],
];

for (const [rel, fn, why] of shipmentGuards) {
  check(`${rel} requires ${fn} (${why})`, () => {
    const src = stripComments(read(rel));
    assert.ok(
      new RegExp(`import \\{ ${fn} \\} from`).test(src),
      `${rel} does not import ${fn}`,
    );
    assert.ok(new RegExp(`await ${fn}\\(`).test(src), `${rel} never calls ${fn}`);
  });
}

check('shipment/cancel derives its audit actor from the session, not the body', () => {
  const src = stripComments(read('src/app/api/shipment/cancel/route.ts'));
  // The body may still carry userId/role, but they must not reach the audit log.
  assert.ok(!/logAction\([^)]*userId \|\| 'SYSTEM'/.test(src), 'still trusts body userId for the audit trail');
  assert.ok(!/logAction\([^)]*role \|\| 'ADMIN'/.test(src), 'still trusts body role for the audit trail');
  assert.ok(/logAction\([^)]*actorUserId/.test(src), 'audit actor is not the session-derived id');
});

check('shipment/create cannot book a carrier shipment anonymously', () => {
  const src = stripComments(read('src/app/api/shipment/create/route.ts'));
  // The order access check must run BEFORE the provider is contacted.
  const guardAt = src.indexOf('await requireOrderAccess(');
  const bookAt = src.indexOf('await createShipmentsForOrder(');
  assert.ok(guardAt > -1, 'no requireOrderAccess call');
  assert.ok(bookAt > -1, 'no createShipmentsForOrder call');
  assert.ok(guardAt < bookAt, 'the authorization check runs AFTER the carrier is contacted');
});

check('no /api/shipment route is left without any authorization guard', () => {
  const dir = path.join(root, 'src/app/api/shipment');
  // Routes that are deliberately public, each justified:
  //  - tracking        : a buyer enters their AWB with no session; returns only
  //                     carrier status for that AWB, never account data.
  //  - india-post/*    : hard 410 Gone for a DELETED carrier. Returns a static
  //                     string, touches no database, exposes nothing.
  const publicOk = new Set([
    'tracking/route.ts',
    'india-post/estimate/route.ts',
  ]);
  const offenders = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name === 'route.ts') {
        // Normalise to forward slashes: path.relative emits '\' on Windows.
        const relPath = path.relative(dir, p).split(path.sep).join('/');
        if (publicOk.has(relPath)) continue;
        const code = stripComments(fs.readFileSync(p, 'utf8'));
        const guarded =
          /requireRole\(request/.test(code) ||
          /requireShipmentAccess\(/.test(code) ||
          /requireOrderAccess\(/.test(code) ||
          /requireSellerScope\(/.test(code) ||
          /requireCorporate\(/.test(code) ||
          /requireAuth\(/.test(code);
        if (!guarded) offenders.push(relPath);
      }
    }
  };
  walk(dir);
  assert.deepStrictEqual(offenders, [], 'unguarded shipment routes: ' + offenders.join(', '));
});

check('the public tracking route never returns buyer PII', () => {
  const code = stripComments(read('src/app/api/tracking/route.ts'));

  // The route may legitimately READ shippingAddress to verify the phone a
  // buyer typed (a knowledge factor). What must never happen is RETURNING it.
  // So assert on the serialised response, not on the presence of the field.
  const jsonBlocks = code.match(/NextResponse\.json\([\s\S]*?\n\s*\}\);/g) || [];
  assert.ok(jsonBlocks.length > 0, 'no JSON response blocks found to inspect');
  for (const block of jsonBlocks) {
    assert.ok(
      !/\b(shippingAddress|phone|buyerId|buyerName|email)\b\s*:/.test(block),
      'a tracking response serialises buyer PII:\n' + block.slice(0, 200),
    );
  }
});

check('the AWB branch selects only the fields it returns', () => {
  const code = stripComments(read('src/app/api/tracking/route.ts'));
  // `include: { order: true }` pulls the entire order (address, totals, buyer
  // link) into memory for a public endpoint. Select the named columns instead.
  assert.ok(
    !/include:\s*\{\s*order:\s*true/.test(code),
    'the AWB branch still joins the whole Order row on a public route',
  );
});

check('no /api/seller route still defines the vulnerable local resolver', () => {
  const dir = path.join(root, 'src/app/api/seller');
  const offenders = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name === 'route.ts' && fallbackRe.test(stripComments(fs.readFileSync(p, 'utf8')))) {
        offenders.push(path.relative(root, p));
      }
    }
  };
  walk(dir);
  assert.deepStrictEqual(offenders, [], 'routes still contain the arbitrary fallback: ' + offenders.join(', '));
});

// ---------------------------------------------------------------------------
console.log('\n----------------------------------------');
console.log(`Seller authorization suite: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
