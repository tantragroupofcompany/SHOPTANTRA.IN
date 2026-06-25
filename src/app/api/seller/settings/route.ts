import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Helper to resolve user ID or seller profile ID to seller profile ID
async function resolveSellerId(id: string | null): Promise<string | null> {
  if (!id) return null;
  let seller = await prisma.seller.findFirst({
    where: {
      OR: [
        { id: id },
        { userId: id }
      ]
    }
  });
  if (!seller) {
    seller = await prisma.seller.findFirst({
      where: { status: 'ACTIVE' }
    });
  }
  return seller ? seller.id : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');

    if (!sellerIdParam) {
      return NextResponse.json({ error: 'sellerId or userId query parameter is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(sellerIdParam);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    let settings = await prisma.sellerSettings.findUnique({
      where: { sellerId }
    });

    if (!settings) {
      // Create default settings
      const defaultPrefs = {
        newOrders: true,
        lowStock: true,
        payments: true,
        reviews: true,
        emailNotifications: true,
        smsNotifications: false,
      };
      settings = await prisma.sellerSettings.create({
        data: {
          sellerId,
          notificationPrefs: JSON.stringify(defaultPrefs),
          twoFaEnabled: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        notificationPrefs: JSON.parse(settings.notificationPrefs),
        twoFaEnabled: settings.twoFaEnabled
      }
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sellerId: sellerIdParam, userId, notificationPrefs, twoFaEnabled } = body;

    const idToResolve = sellerIdParam || userId;
    if (!idToResolve) {
      return NextResponse.json({ error: 'sellerId or userId is required' }, { status: 400 });
    }

    const sellerId = await resolveSellerId(idToResolve);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (notificationPrefs !== undefined) {
      updateData.notificationPrefs = typeof notificationPrefs === 'string' ? notificationPrefs : JSON.stringify(notificationPrefs);
    }
    if (twoFaEnabled !== undefined) {
      updateData.twoFaEnabled = twoFaEnabled;
    }

    const settings = await prisma.sellerSettings.upsert({
      where: { sellerId },
      update: updateData,
      create: {
        sellerId,
        notificationPrefs: JSON.stringify(notificationPrefs || {
          newOrders: true,
          lowStock: true,
          payments: true,
          reviews: true,
          emailNotifications: true,
          smsNotifications: false,
        }),
        twoFaEnabled: twoFaEnabled || false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notificationPrefs: JSON.parse(settings.notificationPrefs),
        twoFaEnabled: settings.twoFaEnabled
      }
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
