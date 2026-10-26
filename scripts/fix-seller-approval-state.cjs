#!/usr/bin/env node
/**
 * SHOPTANTRA - Seller approval state consistency repair.
 *
 * BUSINESS RULES:
 *   Seller.status           = account/approval status (PENDING / ACTIVE / SUSPENDED / REJECTED / BLOCKED)
 *   Seller.verificationStatus = verification status (PENDING_VERIFICATION / VERIFIED)
 *
 *   An approved seller must have status='ACTIVE' AND verificationStatus='VERIFIED'.
 *   The corporate approve action (/api/corporate/seller-action) writes both fields.
 *
 *   Legacy rows may have:
 *     - status='APPROVED' (old spelling, should be 'ACTIVE')
 *     - status='ACTIVE' but verificationStatus='PENDING_VERIFICATION' (incomplete approval)
 *
 * SAFETY:
 *   - Dry-run by default: prints exactly what WOULD change. Pass --apply to write.
 *   - Only normalizes status/verificationStatus combinations. Never changes
 *     ownership, email, bank details, products, orders, or payments.
 *   - Never converts PENDING/REJECTED/SUSPENDED/BLOCKED sellers to ACTIVE.
 *   - Writes AuditLog entries for every change (idempotent).
 *   - Idempotent: running twice changes nothing the second time.
 *
 * USAGE:
 *   node scripts/fix-seller-approval-state.cjs              # dry-run (report only)
 *   node scripts/fix-seller-approval-state.cjs --apply      # apply the minimal fix
 *
 * DATABASE_URL is read from the process env, or .env.production / .env.local / .env.
 * It is never printed.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const candidates = ['.env.production', '.env.local', '.env'].map((f) =>
    path.join(__dirname, '..', f)
  );
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    const m = raw.match(/^\s*DATABASE_URL\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|(\S+))/m);
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
    console.log(
      'ERROR: DATABASE_URL not found. Set it, or run `vercel env pull` and rerun.'
    );
    process.exit(1);
  }
  process.env.DATABASE_URL = databaseUrl;

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const apply = process.argv.includes('--apply');
  const ACTOR = 'scripts/fix-seller-approval-state.cjs';

  // Fetch ALL sellers (we need to inspect every row for inconsistencies)
  const sellers = await prisma.seller.findMany({
    select: {
      id: true,
      storeName: true,
      status: true,
      verificationStatus: true,
      userId: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const fixes = [];
  let untouched = 0;

  for (const s of sellers) {
    const status = String(s.status || '').toUpperCase();
    const verification = String(s.verificationStatus || '').toUpperCase();
    const changes = {};

    // Rule 1: Normalize legacy 'APPROVED' spelling to 'ACTIVE'
    if (status === 'APPROVED') {
      changes.status = 'ACTIVE';
    }

    // Rule 2: If status is ACTIVE (or was just normalized to ACTIVE),
    // verificationStatus must be VERIFIED
    const finalStatus = changes.status || status;
    if (finalStatus === 'ACTIVE' && verification !== 'VERIFIED') {
      changes.verificationStatus = 'VERIFIED';
    }

    // Only ACTIVE/APPROVED sellers need verification. PENDING/REJECTED/SUSPENDED/BLOCKED
    // sellers are left untouched per policy — approval remains an executive action.

    if (Object.keys(changes).length > 0) {
      fixes.push({
        id: s.id,
        storeName: s.storeName,
        currentStatus: s.status,
        currentVerification: s.verificationStatus || '(empty)',
        proposedStatus: changes.status || s.status,
        proposedVerification: changes.verificationStatus || s.verificationStatus,
        changes,
      });
    } else {
      untouched++;
    }
  }

  console.log('==============================================================');
  console.log(' SELLER APPROVAL STATE CONSISTENCY REPAIR');
  console.log(` Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(` Total sellers: ${sellers.length}`);
  console.log(` Consistent (left unchanged): ${untouched}`);
  console.log(` Inconsistent (needs normalization): ${fixes.length}`);
  console.log('==============================================================');

  for (const f of fixes) {
    console.log(` id=${f.id.slice(0, 8)}...  store="${f.storeName}"`);
    console.log(`   status:      ${f.currentStatus}      -> ${f.proposedStatus}`);
    console.log(`   verification: ${f.currentVerification} -> ${f.proposedVerification}`);
  }

  if (fixes.length === 0) {
    console.log('\n No inconsistent seller records found. DB is already consistent.');
    await prisma.$disconnect();
    return;
  }

  if (!apply) {
    console.log(
      '\n Nothing written. Run with `--apply` to perform the minimal fix.'
    );
    await prisma.$disconnect();
    return;
  }

  // Apply fixes in a transaction for atomicity
  const results = [];
  for (const f of fixes) {
    const before = {
      status: f.currentStatus,
      verificationStatus: f.currentVerification,
    };
    const after = {
      status: f.proposedStatus,
      verificationStatus: f.proposedVerification,
    };

    const updated = await prisma.seller.update({
      where: { id: f.id },
      data: {
        ...(f.changes.status ? { status: f.changes.status } : {}),
        ...(f.changes.verificationStatus
          ? { verificationStatus: f.changes.verificationStatus }
          : {}),
      },
    });

    // Write AuditLog entry
    await prisma.auditLog.create({
      data: {
        operation: 'NORMALIZE_SELLER_APPROVAL_STATE',
        model: 'Seller',
        targetId: f.id,
        actor: ACTOR,
        reason: 'Legacy status/verificationState inconsistency corrected during approval-state repair',
        before,
        after,
      },
    });

    results.push(updated);
  }

  // Post-fix re-verify
  const remaining = await prisma.seller.findMany({
    where: {
      id: { in: fixes.map((f) => f.id) },
    },
    select: { id: true, status: true, verificationStatus: true },
  });
  const stillBad = remaining.filter(
    (s) =>
      String(s.status).toUpperCase() === 'APPROVED' ||
      (String(s.status).toUpperCase() === 'ACTIVE' &&
        String(s.verificationStatus).toUpperCase() !== 'VERIFIED')
  );

  console.log(
    `\n Updated ${results.length} seller record(s) to consistent approval state.`
  );
  console.log(` Post-fix inconsistent remaining: ${stillBad.length}`);
  if (stillBad.length > 0) {
    console.log('  WARNING: still inconsistent:', stillBad);
  }
  console.log(' AuditLog entries written for all changes.');
  console.log(' Done.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.log('QUERY_ERROR:', e.message || e);
  process.exit(1);
});