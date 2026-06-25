import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Simple HTML escaping function to prevent XSS
function sanitizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Validate email
    if (!email || typeof email !== 'string' || !email.trim() || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Prevent duplicate subscriptions
    const existingSub = await prisma.newsletterSubscription.findUnique({
      where: { email: cleanEmail }
    });

    if (existingSub) {
      return NextResponse.json({ error: 'This email is already subscribed to our newsletter.' }, { status: 400 });
    }

    // 3. Create subscription in database
    const newSub = await prisma.newsletterSubscription.create({
      data: {
        email: cleanEmail
      }
    });

    console.log(`[NEWSLETTER SUBSCRIBED]: ID=${newSub.id}, Email=${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: 'You have successfully subscribed to the newsletter!'
    });
  } catch (error: any) {
    console.error('Error during newsletter subscription API execution:', error);
    return NextResponse.json(
      { error: 'An internal error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
