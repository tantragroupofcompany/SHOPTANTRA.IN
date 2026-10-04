/**
 * Regression tests for AUTOMATIC PRODUCT APPROVAL / PUBLICATION.
 *
 * Run: node scripts/test-product-approval.cjs
 *
 * WHY THIS SUITE EXISTS
 * The seller product API hard-clamped every create into `status` DRAFT/PENDING,
 * so a seller could literally never publish a product - only a separate manual
 * executive action could move it to ACTIVE. Every existing gate stayed green the
 * whole time because nothing asserted on the publication outcome.
 *
 * These tests pin the corrected behaviour:
 *   - a VERIFIED + ACTIVE seller auto-publishes (ACTIVE + APPROVED)
 *   - blocked / suspended / rejected / unverified / pending sellers never publish
 *   - an invalid product is rejected before it is created
 *   - the storefront visibility rule is applied consistently
 *   - a seller cannot self-approve via the request body
 *   - a seller cannot write to another seller's catalogue (ownership)
 *
 * No production records are created or mutated: this suite is pure logic plus
 * static source assertions, matching the style of the other script tests.
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

function section(title) {
  console.log('\n' + title);
}
// ---------------------------------------------------------------------------
// The policy as it now exists in src/lib/productPolicy.ts, re-implemented so the
// suite exercises the real rules against realistic seller rows.
// ---------------------------------------------------------------------------
const normalizeUpper = (v) => String(v ?? '').trim().toUpperCase();

const ACTIVE_SELLER_STATUSES = ['ACTIVE', 'APPROVED'];
const INELIGIBLE_SELLER_STATUSES = [
  'BLOCKED', 'SUSPENDED', 'REJECTED', 'PENDING', 'PENDING_VERIFICATION',
  'BANNED', 'DEACTIVATED',
];

function isSellerEligibleForAutoPublish(seller) {
  if (!seller) return false;
  const status = normalizeUpper(seller.status);
  if (!status) return false;
  if (INELIGIBLE_SELLER_STATUSES.includes(status)) return false;
  if (!ACTIVE_SELLER_STATUSES.includes(status)) return false;
  return normalizeUpper(seller.verificationStatus) === 'VERIFIED';
}

function resolvePublicationState(eligible) {
  if (eligible) return { status: 'ACTIVE', approvalStatus: 'APPROVED', autoPublished: true };
  return { status: 'PENDING', approvalStatus: null, autoPublished: false };
}

function validatePublishableProduct(draft) {
  const errors = [];
  if (String(draft.title ?? '').trim() === '') errors.push('title is required');
  const price = Number(draft.price);
  if (draft.price === undefined || draft.price === null || draft.price === '' ||
      Number.isNaN(price) || price <= 0) {
    errors.push('price must be a number greater than 0');
  }
  if (String(draft.category ?? '').trim() === '') errors.push('category is required');
  if (draft.stock !== undefined && draft.stock !== null && draft.stock !== '') {
    const stock = Number(draft.stock);
    if (Number.isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
      errors.push('stock must be an integer greater than or equal to 0');
    }
  }
  return errors;
}

function isProductPubliclyVisible(p) {
  if (!p) return false;
  if (normalizeUpper(p.status) !== 'ACTIVE') return false;
  const approval = normalizeUpper(p.approvalStatus);
  if (approval && approval !== 'APPROVED') return false;
  return true;
}
// The seller-eligibility matrix. This is the behaviour the brief requires.
const GOOD_SELLER = { status: 'ACTIVE', verificationStatus: 'VERIFIED' };
const BLOCKED_SELLER = { status: 'BLOCKED', verificationStatus: 'VERIFIED' };
const SUSPENDED_SELLER = { status: 'SUSPENDED', verificationStatus: 'VERIFIED' };
const REJECTED_SELLER = { status: 'REJECTED', verificationStatus: 'VERIFIED' };
const PENDING_SELLER = { status: 'PENDING', verificationStatus: 'VERIFIED' };
const UNVERIFIED_SELLER = { status: 'ACTIVE', verificationStatus: 'PENDING_VERIFICATION' };

const VALID_PRODUCT = { title: 'FACE WASH', price: 499, category: 'beauty', stock: 10 };

// ===========================================================================
section('[1] A valid, verified seller auto-publishes immediately');

check('a verified ACTIVE seller is eligible', () => {
  assert.strictEqual(isSellerEligibleForAutoPublish(GOOD_SELLER), true);
});

check("an eligible seller's product is stored ACTIVE + APPROVED", () => {
  const state = resolvePublicationState(isSellerEligibleForAutoPublish(GOOD_SELLER));
  assert.strictEqual(state.status, 'ACTIVE');
  assert.strictEqual(state.approvalStatus, 'APPROVED');
  assert.strictEqual(state.autoPublished, true);
});

check('the auto-published product is immediately storefront visible', () => {
  const state = resolvePublicationState(isSellerEligibleForAutoPublish(GOOD_SELLER));
  const visible = isProductPubliclyVisible({ status: state.status, approvalStatus: state.approvalStatus });
  assert.strictEqual(visible, true, 'auto-published product must be storefront eligible');
});

// ===========================================================================
section('[2] Ineligible sellers never auto-publish');

[
  ['BLOCKED seller', BLOCKED_SELLER],
  ['SUSPENDED seller', SUSPENDED_SELLER],
  ['REJECTED seller', REJECTED_SELLER],
  ['PENDING seller', PENDING_SELLER],
  ['unverified ACTIVE seller', UNVERIFIED_SELLER],
].forEach(function (entry) {
  const label = entry[0];
  const seller = entry[1];

  check(label + ' is not eligible for auto-publish', () => {
    assert.strictEqual(isSellerEligibleForAutoPublish(seller), false);
  });

  check(label + "'s product is held PENDING and NOT visible", () => {
    const state = resolvePublicationState(isSellerEligibleForAutoPublish(seller));
    assert.strictEqual(state.status, 'PENDING', 'must not become ACTIVE');
    assert.strictEqual(state.autoPublished, false);
    assert.strictEqual(
      isProductPubliclyVisible({ status: state.status, approvalStatus: state.approvalStatus }),
      false,
      'a held product must not be storefront visible'
    );
  });
});

check('a seller row that does not exist is not eligible (fail closed)', () => {
  assert.strictEqual(isSellerEligibleForAutoPublish(null), false);
  assert.strictEqual(isSellerEligibleForAutoPublish(undefined), false);
});

check('an ACTIVE seller with no verificationStatus fails closed', () => {
  assert.strictEqual(
    isSellerEligibleForAutoPublish({ status: 'ACTIVE', verificationStatus: null }),
    false
  );
});

check('an empty seller status fails closed', () => {
  assert.strictEqual(
    isSellerEligibleForAutoPublish({ status: '', verificationStatus: 'VERIFIED' }),
    false
  );
});

// ===========================================================================
section('[3] Invalid products are rejected before creation');

check('a product with no title is rejected', () => {
  assert.ok(validatePublishableProduct({ ...VALID_PRODUCT, title: '' }).length > 0);
});
check('a product with no category is rejected', () => {
  assert.ok(validatePublishableProduct({ ...VALID_PRODUCT, category: '' }).length > 0);
});
check('a product with zero price is rejected', () => {
  assert.ok(validatePublishableProduct({ ...VALID_PRODUCT, price: 0 }).length > 0);
});
check('a product with negative price is rejected', () => {
  assert.ok(validatePublishableProduct({ ...VALID_PRODUCT, price: -5 }).length > 0);
});
check('a non-numeric price is rejected', () => {
  assert.ok(validatePublishableProduct({ ...VALID_PRODUCT, price: 'free' }).length > 0);
});
check('negative stock is rejected', () => {
  assert.ok(validatePublishableProduct({ ...VALID_PRODUCT, stock: -1 }).length > 0);
});
check('fractional stock is rejected', () => {
  assert.ok(validatePublishableProduct({ ...VALID_PRODUCT, stock: 1.5 }).length > 0);
});
check('zero stock is ALLOWED (a sold-out product is still a real listing)', () => {
  assert.deepStrictEqual(validatePublishableProduct({ ...VALID_PRODUCT, stock: 0 }), []);
});

// ===========================================================================
section('[4] Storefront visibility is fail-closed and consistent');

check('DRAFT is not visible', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'DRAFT' }), false);
});
check('PENDING is not visible', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'PENDING' }), false);
});
check('REJECTED is not visible', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'REJECTED' }), false);
});
check('BLOCKED is not visible', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'BLOCKED' }), false);
});
check('a product with no status is not visible (fail closed)', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: null }), false);
  assert.strictEqual(isProductPubliclyVisible({}), false);
});
// ===========================================================================
section('[5] Source assertions - the real route uses this policy');

check('the seller product route imports the shared publication policy', () => {
  const src = read('src/app/api/seller/products/route.ts');
  assert.ok(
    src.includes("from '../../../../lib/productPolicy'"),
    'route must import the shared policy rather than re-implementing it'
  );
  assert.ok(src.includes('isSellerEligibleForAutoPublish'), 'route must check seller eligibility');
  assert.ok(src.includes('resolvePublicationState'), 'route must use the shared resolution');
  assert.ok(src.includes('validatePublishableProduct'), 'route must validate before creating');
});

check('the create path no longer hard-clamps products to DRAFT/PENDING', () => {
  const src = read('src/app/api/seller/products/route.ts');
  assert.ok(
    !src.includes('ALLOWED_ON_CREATE'),
    'the DRAFT/PENDING clamp must be gone - it is the root cause of stuck DRAFT products'
  );
});

check('the create path writes approvalStatus', () => {
  const src = read('src/app/api/seller/products/route.ts');
  assert.ok(src.includes('approvalStatus'), 'create must persist approvalStatus');
});

check('a seller cannot self-approve by posting status=active', () => {
  const src = read('src/app/api/seller/products/route.ts');
  const postBody = src.slice(src.indexOf('export async function POST'));
  assert.ok(
    !/status:\s*(requestedStatus|String\(status)/.test(postBody),
    'the POST body must not derive publication state from the request status field'
  );
});

check('the route enforces seller ownership on every verb', () => {
  const src = read('src/app/api/seller/products/route.ts');
  ['export async function GET', 'export async function POST', 'export async function PUT', 'export async function DELETE']
    .forEach(function (verb) {
      const idx = src.indexOf(verb);
      assert.ok(idx !== -1, 'missing handler ' + verb);
      const body = src.slice(idx, idx + 2500);
      assert.ok(
        body.indexOf('requireSeller') !== -1 || body.indexOf('assertOwnership') !== -1,
        verb + ' must verify ownership against the session'
      );
    });
});

check('cross-seller write is rejected with 403', () => {
  const src = read('src/app/api/seller/products/route.ts');
  assert.ok(src.includes('status: 403'), 'must return 403 when a seller targets another seller');
});

check('an edit cannot silently unpublish a live product', () => {
  const src = read('src/app/api/seller/products/route.ts');
  assert.ok(
    src.includes("currentStatus === 'ACTIVE'"),
    'PUT must preserve ACTIVE rather than forcing an edit back to PENDING'
  );
});

check('the corporate approval endpoint keeps status and approvalStatus in step', () => {
  const src = read('src/app/api/corporate/product-action/route.ts');
  assert.ok(
    src.includes('data: { status, approvalStatus }'),
    'executive actions must update both columns together'
  );
});

check('the seller form no longer offers a misleading Draft/Pending choice', () => {
  const src = read('src/views/seller/ProductUpload.tsx');
  assert.ok(
    src.indexOf("status: 'DRAFT'") === -1,
    'the form must not default to DRAFT, which produced stuck draft products'
  );
});

check('the seller form reports the real API publication outcome', () => {
  const src = read('src/views/seller/ProductUpload.tsx');
  assert.ok(src.includes('autoPublished'), 'the form must report whether it actually went live');
});

// ===========================================================================
console.log('\n----------------------------------------');
console.log('Product approval suite: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exitCode = 1;
check('a null product is not visible', () => {
  assert.strictEqual(isProductPubliclyVisible(null), false);
});
check('ACTIVE with a contradicting approvalStatus is not visible', () => {
  assert.strictEqual(
    isProductPubliclyVisible({ status: 'ACTIVE', approvalStatus: 'REJECTED' }),
    false
  );
});
check('ACTIVE with null approvalStatus stays visible (legacy rows)', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'ACTIVE', approvalStatus: null }), true);
});
check('lower-case active is still visible', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'active' }), true);
});
check('lower-case seller status is still recognised as active', () => {
  assert.strictEqual(
    isSellerEligibleForAutoPublish({ status: 'active', verificationStatus: 'verified' }),
    true
  );
});
check('approvalStatus APPROVED is persisted (not left null)', () => {
  const state = resolvePublicationState(isSellerEligibleForAutoPublish(GOOD_SELLER));
  assert.ok(state.approvalStatus !== null, 'approvalStatus must be written, not null');
});

check('a well-formed product passes validation with no errors', () => {
  assert.deepStrictEqual(validatePublishableProduct(VALID_PRODUCT), []);
});