/**
 * Regression tests for the dashboard / storefront defects fixed in this pass.
 *
 * Run: node scripts/test-dashboard-regressions.cjs
 *
 * WHY A SEPARATE SUITE: `test-executive-auth.cjs` covers sign-in security. These
 * are the *runtime* defects that shipped to production while every existing gate
 * reported green, because nothing asserted on them. Each test re-implements the
 * fixed logic against the SAME input shapes production receives and asserts the
 * corrected behaviour; several additionally read the real source file to assert
 * the specific defect is gone, so a refactor that reintroduces the bug fails here
 * rather than in production.
 *
 * COVERED
 *   1. Dashboard product-status aggregation (the fake-zero bug).
 *   2. Storefront visibility rules - only ACTIVE is customer visible.
 *   3. Seller write-path status canonicalisation.
 *   4. Detail-panel request referential stability (the card-click bug).
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

/**
 * The aggregation helper exactly as it now exists in the dashboard route: keys
 * are upper-cased so a case-sensitive Prisma groupBy cannot produce a silent miss.
 */
function byStatus(rows) {
  const map = {};
  rows.forEach((row) => {
    const key = String(row.status ?? '').toUpperCase();
    if (!key) return;
    map[key] = (map[key] || 0) + (row._count._all || 0);
  });
  return map;
}

/**
 * The customer-visible predicate the storefront queries express. The polyfill
 * applies an insensitive `status` filter, so this is exactly the production rule.
 */
function isCustomerVisible(row) {
  return String(row.status ?? '').toUpperCase() === 'ACTIVE';
}
// ---------------------------------------------------------------------------
console.log('\n[1] Dashboard product-status aggregation (fake-zero bug)');

const counts = byStatus([
  { status: 'ACTIVE', _count: { _all: 12 } },
  { status: 'PENDING', _count: { _all: 4 } },
  { status: 'DRAFT', _count: { _all: 3 } },
  { status: 'REJECTED', _count: { _all: 2 } },
  { status: 'BLOCKED', _count: { _all: 1 } },
]);

check('upper-case stored statuses resolve to a non-zero approved count', () => {
  const approved = (counts['ACTIVE'] || 0) + (counts['APPROVED'] || 0);
  assert.strictEqual(approved, 12, '12 ACTIVE products must not report as 0');
});
check('pending products awaiting review resolve to a non-zero count', () => {
  assert.strictEqual(counts['PENDING'] || 0, 4);
});
check('draft / rejected / blocked each resolve to a non-zero count', () => {
  assert.strictEqual(counts['DRAFT'] || 0, 3);
  assert.strictEqual(counts['REJECTED'] || 0, 2);
  assert.strictEqual(counts['BLOCKED'] || 0, 1);
});
check('a legacy lower-case row is counted, not silently dropped', () => {
  const legacy = byStatus([
    { status: 'active', _count: { _all: 7 } },
    { status: 'draft', _count: { _all: 5 } },
  ]);
  assert.strictEqual(legacy['ACTIVE'] || 0, 7, "legacy 'active' must count as ACTIVE");
  assert.strictEqual(legacy['DRAFT'] || 0, 5, "legacy 'draft' must count as DRAFT");
});
check('mixed casing of one state is summed, not double-keyed', () => {
  const mixed = byStatus([
    { status: 'ACTIVE', _count: { _all: 2 } },
    { status: 'active', _count: { _all: 3 } },
  ]);
  assert.strictEqual(mixed['ACTIVE'], 5);
});
check('a genuinely empty table still reports a real 0', () => {
  assert.strictEqual(byStatus([])['ACTIVE'] || 0, 0, 'no rows must mean 0, not undefined');
});
check('a null status never creates an empty-string bucket', () => {
  const withNull = byStatus([
    { status: null, _count: { _all: 9 } },
    { status: 'ACTIVE', _count: { _all: 1 } },
  ]);
  assert.strictEqual(withNull[''], undefined, 'a null status must not become a bucket');
  assert.strictEqual(withNull['ACTIVE'], 1);
});

