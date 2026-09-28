import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { classifyDbError } from '../../../../lib/authUtils';

export async function POST(request: Request) {
  try {
    const { userId, orderId, subject, description, type } = await request.json();

    if (!userId || !subject || !description || !type) {
      return NextResponse.json({ error: 'Missing required ticket fields' }, { status: 400 });
    }

    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          userId,
          orderId,
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
