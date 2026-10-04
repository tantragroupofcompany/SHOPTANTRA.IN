import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireSellerScope } from '../../../../lib/sellerAuth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');

    if (!sellerIdParam) {
      return NextResponse.json({ error: 'sellerId or userId query parameter is required' }, { status: 400 });
    }

    const scope = await requireSellerScope(request, sellerIdParam);
    if (!scope.ok) return scope.response;
    const sellerId = scope.sellerId;

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

    // AUTHORIZATION: a seller may only change their OWN settings.
    const scope = await requireSellerScope(request, idToResolve);
    if (!scope.ok) return scope.response;
    const sellerId = scope.sellerId;

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