check('dashboard route reads product counts with UPPER-case keys', () => {
  const src = read('src/app/api/corporate/dashboard/route.ts');
  assert.ok(
    /productCounts\['ACTIVE'\]/.test(src),
    "dashboard must read the upper-case productCounts key, not the lower-case one"
  );
  assert.ok(
    !/productCounts\['active'\]/.test(src),
    'the lower-case productCounts lookup is the fake-zero bug and must be gone'
  );
  assert.ok(
    /String\(row\.status \?\? ''\)\.toUpperCase\(\)/.test(src),
    'byStatus must upper-case the stored status before keying the map'
  );
});

// ---------------------------------------------------------------------------
console.log('\n[2] Storefront visibility rules');

check('an ACTIVE (published + approved) product is customer visible', () => {
  assert.strictEqual(isCustomerVisible({ status: 'ACTIVE' }), true);
});
check('a legacy lower-case active product is still visible (casing-tolerant)', () => {
  assert.strictEqual(isCustomerVisible({ status: 'active' }), true);
});
check('a DRAFT product is NOT publicly visible', () => {
  assert.strictEqual(isCustomerVisible({ status: 'DRAFT' }), false);
});
check('a PENDING product awaiting review is NOT publicly visible', () => {
  assert.strictEqual(isCustomerVisible({ status: 'PENDING' }), false);
});
check('a REJECTED product is NOT publicly visible', () => {
  assert.strictEqual(isCustomerVisible({ status: 'REJECTED' }), false);
});
check('a BLOCKED product is NOT publicly visible', () => {
  assert.strictEqual(isCustomerVisible({ status: 'BLOCKED' }), false);
});
check('a product with no status is NOT publicly visible (fail closed)', () => {
  assert.strictEqual(isCustomerVisible({ status: null }), false);
  assert.strictEqual(isCustomerVisible({}), false);
});

check('the homepage applies the ACTIVE storefront filter', () => {
  const src = read('src/views/Home.tsx');
  const start = src.indexOf("from('products')");
  const block = src.slice(start, start + 200);
  assert.ok(
    /\.eq\('status',\s*'ACTIVE'\)/.test(block),
    'Home.tsx must filter the product query on status ACTIVE, not select every row'
  );
});
check('the product detail page applies the ACTIVE storefront filter', () => {
  const src = read('src/views/ProductDetail.tsx');
  const start = src.indexOf("from('products')");
  const block = src.slice(start, start + 300);
  assert.ok(
    /\.eq\('status',\s*'ACTIVE'\)/.test(block),
    'ProductDetail.tsx must enforce the same visibility rule as the listing pages'
  );
});
// ---------------------------------------------------------------------------
console.log('\n[3] Seller write-path publication policy');

// The write path no longer derives publication from the posted `status` field.
// Publication is decided by the seller's real account status, so these checks
// model that policy. The "seller cannot self-approve" guarantee still holds and
// is now enforced server-side against the seller row rather than a whitelist.
function initialStatus(seller) {
  const eligible =
    !!seller &&
    ['ACTIVE', 'APPROVED'].includes(String(seller.status || '').toUpperCase()) &&
    String(seller.verificationStatus || '').toUpperCase() === 'VERIFIED';
  return eligible ? 'ACTIVE' : 'PENDING';
}

check('a verified ACTIVE seller publishes immediately', () => {
  assert.strictEqual(
    initialStatus({ status: 'ACTIVE', verificationStatus: 'VERIFIED' }),
    'ACTIVE'
  );
});
check('a blocked seller is held PENDING regardless of what they post', () => {
  assert.strictEqual(
    initialStatus({ status: 'BLOCKED', verificationStatus: 'VERIFIED' }),
    'PENDING'
  );
});
check('a suspended seller is held PENDING', () => {
  assert.strictEqual(
    initialStatus({ status: 'SUSPENDED', verificationStatus: 'VERIFIED' }),
    'PENDING'
  );
});
check('an unverified seller is held PENDING', () => {
  assert.strictEqual(
    initialStatus({ status: 'ACTIVE', verificationStatus: 'PENDING_VERIFICATION' }),
    'PENDING'
  );
});
check('a seller with no account row fails closed to PENDING', () => {
  assert.strictEqual(initialStatus(null), 'PENDING');
});
check('an approved product becomes visible once it is ACTIVE', () => {
  // The executive approval endpoint writes the canonical ACTIVE value.
  assert.strictEqual(isCustomerVisible({ status: 'ACTIVE' }), true);
});
check('the executive approval endpoint still writes the canonical ACTIVE', () => {
  const src = read('src/app/api/corporate/product-action/route.ts');
  assert.ok(
    /case 'approve':[\s\S]*?status = 'ACTIVE'/.test(src),
    'approving a product must write ACTIVE'
  );
});

