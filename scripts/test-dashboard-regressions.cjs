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
console.log('\n[3] Seller write-path status canonicalisation');

const ALLOWED_ON_CREATE = ['DRAFT', 'PENDING'];
function initialStatus(posted) {
  const requested = String(posted || 'DRAFT').trim().toUpperCase();
  return ALLOWED_ON_CREATE.includes(requested) ? requested : 'PENDING';
}

check("a seller posting 'draft' stores the canonical DRAFT", () => {
  assert.strictEqual(initialStatus('draft'), 'DRAFT');
});
check("a seller posting 'pending' stores PENDING", () => {
  assert.strictEqual(initialStatus('pending'), 'PENDING');
});
check('a missing status defaults to DRAFT, never to a live state', () => {
  assert.strictEqual(initialStatus(undefined), 'DRAFT');
});
check("a seller cannot self-approve by posting 'active'", () => {
  assert.notStrictEqual(initialStatus('active'), 'ACTIVE');
  assert.strictEqual(initialStatus('active'), 'PENDING');
});
check('whitespace or casing cannot smuggle a live status through', () => {
  assert.notStrictEqual(initialStatus('  active  '), 'ACTIVE');
  assert.notStrictEqual(initialStatus('ACTIVE'), 'ACTIVE');
});
check('an approved product becomes visible once an executive approves it', () => {
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

check('seller create path canonicalises status before writing', () => {
  const src = read('src/app/api/seller/products/route.ts');
  assert.ok(
    /const requestedStatus = String\(status \|\| 'DRAFT'\)\.trim\(\)\.toUpperCase\(\)/.test(src),
    'seller create must upper-case the posted status'
  );
  assert.ok(
    /status: initialStatus/.test(src),
    'seller create must persist the canonical status, not the raw posted value'
  );
});
check('seller update path cannot write a live ACTIVE status', () => {
  const src = read('src/app/api/seller/products/route.ts');
  assert.ok(
    /\['DRAFT',\s*'PENDING'\]\.includes\(requested\)/.test(src),
    'seller update must clamp status to the states a seller may set themselves'
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
// --- Summary -----------------------------------------------------------------
console.log('\n----------------------------------------');
console.log('  passed: ' + passed + '   failed: ' + failed);
console.log('----------------------------------------\n');
process.exit(failed === 0 ? 0 : 1);
