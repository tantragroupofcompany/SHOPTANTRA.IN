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

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // 1. Server-side Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.trim() || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (phone && (typeof phone !== 'string' || phone.trim().length > 20)) {
      return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    // 2. Input Sanitization (XSS mitigation)
    const cleanName = sanitizeString(name.trim());
    const cleanEmail = sanitizeString(email.trim().toLowerCase());
    const cleanPhone = phone ? sanitizeString(phone.trim()) : null;
    const cleanMessage = sanitizeString(message.trim());

    // 3. Database Insertion
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        message: cleanMessage,
      },
    });

    // 4. Logging Submission
    console.log(`[CONTACT INQUIRY RECEIVED]: ID=${inquiry.id}, Name=${cleanName}, Email=${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your inquiry has been submitted successfully.',
      data: {
        id: inquiry.id,
        createdAt: inquiry.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error in contact inquiry API:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
