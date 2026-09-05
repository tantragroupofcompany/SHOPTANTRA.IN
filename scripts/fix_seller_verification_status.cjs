#!/usr/bin/env node
/**
 * SHOPTANTRA - Seller approval / verification status consistency repair.
 *
 * BUSINESS RULE (single status model):
 *   Seller.status                    = account/approval status
 *       PENDING -> ACTIVE/APPROVED -> REJECTED/SUSPENDED/BLOCKED
 *   Seller.verificationStatus        = verification status
 *       PENDING_VERIFICATION -> VERIFIED
 *   Approving / activating a seller COMPLETES verification.
 *
 * Therefore, any seller whose status is ACTIVE or APPROVED must have
 * verificationStatus = 'VERIFIED'. Records with status ACTIVE/APPROVED but
 * verificationStatus != 'VERIFIED' are contradictory legacy rows (caused by the
 * old Admin "toggle verification" that wrote `status` instead of
 * `verificationStatus`) and are corrected here.
 *
 * SAFETY:
 *   - Dry-run by default: prints exactly what WOULD change. Pass `--apply` to write.
 *   - Only touches status IN (ACTIVE, APPROVED) with non-VERIFIED verificationStatus.
 *   - Never deletes records and never changes ownership / email / bank details /
 *     products / orders / payments.
 *   - Does NOT convert PENDING/REJECTED/SUSPENDED/BLOCKED sellers; untouched.
 *   - Idempotent: running twice changes nothing the second time.
 *
 * USAGE:
 *   node scripts/fix_seller_verification_status.cjs            # dry-run (report only)
 *   node scripts/fix_seller_verification_status.cjs --apply    # apply the minimal fix
 *
 * DATABASE_URL is read from the process env, or .env.production / .env.local / .env.
 * It is never printed.
 */
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const candidates = ['.env.production', '.env.local', '.env'].map((f) => path.join(__dirname, '..', f));
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    const m = raw.match(/^\s*DATABASE_URL\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/m);
    if (m) {
      const value = (m[1] || m[2] || m[3] || '').trim();
      if (value && value !== '[SENSITIVE]' && /^(postgres|postgresql):\/\//.test(value)) {
        return value;
      }
    }
  }
  return null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || loadEnv();
  if (!databaseUrl) {
    console.log('ERROR: DATABASE_URL not found. Set it, or run `vercel env pull` and rerun.');
    process.exit(1);
  }
  process.env.DATABASE_URL = databaseUrl;

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const apply = process.argv.includes('--apply');
  const APPROVED_STATUSES = ['ACTIVE', 'APPROVED'];
  const VERIFIED = 'VERIFIED';

  const sellers = await prisma.seller.findMany({
    select: { id: true, storeName: true, status: true, verificationStatus: true },
    orderBy: { createdAt: 'desc' },
  });

  let untouched = 0;
  const fixes = [];

  for (const s of sellers) {
    const status = (s.status || '').toUpperCase();
    const verification = (s.verificationStatus || '').toUpperCase();
    if (APPROVED_STATUSES.includes(status) && verification !== VERIFIED) {
      fixes.push({
        id: s.id,
        storeName: s.storeName,
        currentStatus: s.status,
        currentVerification: s.verificationStatus || '(empty)',
        proposedVerification: VERIFIED,
      });
    } else {
      untouched++;
    }
  }

  console.log('==============================================================');
  console.log(' SELLER VERIFICATION CONSISTENCY REPAIR');
  console.log(` Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(` Total sellers: ${sellers.length}`);
  console.log(` Consistent (left unchanged): ${untouched}`);
  console.log(` Inconsistent (ACTIVE/APPROVED but not VERIFIED): ${fixes.length}`);
  console.log('==============================================================');

  for (const f of fixes) {
    console.log(` [${f.currentStatus}] ${f.storeName}  id=${f.id.slice(0, 8)}...`);
    console.log(`     verificationStatus: ${f.currentVerification}  ->  ${f.proposedVerification}`);
  }

  if (fixes.length === 0) {
    console.log('\n No contradictory seller records found. DB is already consistent.');
    await prisma.$disconnect();
    return;
  }

  if (!apply) {
    console.log('\n Nothing written. Run with `--apply` to perform the minimal fix.');
    await prisma.$disconnect();
    return;
  }

  // Minimal idempotent correction: only the rows reported above.
  const ids = fixes.map((f) => f.id);
  await prisma.seller.updateMany({
    where: { id: { in: ids } },
    data: { verificationStatus: VERIFIED },
  });

  // Post-fix re-verify
  const remaining = await prisma.seller.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true, verificationStatus: true },
  });
  const stillBad = remaining.filter((s) =>
    APPROVED_STATUSES.includes((s.status || '').toUpperCase()) &&
    (s.verificationStatus || '').toUpperCase() !== VERIFIED
  );

  console.log(`\n Updated ${ids.length} seller record(s) to verificationStatus=VERIFIED.`);
  console.log(` Post-fix inconsistent remaining: ${stillBad.length}`);
  if (stillBad.length > 0) console.log('  WARNING: still inconsistent:', stillBad);
  console.log(' Done.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.log('QUERY_ERROR:', e.message || e);
  process.exit(1);
});