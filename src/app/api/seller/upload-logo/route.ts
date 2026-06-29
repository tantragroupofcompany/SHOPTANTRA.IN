import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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

    // 3. Generate unique filename
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    // 4. Convert File to ArrayBuffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 5. Ensure bucket exists in Supabase
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.some(b => b.name === 'logos')) {
        await supabaseAdmin.storage.createBucket('logos', { public: true });
      }
    } catch (e) {
      console.warn('Bucket verification warning (logos):', e);
    }

    // 6. Optionally delete old logo file if exists
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

    // 7. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Failed to upload to storage');
    }

    // 8. Get Public URL
    const { data } = supabaseAdmin.storage.from('logos').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    // 9. Save logo URL inside Seller Profile
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
