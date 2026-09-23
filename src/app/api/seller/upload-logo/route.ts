import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazily initialize the Supabase admin client inside the request handler so
 * that a missing / invalid SUPABASE_URL does not crash the entire module at
 * import time and break unrelated routes.
 */
function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key || !/^https?:\/\/.+/.test(url)) {
    return null;
  }
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const file = formData.get('file') as File;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Validation checks
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds the 5 MB limit.' }, { status: 400 });
    }

    // 2. Save seller profile reference
    const seller = await prisma.seller.findUnique({
      where: { userId }
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // 3. Resolve Supabase admin client — may be unavailable in some environments
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.warn('[upload-logo] Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing). Logo upload skipped.');
      return NextResponse.json(
        { error: 'Logo storage is not configured. Please contact support or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 }
      );
    }

    // 4. Generate unique filename
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    // 5. Convert File to ArrayBuffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Ensure bucket exists in Supabase
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.some(b => b.name === 'logos')) {
        await supabaseAdmin.storage.createBucket('logos', { public: true });
      }
    } catch (e) {
      console.warn('Bucket verification warning (logos):', e);
    }

    // 7. Optionally delete old logo file if exists
    if (seller.logoUrl) {
      try {
        const oldFileName = seller.logoUrl.split('/').pop();
        if (oldFileName) {
          await supabaseAdmin.storage.from('logos').remove([oldFileName]);
        }
      } catch (e) {
        console.warn('Failed to remove old logo file:', e);
      }
    }

    // 8. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Failed to upload to storage');
    }

    // 9. Get Public URL
    const { data } = supabaseAdmin.storage.from('logos').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    // 10. Save logo URL inside Seller Profile
    const updatedSeller = await prisma.seller.update({
      where: { id: seller.id },
      data: { logoUrl: publicUrl }
    });

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
      seller: updatedSeller
    });

  } catch (error: any) {
    console.error('Error handling logo upload:', error);
    return NextResponse.json({ error: error.message || 'Failed to process logo upload' }, { status: 500 });
  }
}
