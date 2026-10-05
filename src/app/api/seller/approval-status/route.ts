import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../middleware/index';

/**
 * AUTHORIZATION — read this before touching this route.
 *
 * This endpoint reveals whether the named (or session) seller is
 * PENDING / ACTIVE / REJECTED / SUSPENDED — the exact signal the rest of
 * the app gates fulfilment, payouts and publication on. It previously ran
 * with no session at all, so anyone could enumerate user ids looking for
 * live seller accounts.
 *
 * It now requires a session. The logged-in caller may check their OWN
 * store, or — with an explicit userId — staff roles may check any store
 * they administer. Everyone else gets 403, so one seller cannot probe
 * another store's approval state.
 */
const ELEVATED = new Set(['ADMIN', 'FOUNDER', 'CEO_MD', 'CHAIRMAN']);

export async function GET(request: Request) {
  try {
    const guard = await requireRole(request as any, [
      'SELLER', 'BUYER', 'ADMIN', 'FOUNDER', 'CEO_MD', 'CHAIRMAN',
    ]);
    if (guard instanceof NextResponse) return guard;
    const role = String((guard as any).role || '');
    const sessionUserId = (guard as any).userId as string | undefined;

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    // No explicit target: answer for the caller's own store (200 even when
    // the row does not exist yet — PENDING — so registration keeps polling).
    if (!userIdParam) {
      if (!sessionUserId) {
        return NextResponse.json({ status: 'PENDING' });
      }
      const own = await prisma.seller.findUnique({
        where: { userId: sessionUserId },
        select: { status: true, verificationStatus: true },
      });
      if (!own) {
        return NextResponse.json({ status: 'PENDING' });
      }
      return NextResponse.json({
        status: own.status,
        verificationStatus: own.verificationStatus,
      });
    }

    // Explicit target: must be the caller's own account unless staff.
    if (!ELEVATED.has(role) && sessionUserId !== userIdParam) {
      return NextResponse.json(
        { error: "Access Denied – you may only check your own store's approval." },
        { status: 403 },
      );
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: userIdParam },
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