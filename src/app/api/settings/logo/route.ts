import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'settings' }
    });
    return NextResponse.json({
      logoUrl: settings?.parentCompanyLogoUrl || null,
    });
  } catch (error: any) {
    console.error('Error fetching company logo:', error);
    return NextResponse.json({ logoUrl: null });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const adminId = formData.get('adminId') as string;
    const file = formData.get('file') as File;

    if (!adminId) {
      return NextResponse.json({ error: 'adminId is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId }
    });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // 2. Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds the 5 MB limit.' }, { status: 400 });
    }

    // 3. Generate unique filename
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `parent-company-logo-${Date.now()}.${fileExt}`;

    // 4. Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 5. Ensure bucket exists
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.some(b => b.name === 'logos')) {
        await supabaseAdmin.storage.createBucket('logos', { public: true });
      }
    } catch (e) {
      console.warn('Bucket verification warning:', e);
    }

    // 6. Delete old logo if exists
    const currentSettings = await prisma.globalSettings.findUnique({
      where: { id: 'settings' }
    });
    if (currentSettings?.parentCompanyLogoUrl) {
      try {
        const oldFileName = currentSettings.parentCompanyLogoUrl.split('/').pop();
        if (oldFileName) {
          await supabaseAdmin.storage.from('logos').remove([oldFileName]);
        }
      } catch (e) {
        console.warn('Failed to remove old logo:', e);
      }
    }

    // 7. Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Failed to upload to storage');
    }

    // 8. Get Public URL
    const { data: urlData } = supabaseAdmin.storage.from('logos').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // 9. Save to GlobalSettings
    const settings = await prisma.globalSettings.upsert({
      where: { id: 'settings' },
      update: { parentCompanyLogoUrl: publicUrl },
      create: {
        id: 'settings',
        defaultCommissionRate: 10.0,
        categoryCommissions: '{}',
        settlementDelayDays: 7,
        parentCompanyLogoUrl: publicUrl,
      },
    });

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
      settings,
    });

  } catch (error: any) {
    console.error('Error uploading parent company logo:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload logo' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json({ error: 'adminId is required' }, { status: 400 });
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId }
    });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Clear the logo URL
    await prisma.globalSettings.upsert({
      where: { id: 'settings' },
      update: { parentCompanyLogoUrl: null },
      create: {
        id: 'settings',
        defaultCommissionRate: 10.0,
        categoryCommissions: '{}',
        settlementDelayDays: 7,
        parentCompanyLogoUrl: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Logo removed' });
  } catch (error: any) {
    console.error('Error removing parent company logo:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove logo' }, { status: 500 });
  }
}