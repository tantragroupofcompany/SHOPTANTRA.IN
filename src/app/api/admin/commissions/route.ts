import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Fetch global settings and list of commission payouts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'reports'; // 'reports' or 'settings'

    if (type === 'settings') {
      const settings = await prisma.globalSettings.upsert({
        where: { id: 'settings' },
        update: {},
        create: {
          id: 'settings',
          defaultCommissionRate: 10.0,
          categoryCommissions: '{}',
          settlementDelayDays: 7,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...settings,
          categoryCommissions: (() => {
            try { return JSON.parse(settings.categoryCommissions); } catch { return {}; }
          })(),
        },
      });
    }

    // Default: Fetch all commission records (reports)
    const commissions = await prisma.commission.findMany({
      include: {
        order: {
          select: {
            orderNumber: true,
          },
        },
        seller: {
          select: {
            storeName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: commissions,
    });
  } catch (error: any) {
    console.error('Error fetching admin commissions details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve commissions details' },
      { status: 500 }
    );
  }
}

// Update global commission configurations
export async function POST(request: Request) {
  try {
    const { defaultCommissionRate, categoryCommissions, settlementDelayDays } = await request.json();

    const catCommStr = categoryCommissions !== undefined
      ? (typeof categoryCommissions === 'string' ? categoryCommissions : JSON.stringify(categoryCommissions))
      : undefined;

    const settings = await prisma.globalSettings.upsert({
      where: { id: 'settings' },
      update: {
        defaultCommissionRate: defaultCommissionRate !== undefined ? parseFloat(defaultCommissionRate) : undefined,
        categoryCommissions: catCommStr,
        settlementDelayDays: settlementDelayDays !== undefined ? parseInt(settlementDelayDays) : undefined,
      },
      create: {
        id: 'settings',
        defaultCommissionRate: defaultCommissionRate !== undefined ? parseFloat(defaultCommissionRate) : 10.0,
        categoryCommissions: catCommStr || '{}',
        settlementDelayDays: settlementDelayDays !== undefined ? parseInt(settlementDelayDays) : 7,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Commission settings updated successfully',
      data: {
        ...settings,
        categoryCommissions: (() => {
          try { return JSON.parse(settings.categoryCommissions); } catch { return {}; }
        })(),
      },
    });
  } catch (error: any) {
    console.error('Error updating commission settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update commission settings' },
      { status: 500 }
    );
  }
}
