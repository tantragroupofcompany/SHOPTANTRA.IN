import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { hashPassword } from '../../../../../lib/authUtils';
import { sendVerificationEmail } from '../../../../../lib/email';

const ADMIN_ROLES = ['FOUNDER', 'MD', 'CEO', 'MANAGER', 'ADMIN'];

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify user exists and has an admin role
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user || !ADMIN_ROLES.includes(user.role)) {
      // Return a generic message to prevent email enumeration
      return NextResponse.json({ error: 'Unauthorized access or invalid account.' }, { status: 403 });
    }

    // 2. Check for lockouts
    const existingOtpRecord = await prisma.oTP.findUnique({
      where: { email: cleanEmail }
    });

    if (existingOtpRecord?.lockedUntil && new Date() < existingOtpRecord.lockedUntil) {
      const lockMins = Math.ceil((existingOtpRecord.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({ error: `Account locked due to too many failed attempts. Try again in ${lockMins} minutes.` }, { status: 429 });
    }

    // 3. Generate 7-digit OTP
    const unhashedOtp = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 digits
    const hashedOtp = hashPassword(unhashedOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 4. Upsert OTP record
    await prisma.oTP.upsert({
      where: { email: cleanEmail },
      update: {
        otpCode: hashedOtp,
        expiresAt,
        // Reset attempts if they were successful before, or just let verify handle the increments
      },
      create: {
        email: cleanEmail,
        otpCode: hashedOtp,
        expiresAt,
      }
    });

    // 5. Dispatch Email (or SMS via integration in the future)
    await sendVerificationEmail(cleanEmail, user.fullName || 'Executive', unhashedOtp);

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error requesting admin OTP:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
