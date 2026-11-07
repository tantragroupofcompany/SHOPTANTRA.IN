import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { classifyDbError } from '../../../../lib/authUtils';
import { requireAuth } from '../../../../middleware/index';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request as any);
    if (auth instanceof NextResponse) return auth;
    const sessionUserId = (auth as any).userId;

    const body = await request.json();
    const { userId, orderId, subject, description, type } = body || {};
    const effectiveUserId = sessionUserId || userId;

    if (!effectiveUserId || !subject || !description || !type) {
      return NextResponse.json({ error: 'Missing required ticket fields' }, { status: 400 });
    }

    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          userId: effectiveUserId,
          orderId: orderId || null,
          subject,
          description,
          type,
          status: 'OPEN',
        },
      });

      return NextResponse.json({ success: true, message: 'Ticket registered successfully', ticket });
    } catch (dbError: any) {
      // Previously this returned `{ success: true, simulated: true, ticket: {...} }`
      // when the write failed, so the buyer believed a ticket existed while nothing
      // was stored. A failed write is reported as a failure.
      console.error('[buyer/tickets] write failed:', dbError?.code || dbError?.message);
      const classified = classifyDbError(dbError);
      if (classified) {
        return NextResponse.json({ error: classified }, { status: 503 });
      }
      return NextResponse.json(
        { error: 'Your support ticket could not be saved. Please try again in a moment.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Support ticket creation failed' }, { status: 500 });
  }
}
