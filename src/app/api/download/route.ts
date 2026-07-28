import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, url, userAgent } = body;

    if (!platform || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await prisma.downloadAnalytics.create({
      data: {
        platform: platform.toUpperCase(),
        url,
        userAgent: userAgent || 'unknown',
        downloadedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Download tracking error:', error);
    return NextResponse.json({ success: true }); // Don't block downloads on tracking failure
  }
}

export async function GET() {
  try {
    const total = await prisma.downloadAnalytics.count();
    const android = await prisma.downloadAnalytics.count({ where: { platform: 'ANDROID' } });
    const windows = await prisma.downloadAnalytics.count({ where: { platform: 'WINDOWS' } });
    const macos = await prisma.downloadAnalytics.count({ where: { platform: 'MACOS' } });
    const linux = await prisma.downloadAnalytics.count({ where: { platform: 'LINUX' } });
    const today = await prisma.downloadAnalytics.count({
      where: {
        downloadedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return NextResponse.json({
      total,
      android,
      windows,
      macos,
      linux,
      today,
    });
  } catch (error) {
    return NextResponse.json({ total: 0, android: 0, windows: 0, macos: 0, linux: 0, today: 0 });
  }
}