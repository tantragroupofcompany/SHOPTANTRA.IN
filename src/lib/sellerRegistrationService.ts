import { prisma } from './prisma';
import { allocateSellerId } from './sellerId';
import { generateSellerPdf, SellerPdfRecord } from './sellerPdf';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendSellerRegistrationEmail } from './email';

const PDF_BUCKET = 'seller-documents';

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key || !/^https?:\/\/.+/.test(url)) return null;
  return createClient(url, key);
}

async function storeSellerPdf(
  sellerProfileId: string,
  sellerId: string,
  pdf: Buffer
): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.warn('[seller-reg] Supabase not configured; PDF not stored. Retained for retry.');
    return null;
  }
  try {
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.some((b) => b.name === PDF_BUCKET)) {
      await admin.storage.createBucket(PDF_BUCKET, { public: false });
    }
  } catch (e) {
    console.warn('[seller-reg] bucket verify warning:', (e as any)?.message || e);
  }
  const key = `${sellerProfileId}/${sellerId}-v1.pdf`;
  const { error } = await admin.storage
    .from(PDF_BUCKET)
    .upload(key, pdf, { contentType: 'application/pdf', upsert: true });
  if (error) {
    console.error('[seller-reg] PDF upload failed:', error.message);
    return null;
  }
  return key;
}

function toPdfRecord(seller: any): SellerPdfRecord {
  const mask = (v: string | null | undefined) => {
    if (!v) return null;
    const s = String(v);
    return s.length <= 4 ? '****' : `****${s.slice(-4)}`;
  };
  return {
    sellerId: seller.sellerId || 'PENDING',
    businessName: seller.storeName || 'Not provided',
    ownerName: seller.user?.fullName || 'Not provided',
    email: seller.user?.email || 'Not provided',
    phone: seller.user?.phone || 'Not provided',
    businessType: seller.businessType,
    gstNumber: seller.gstNumber,
    panNumber: seller.panNumber,
    addressLine: seller.pickupAddress?.addressLine1 || seller.pickupAddress?.streetAddress || null,
    city: seller.city,
    state: seller.state,
    pincode: seller.pincode,
    bankAccountHolder: seller.bankAccountName,
    bankAccountMasked: mask(seller.bankAccountNo),
    bankIfsc: seller.bankIfsc,
    status: seller.status || 'PENDING',
    registeredAt: new Date(seller.createdAt || Date.now()).toISOString(),
  };
}

export async function processSellerRegistration(sellerProfileId: string): Promise<void> {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerProfileId },
      include: { user: true, pickupAddress: true },
    });
    if (!seller || !seller.sellerId) return;

    // Idempotency: skip if a GENERATED doc already exists for this seller.
    const existing = await prisma.sellerDocument.findFirst({
      where: { sellerProfileId, generationStatus: 'GENERATED' },
    });
    if (existing) return;

    const doc = await prisma.sellerDocument.create({
      data: {
        sellerProfileId,
        sellerBusinessId: seller.sellerId,
        documentType: 'SELLER_REGISTRATION_PDF',
        documentVersion: 1,
        generationStatus: 'PENDING',
      },
    });

    let generationStatus = 'GENERATED';
    let storageKey: string | null = null;
    let deliveryStatus = 'EMAIL_FAILED';

    try {
      const pdf = generateSellerPdf(toPdfRecord(seller));
      storageKey = await storeSellerPdf(sellerProfileId, seller.sellerId, pdf);
      const email = await sendSellerRegistrationEmail(
        seller.user?.email || '',
        seller.user?.fullName || '',
        seller.sellerId,
        seller.status || 'PENDING'
      );
      deliveryStatus = email.success ? 'EMAIL_SENT' : 'EMAIL_FAILED';
      if (!storageKey) generationStatus = 'FAILED';
    } catch (e) {
      generationStatus = 'FAILED';
      console.error('[seller-reg] generation failed:', (e as any)?.message || e);
    }

    let finalDelivery = deliveryStatus;
    if (!process.env.WHATSAPP_BUSINESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      finalDelivery = `${deliveryStatus}|WHATSAPP_CONFIGURATION_REQUIRED`;
    }

    await prisma.sellerDocument.update({
      where: { id: doc.id },
      data: {
        storageKey,
        generationStatus,
        generatedAt: generationStatus === 'GENERATED' ? new Date() : null,
        lastDeliveryStatus: finalDelivery,
      },
    });
  } catch (error) {
    console.error('[seller-reg] processSellerRegistration error:', (error as any)?.message || error);
  }
}

export async function backfillLegacySellerIds(): Promise<{ updated: number }> {
  const missing = await prisma.seller.findMany({
    where: { sellerId: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, createdAt: true },
    take: 500,
  });
  let updated = 0;
  for (const s of missing) {
    try {
      await prisma.$transaction(async (tx) => {
        const { sellerId } = await allocateSellerId(tx, new Date(s.createdAt || Date.now()));
        await tx.seller.update({ where: { id: s.id }, data: { sellerId } });
      });
      updated += 1;
    } catch (e) {
      console.error('[seller-reg] backfill failed for', s.id, (e as any)?.message || e);
    }
  }
  return { updated };
}