check('seller create path derives status from the shared policy, not the request', () => {
  const src = read('src/app/api/seller/products/route.ts');
  // The old behaviour upper-cased and clamped whatever the seller posted, which
  // is what trapped every product in DRAFT. Publication is now decided by the
  // shared server-side policy, so the route must call it and must NOT derive the
  // stored status from the posted `status` field.
  assert.ok(
    /isSellerEligibleForAutoPublish\(/.test(src) &&
      /resolvePublicationState\(/.test(src),
    'seller create must resolve publication through the shared eligibility policy'
  );
  assert.ok(
    /status: initialStatus/.test(src),
    'seller create must persist the policy-resolved status, not the raw posted value'
  );
  assert.ok(
    /\n\s+approvalStatus,\n/.test(src),
    'seller create must persist approvalStatus alongside status'
  );
});

check('seller update path cannot publish a product from a forged status', () => {
  const src = read('src/app/api/seller/products/route.ts');
  // An edit must never be able to push a product live by posting status=active,
  // and an edit to an already-live product must not silently unpublish it.
  assert.ok(
    !/updatePayload\.status = requested/.test(src),
    'seller update must not assign a status taken from the request body'
  );
  assert.ok(
    src.includes("currentStatus === 'ACTIVE'"),
    'seller update must preserve an existing ACTIVE product rather than forcing it back to PENDING'
  );
});

// ---------------------------------------------------------------------------
console.log('\n[4] Detail-panel request referential stability (card-click bug)');

check('ExecutiveShell memoises the detail request on detailKey', () => {
  const src = read('src/views/executive/ExecutiveShell.tsx');
  assert.ok(
    /const detailRequest = useMemo\(/.test(src),
    'the detail request must be memoised, else every render restarts the panel fetch'
  );
  assert.ok(
    /request=\{detailRequest\}/.test(src),
    'ExecutiveDetailPanel must receive the memoised request'
  );
  assert.ok(
    !/request=\{detailKey \? DETAIL_BUILDERS/.test(src),
    'the raw per-render builder call must not be passed straight through to the panel'
  );
});
check('ExecutiveDetailPanel keys its fetch effect on a stable request', () => {
  const src = read('src/views/executive/ExecutiveDetailPanel.tsx');
  assert.ok(
    /\}, \[request, filter, nonce\]\);/.test(src),
    'the fetch effect must depend on request/filter/nonce'
  );
  assert.ok(
    /filterParam \|\| 'status'/.test(src),
    "the filter param must default to the one every detail endpoint reads"
  );
});
check('every sidebar drill-down target maps to a real detail builder', () => {
  const builders = read('src/views/executive/detailBuilders.tsx');
  const shell = read('src/views/executive/ExecutiveShell.tsx');
  const keys = [...builders.matchAll(/^ {2}([a-zA-Z]+): \(\) => \(\{/gm)].map((m) => m[1]);
  assert.ok(keys.length >= 7, 'expected the users/sellers/products/orders/finance builders');

  // Read ONLY the NAV_TO_DETAIL map. Entries such as `overview: 'Dashboard'` in
  // the NAV array are nav ids rather than detail targets, so the map is sliced
  // out explicitly - otherwise the assertion would demand a builder for the
  // dashboard landing page, which correctly has none.
  const start = shell.indexOf('const NAV_TO_DETAIL');
  const map = shell.slice(start, shell.indexOf('};', start));
  const targets = [...map.matchAll(/:\s*'([a-z]+)'/g)].map((m) => m[1]);
  assert.ok(targets.length >= 5, 'expected several sidebar drill-down targets');
  targets.forEach((key) => {
    assert.ok(keys.includes(key), 'sidebar target must have a detail builder: ' + key);
  });
});
// ---------------------------------------------------------------------------
console.log('\n[5] API authorization coverage (no public data leak)');

const mw = read('src/middleware.ts');

check('/api/analytics is inside a guarded RBAC branch', () => {
  assert.ok(
    /path === '\/api\/analytics'/.test(mw),
    '/api/analytics matched NO guarded prefix and answered 200 anonymously'
  );
  assert.ok(
    /path\.startsWith\('\/api\/analytics'\)/.test(mw),
    'the analytics branch must actually apply requireRole'
  );
});
check('the analytics guard runs before the response is returned', () => {
  const branch = mw.slice(mw.indexOf("path.startsWith('/api/analytics')"));
  assert.ok(
    /requireRole\(request, \[[^\]]*'SELLER'/.test(branch) &&
      /if \(guard instanceof NextResponse\) return guard;/.test(branch),
    'the analytics branch must require a role and return the 401/403 guard'
  );
});
check('SELLER is still permitted on analytics (not over-restricted)', () => {
  const branch = mw.slice(mw.indexOf("path.startsWith('/api/analytics')"));
  assert.ok(
    branch.includes("'SELLER'"),
    'sellers must retain access to their own analytics'
  );
});
check('executives and admin retain analytics access', () => {
  const branch = mw.slice(mw.indexOf("path.startsWith('/api/analytics')"));
  ['ADMIN', 'FOUNDER', 'CEO_MD'].forEach((role) => {
    assert.ok(branch.includes("'" + role + "'"), role + ' must keep analytics access');
  });
});
check('the analytics route itself also requires a session', () => {
  const src = read('src/app/api/analytics/route.ts');
  assert.ok(
    /requireRole\(request, \[/.test(src),
    'defence in depth: the route must guard itself, not rely on middleware alone'
  );
});
check('a seller cannot read another seller analytics (403 isolation)', () => {
  const src = read('src/app/api/analytics/route.ts');
  assert.ok(
    /role === 'SELLER' && sellerIdParam/.test(src),
    'the route must scope ?sellerId to the requesting seller'
  );
  assert.ok(
    /status: 403/.test(src),
    'a cross-seller request must be refused with 403'
  );
  assert.ok(
    !/requireRole\(request, \['SELLER', 'ADMIN', 'FOUNDER', 'CEO_MD'\]\);\s*\n\s*if \(guard instanceof NextResponse\) return guard;\s*\n\s*const \{ searchParams \}/.test(src),
    'the ownership check must run BEFORE the sellerId is trusted'
  );
});
check('every guarded namespace still has its own requireRole branch', () => {
  ['/api/founder', '/api/admin', '/api/corporate', '/api/seller', '/api/shipment', '/api/buyer'].forEach(
    (p) => {
      // lastIndexOf, not indexOf: each namespace also appears in the earlier
      // "which prefixes are guarded?" condition list, so the first match is that
      // list, not the branch that actually calls requireRole.
      const i = mw.lastIndexOf("path.startsWith('" + p + "')");
      assert.ok(i > -1, 'missing guard branch for ' + p);
      // Scan the branch with comments stripped: a guard may legitimately be
      // preceded by a long explanatory comment (the /api/shipment branch has
      // one), and comment length must not be mistaken for a missing guard.
      const seg = mw
        .slice(i, i + 900)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      assert.ok(
        /requireRole\(request, \[/.test(seg),
        p + ' must call requireRole in its guard branch'
      );
    }
  );
});

// ---------------------------------------------------------------------------
console.log('\n[6] Dead navigation (no link lands on the 404 catch-all)');

const app = read('src/ClientApp.tsx');

check('the admin Settlements route is registered', () => {
  assert.ok(
    /<Route path="settlements" element=\{<AdminSettlements \/>\} \/>/.test(app),
    "Settlements.tsx existed but was never routed, so the admin link 404'd"
  );
  assert.ok(
    /import AdminSettlements from '\.\/views\/admin\/Settlements'/.test(app),
    'AdminSettlements must be imported'
  );
});
check('the admin settlements view file actually exists', () => {
  assert.ok(fs.existsSync(path.join(root, 'src/views/admin/Settlements.tsx')));
});

// --- Summary -----------------------------------------------------------------
console.log('\n----------------------------------------');
console.log('  passed: ' + passed + '   failed: ' + failed);
console.log('----------------------------------------\n');
process.exit(failed === 0 ? 0 : 1);
