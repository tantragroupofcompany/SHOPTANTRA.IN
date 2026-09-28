import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { classifyDbError } from '../../../../lib/authUtils';

export async function GET() {
  try {
    try {
      const notifications = await prisma.adminNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return NextResponse.json({ success: true, data: notifications });
    } catch (dbError: any) {
      // This used to answer 200 with fabricated "offline" notification logs, which
      // put invented orders and payouts in front of the operator. An unreadable
      // feed now says so.
      console.error('[admin/notifications] read failed:', dbError?.code || dbError?.message);
      const classified = classifyDbError(dbError);
      if (classified) {
        return NextResponse.json({ error: classified, data: [] }, { status: 503 });
      }
      return NextResponse.json(
        { error: 'Notifications could not be loaded right now.', data: [] },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch admin notifications', data: [] }, { status: 500 });
  }
}
