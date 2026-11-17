const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function loadTsModule(relPath, stubs = {}) {
  const filePath = path.join(root, relPath);
  const source = fs.readFileSync(filePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, resolveJsonModule: true },
    fileName: filePath,
  });
  const moduleObj = { exports: {} };
  const localRequire = (request) => {
    if (Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
    if (request.startsWith('.')) {
      const base = path.resolve(path.dirname(filePath), request);
      for (const ext of ['', '.ts', '.tsx', '/index.ts', '.json']) {
        const candidate = base + ext;
        if (!fs.existsSync(candidate)) continue;
        if (ext === '' || ext === '.json') {
          if (!candidate.endsWith('.json')) return require(candidate);
          return JSON.parse(fs.readFileSync(candidate, 'utf8'));
        }
        return loadTsModule(path.relative(root, candidate), stubs);
      }
    }
    return require(request);
  };
  localRequire.resolve = (request) => require.resolve(request);
  const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', outputText);
  fn(moduleObj.exports, localRequire, moduleObj, filePath, path.dirname(filePath));
  return moduleObj.exports;
}
const { verifyPassword, hashPassword } = loadTsModule('src/lib/authUtils.ts');
const { ACTIVE_SELLER_STATUSES, INELIGIBLE_SELLER_STATUSES, isSellerEligibleForAutoPublish, resolvePublicationState, isProductPubliclyVisible, normalizeUpper } = loadTsModule('src/lib/productPolicy.ts');
const checks = [];
let passed = 0, failed = 0;
function check(name, fn) { checks.push({ name, fn }); }
function run() {
  for (const { name, fn } of checks) {
    try { fn(); console.log('  PASS ' + name); passed++; }
    catch (err) { console.log('  FAIL ' + name + ': ' + err.message); failed++; }
  }
  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed out of ' + checks.length);
  if (failed > 0) process.exit(1);
}
console.log('SHOPTANTRA - Seller Approval & Login Tests');
console.log('='.repeat(60));

console.log('\nA. Password hashing & verification');
check('bcrypt hash matches correct password', () => {
  const hash = hashPassword('SellerPass123!');
  assert.strictEqual(typeof hash, 'string');
  assert.ok(hash.length > 0);
  assert.strictEqual(verifyPassword('SellerPass123!', hash), true);
});
check('bcrypt hash rejects wrong password', () => {
  const hash = hashPassword('SellerPass123!');
  assert.strictEqual(verifyPassword('WrongPass!', hash), false);
});
check('verifyPassword returns false for empty hash', () => {
  assert.strictEqual(verifyPassword('anything', ''), false);
  assert.strictEqual(verifyPassword('anything', null), false);
});

console.log('\nB. Product publication policy');
check('ACTIVE + VERIFIED seller is eligible for auto-publish', () => {
  assert.strictEqual(isSellerEligibleForAutoPublish({ status: 'ACTIVE', verificationStatus: 'VERIFIED' }), true);
  assert.strictEqual(isSellerEligibleForAutoPublish({ status: 'APPROVED', verificationStatus: 'VERIFIED' }), true);
});
check('PENDING seller is NOT eligible', () => {
  assert.strictEqual(isSellerEligibleForAutoPublish({ status: 'PENDING', verificationStatus: 'VERIFIED' }), false);
});
check('REJECTED seller is NOT eligible', () => {
  assert.strictEqual(isSellerEligibleForAutoPublish({ status: 'REJECTED', verificationStatus: 'VERIFIED' }), false);
});
check('SUSPENDED seller is NOT eligible', () => {
  assert.strictEqual(isSellerEligibleForAutoPublish({ status: 'SUSPENDED', verificationStatus: 'VERIFIED' }), false);
});
check('BLOCKED seller is NOT eligible', () => {
  assert.strictEqual(isSellerEligibleForAutoPublish({ status: 'BLOCKED', verificationStatus: 'VERIFIED' }), false);
});
check('UNVERIFIED seller is NOT eligible even if ACTIVE', () => {
  assert.strictEqual(isSellerEligibleForAutoPublish({ status: 'ACTIVE', verificationStatus: 'PENDING_VERIFICATION' }), false);
});
check('null seller is NOT eligible', () => {
  assert.strictEqual(isSellerEligibleForAutoPublish(null), false);
  assert.strictEqual(isSellerEligibleForAutoPublish(undefined), false);
});
check('ACTIVE_SELLER_STATUSES constant', () => {
  assert.deepStrictEqual(ACTIVE_SELLER_STATUSES, ['ACTIVE', 'APPROVED']);
});
check('INELIGIBLE_SELLER_STATUSES constant', () => {
  assert.ok(INELIGIBLE_SELLER_STATUSES.includes('PENDING'));
  assert.ok(INELIGIBLE_SELLER_STATUSES.includes('REJECTED'));
  assert.ok(INELIGIBLE_SELLER_STATUSES.includes('SUSPENDED'));
  assert.ok(INELIGIBLE_SELLER_STATUSES.includes('BLOCKED'));
});

console.log('\nC. Publication state resolution');
check('eligible seller → ACTIVE + APPROVED', () => {
  const state = resolvePublicationState(true);
  assert.strictEqual(state.status, 'ACTIVE');
  assert.strictEqual(state.approvalStatus, 'APPROVED');
  assert.strictEqual(state.autoPublished, true);
});
check('ineligible seller → PENDING + null', () => {
  const state = resolvePublicationState(false);
  assert.strictEqual(state.status, 'PENDING');
  assert.strictEqual(state.approvalStatus, null);
  assert.strictEqual(state.autoPublished, false);
});

console.log('\nD. Product public visibility');
check('ACTIVE + APPROVED product is visible', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'ACTIVE', approvalStatus: 'APPROVED' }), true);
});
check('ACTIVE + null approvalStatus is visible', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'ACTIVE', approvalStatus: null }), true);
});
check('DRAFT product is NOT visible', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'DRAFT', approvalStatus: 'APPROVED' }), false);
});
check('PENDING product is NOT visible', () => {
  assert.strictEqual(isProductPubliclyVisible({ status: 'PENDING', approvalStatus: null }), false);
});
check('null product is NOT visible', () => {
  assert.strictEqual(isProductPubliclyVisible(null), false);
});

console.log('\nE. Status normalization');
check('normalizeUpper handles null/undefined', () => {
  assert.strictEqual(normalizeUpper(null), '');
  assert.strictEqual(normalizeUpper(undefined), '');
  assert.strictEqual(normalizeUpper('active'), 'ACTIVE');
  assert.strictEqual(normalizeUpper('  APPROVED  '), 'APPROVED');
});

run();