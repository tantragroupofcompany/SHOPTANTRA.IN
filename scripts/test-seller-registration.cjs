const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0, failed = 0;
const pending = [];
function check(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') { pending.push(r.then(() => { passed++; console.log('  PASS  ' + name); }).catch((e) => { failed++; console.log('  FAIL  ' + name); console.log('        ' + (e && e.message ? e.message : e)); })); return; }
    passed++; console.log('  PASS  ' + name);
  } catch (err) { failed++; console.log('  FAIL  ' + name); console.log('        ' + (err && err.message ? err.message : err)); }
}
const section = (t) => console.log('\n' + t);
(async () => {
  const sellerId = await import('../src/lib/sellerId.ts');
  const sellerPdf = await import('../src/lib/sellerPdf.ts');
  section('Seller ID format + Asia/Kolkata date');
  check('IST near midnight rolls to next IST day', () => { assert.strictEqual(sellerId.getIstDateParts(new Date('2026-10-10T20:00:00Z')).ymd, '20261011'); });
  check('IST early-UTC morning same IST day', () => { assert.strictEqual(sellerId.getIstDateParts(new Date('2026-10-10T00:00:00Z')).ymd, '20261010'); });
  check('formatSellerId SLYYYYMMDDNNNN', () => { assert.strictEqual(sellerId.formatSellerId('20261010', 1), 'SL202610100001'); assert.strictEqual(sellerId.formatSellerId('20261010', 42), 'SL202610100042'); assert.strictEqual(sellerId.formatSellerId('20261010', 9999), 'SL202610109999'); });
  check('isValidSellerId', () => { assert.strictEqual(sellerId.isValidSellerId('SL202610100001'), true); assert.strictEqual(sellerId.isValidSellerId('SL20261010001'), false); assert.strictEqual(sellerId.isValidSellerId('XX202610100001'), false); assert.strictEqual(sellerId.isValidSellerId(''), false); assert.strictEqual(sellerId.isValidSellerId(null), false); });
  section('Concurrency-safe allocation');
  check('first allocation returns 0001', async () => { let seq = 0; const tx = { sellerIdCounter: { upsert: async () => ({ lastSeq: ++seq }) } }; const r = await sellerId.allocateSellerId(tx, new Date('2026-10-10T06:00:00Z')); assert.strictEqual(r.sellerId, 'SL202610100001'); assert.strictEqual(r.ymd, '20261010'); assert.strictEqual(r.seq, 1); });
  check('sequential allocations increment', async () => { let seq = 0; const tx = { sellerIdCounter: { upsert: async () => ({ lastSeq: ++seq }) } }; const ids = []; for (let i = 0; i < 3; i++) ids.push((await sellerId.allocateSellerId(tx, new Date('2026-10-10T06:00:00Z'))).sellerId); assert.deepStrictEqual(ids, ['SL202610100001', 'SL202610100002', 'SL202610100003']); });
  check('daily limit 9999 fails loudly', async () => { let seq = 9999; const tx = { sellerIdCounter: { upsert: async () => ({ lastSeq: ++seq }) } }; await assert.rejects(() => sellerId.allocateSellerId(tx, new Date('2026-10-10T06:00:00Z')), /limit/); });
  section('PDF generation');
  check('valid PDF 1.4 buffer', () => { const buf = sellerPdf.generateSellerPdf({ sellerId: 'SL202610100001', businessName: 'Nayna Forever', ownerName: 'Nayna', email: 'seller@example.com', phone: '+91-9000000000', status: 'PENDING', registeredAt: '2026-10-10T06:00:00.000Z' }); assert.ok(Buffer.isBuffer(buf)); assert.strictEqual(buf.subarray(0, 8).toString('latin1'), '%PDF-1.4'); assert.ok(buf.subarray(buf.length - 6).toString('latin1').includes('%%EOF')); const txt = buf.toString('latin1'); assert.ok(txt.includes('/Type /Catalog')); assert.ok(txt.includes('SL202610100001')); assert.ok(buf.length > 800); });
  check('PDF masks bank account', () => { const txt = sellerPdf.generateSellerPdf({ sellerId: 'SL202610100001', businessName: 'X', ownerName: 'Y', email: 'e@x.com', phone: '9000000000', bankAccountMasked: '****6789', bankIfsc: 'HDFC0001234', status: 'PENDING', registeredAt: '2026-10-10T06:00:00.000Z' }).toString('latin1'); assert.ok(txt.includes('6789')); assert.ok(!txt.includes('123456789012')); });
  section('Wiring present');
  check('models exist', () => { const s = read('prisma/schema.prisma'); assert.ok(/model\s+Seller\b[\s\S]*?sellerId\s+String\?\s+@unique/.test(s)); assert.ok(/model\s+SellerDocument\b/.test(s)); assert.ok(/model\s+SellerIdCounter\b/.test(s)); });
  check('register route wires sellerId + PDF', () => { const r = read('src/app/api/auth/register/route.ts'); assert.ok(/allocateSellerId\(tx\)/.test(r)); assert.ok(/sellerId,/.test(r)); assert.ok(/processSellerRegistration\(/.test(r)); });
  check('service idempotent + private + backfill', () => { const svc = read('src/lib/sellerRegistrationService.ts'); assert.ok(/generationStatus: .GENERATED./.test(svc)); assert.ok(/public:\s*false/.test(svc)); assert.ok(/backfillLegacySellerIds/.test(svc)); });
  await Promise.all(pending);
  console.log('\n========================================');
  console.log('Seller registration suite: ' + passed + ' passed, ' + failed + ' failed');
  console.log('RESULT: ' + (failed === 0 ? 'PASS' : 'FAIL'));
  console.log('========================================');
  process.exit(failed === 0 ? 0 : 1);
})();