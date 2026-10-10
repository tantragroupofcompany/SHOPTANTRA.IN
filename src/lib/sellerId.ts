/**
 * Permanent, unique Seller ID generator for ShopTantra.
 *
 * Format: SLYYYYMMDDNNNN
 *   SL      -> ShopTantra Seller
 *   YYYYMMDD-> registration date in Asia/Kolkata (UTC+5:30, no DST)
 *   NNNN    -> four-digit daily sequence starting at 0001
 *
 * Guarantees:
 *  - Generated server-side only; never seller-editable.
 *  - Concurrency-safe: allocation uses an atomic counter row (upsert + increment)
 *    inside a DB transaction, so parallel registrations never collide.
 *  - Permanent once assigned.
 *  - Daily limit (9999) fails loudly instead of silently duplicating.
 */

// Asia/Kolkata is a fixed UTC+5:30 offset with no daylight saving.
const IST_OFFSET_MINUTES = 330;

export const SELLER_ID_PREFIX = 'SL';
export const MAX_DAILY_SELLER_SEQ = 9999;

export interface IstDateParts {
  /** e.g. "20261010" */
  ymd: string;
  year: number;
  month: number;
  day: number;
}

/** Compute the Asia/Kolkata calendar date parts for a given instant. */
export function getIstDateParts(input: Date = new Date()): IstDateParts {
  const istMs = input.getTime() + IST_OFFSET_MINUTES * 60_000;
  const ist = new Date(istMs);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth() + 1;
  const day = ist.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return { ymd: `${year}${pad(month)}${pad(day)}`, year, month, day };
}

/** Assemble the final Seller ID string. */
export function formatSellerId(ymd: string, seq: number): string {
  if (!Number.isInteger(seq) || seq < 1) {
    throw new Error(`Invalid seller sequence: ${seq}`);
  }
  if (seq > MAX_DAILY_SELLER_SEQ) {
    throw new Error(
      `Seller ID daily sequence limit (${MAX_DAILY_SELLER_SEQ}) reached for ${ymd}`
    );
  }
  return `${SELLER_ID_PREFIX}${ymd}${String(seq).padStart(4, '0')}`;
}

/**
 * Minimal structural type for the atomic counter row.
 * Any Prisma transaction client that includes the `sellerIdCounter` model
 * satisfies this, so callers can pass `tx` directly without importing Prisma types.
 */
export interface SellerIdCounterTx {
  sellerIdCounter: {
    upsert(args: {
      where: { date: string };
      create: { date: string; lastSeq: number };
      update: { lastSeq: { increment: number } };
      select: { lastSeq: true };
    }): Promise<{ lastSeq: number }>;
  };
}

/**
 * Atomically allocate the next daily sequence and return a ready Seller ID.
 * MUST be called inside a transaction so the counter increment and the seller
 * insert commit together (or roll back together).
 *
 * Throws if the daily sequence limit is reached (never returns a duplicate).
 */
export async function allocateSellerId(
  tx: SellerIdCounterTx,
  now: Date = new Date()
): Promise<{ sellerId: string; ymd: string; seq: number }> {
  const { ymd } = getIstDateParts(now);
  const row = await tx.sellerIdCounter.upsert({
    where: { date: ymd },
    create: { date: ymd, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  if (row.lastSeq > MAX_DAILY_SELLER_SEQ) {
    throw new Error(
      `Seller ID daily sequence limit (${MAX_DAILY_SELLER_SEQ}) reached for ${ymd}`
    );
  }
  return { sellerId: formatSellerId(ymd, row.lastSeq), ymd, seq: row.lastSeq };
}

/** Validate an existing Seller ID string against the required format. */
export function isValidSellerId(value: unknown): value is string {
  return typeof value === 'string' && /^SL\d{8}\d{4}$/.test(value);
}
