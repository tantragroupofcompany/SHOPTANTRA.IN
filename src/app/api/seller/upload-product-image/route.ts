import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { prisma } from '../../../../lib/prisma';
import { requireSellerScope } from '../../../../lib/sellerAuth';

/**
 * POST /api/seller/upload-product-image
 *
 * Real file upload for product photos. The product form previously offered only
 * free-text image URL fields — there was no way to upload a file at all, so
 * sellers pasted external URLs that later 404'd or were blocked by the page's
 * Content-Security-Policy, and product photos "never appeared after upload".
 *
 * Contract:
 *   - Auth: requireSellerScope (session-derived store; optional sellerId/userId
 *     is honoured only when it resolves to the caller's own store, or the caller
 *     is an executive). NEVER trusts a bare client-supplied store id.
 *   - Path: the storage key is generated SERVER-SIDE under the authorised
 *     seller's folder, so a caller can never supply a path or overwrite another
 *     seller's files.
 *   - Content: JPEG / PNG / WebP only, magic-byte verified, <= 5 MB.
 *   - Storage: Supabase Storage bucket `product-images` (created public on first
 *     use — product photos are public storefront assets). Missing configuration
 *     is reported honestly as 503, never as a fake URL.
 */

/** Lazily build the admin client so a missing config cannot crash the module. */
function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key || !/^https?:\/\/.+/.test(url)) {
    return null;
  }
  return createClient(url, key);
}

const ALLOWED_TYPES: Record<string, 'jpeg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/** Verify the file's magic bytes match the declared MIME type. */
function matchesMagicBytes(buffer: Buffer, type: 'jpeg' | 'png' | 'webp'): boolean {
  if (buffer.length < 12) return false;
  if (type === 'jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (type === 'png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  // webp: "RIFF" .... "WEBP"
  return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const sellerIdParam =
      (formData.get('sellerId') as string | null) ||
      (formData.get('userId') as string | null);

    if (!(file instanceof File) && !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const upload = file as File;

    const mime = String((upload as any).type || '').toLowerCase();
    const kind = ALLOWED_TYPES[mime];
    if (!kind) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG and WebP images are allowed.' },
        { status: 400 }
      );
    }
    if (upload.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 5 MB limit.' },
        { status: 400 }
      );
    }
    if (upload.size === 0) {
      return NextResponse.json({ error: 'Empty file upload.' }, { status: 400 });
    }

    // AUTHORIZATION: the store is derived from the session. A caller-supplied
    // id is honoured only when it resolves to the caller's own store (or the
    // caller is an executive). Never trusts a bare client-supplied store id.
    const scope = await requireSellerScope(request, sellerIdParam || undefined);
    if (!scope.ok) return scope.response;

    const buffer = Buffer.from(await upload.arrayBuffer());
    if (!matchesMagicBytes(buffer, kind)) {
      return NextResponse.json(
        { error: 'File content does not match its declared image type.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.warn(
        '[upload-product-image] Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing).'
      );
      return NextResponse.json(
        { error: 'Image storage is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.some((b) => b.name === 'product-images')) {
        await supabaseAdmin.storage.createBucket('product-images', { public: true });
      }
    } catch (e) {
      console.warn('[upload-product-image] bucket check warning:', e);
    }

    const ext = kind === 'jpeg' ? 'jpg' : kind;
    const key = `${scope.sellerId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(key, buffer, { contentType: mime, upsert: false });
    if (uploadError) {
      console.error('[upload-product-image] storage upload failed:', uploadError.message);
      return NextResponse.json(
        { error: 'Image upload failed. Please try again.' },
        { status: 502 }
      );
    }

    const { data } = supabaseAdmin.storage.from('product-images').getPublicUrl(key);
    return NextResponse.json({ success: true, url: data.publicUrl, key });
  } catch (error: any) {
    console.error('[upload-product-image] handler failed:', error?.code || error?.message);
    return NextResponse.json(
      { error: 'Image upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
