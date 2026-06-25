import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });
    return NextResponse.json({ success: true, hasAdmin: adminCount > 0 });
  } catch (error: any) {
    console.error('Error checking admin presence:', error);
    return NextResponse.json({ success: false, error: 'Database check failed' }, { status: 500 });
  }
}
