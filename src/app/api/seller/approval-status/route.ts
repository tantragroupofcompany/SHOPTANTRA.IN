import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: {
        status: true,
        verificationStatus: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ status: 'PENDING' });
    }

    return NextResponse.json({
      status: seller.status,
      verificationStatus: seller.verificationStatus,
    });
  } catch (error: any) {
    console.error('Error fetching seller approval status:', error);
    return NextResponse.json({ status: 'PENDING' });
  }
}