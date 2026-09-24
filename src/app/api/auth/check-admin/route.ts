import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { classifyDbError, dbErrorReason } from '../../../../lib/authUtils';

export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });
    return NextResponse.json({ success: true, hasAdmin: adminCount > 0 });
  } catch (error: any) {
    // Tell an outage apart from a genuine fault. `reason` is a coarse, fixed
    // label (never the raw message) so an operator can see whether the database
    // is unreachable, the credentials were rejected, or the pooler could not
    // resolve the project named in DATABASE_URL.
    const classified = classifyDbError(error);
    console.error('[check-admin] DB check failed:', error?.code || error?.message);
    return NextResponse.json(
      {
        success: false,
        error: 'Database check failed',
        reason: dbErrorReason(error),
        detail: classified || undefined,
      },
      { status: classified ? 503 : 500 }
    );
  }
}
