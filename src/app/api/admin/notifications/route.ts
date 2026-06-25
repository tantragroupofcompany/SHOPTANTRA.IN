import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    try {
      const notifications = await prisma.adminNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return NextResponse.json({ success: true, data: notifications });
    } catch (dbError) {
      console.warn('Prisma AdminNotification fetch failed. Simulating local offline notification logs.');
      const simulatedLogs = [
        {
          id: 'sim_notif_1',
          title: 'New Order Received',
          message: 'Order SHP-2026-000001 of ₹4,599 paid via RAZORPAY.',
          type: 'ORDER',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sim_notif_2',
          title: 'New Order Received',
          message: 'Order SHP-2026-000002 of ₹2,299 paid via CASHFREE.',
          type: 'ORDER',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'sim_notif_3',
          title: 'Payout Released',
          message: 'Released ₹12,500 payout to Kashmiri Saffron Crafts.',
          type: 'PAYOUT',
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        }
      ];
      return NextResponse.json({ success: true, simulated: true, data: simulatedLogs });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch admin notifications' }, { status: 500 });
  }
}
