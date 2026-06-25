import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/authUtils';

import { sendVerificationEmail } from '../../../../lib/email';
import crypto from 'crypto';

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
const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, businessInfo } = body;

    // 1. Validation checks
    if (!email || typeof email !== 'string' || !email.trim() || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    const uppercaseRole = role ? role.toUpperCase() : 'BUYER';
    if (!['BUYER', 'SELLER', 'ADMIN'].includes(uppercaseRole)) {
      return NextResponse.json({ error: 'Invalid user role specified.' }, { status: 400 });
    }

    // If registering as admin, only allow if no other admin exists
    if (uppercaseRole === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount > 0) {
        return NextResponse.json({ error: 'An administrator account already exists. New admin creation is restricted.' }, { status: 403 });
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = sanitizeString(fullName.trim());
    const phone = businessInfo?.phone || null;

    if (phone && !PHONE_REGEX.test(phone.replace(/\s+/g, ''))) {
      return NextResponse.json({ error: 'Please enter a valid phone number (10-15 digits).' }, { status: 400 });
    }

    // 2. Prevent Duplicate Email in database
    const emailExists = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (emailExists) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 400 });
    }

    // 3. Prevent Duplicate Phone Number (if provided)
    if (phone) {
      const cleanPhone = phone.trim();
      const phoneExists = await prisma.user.findFirst({
        where: { phone: cleanPhone }
      });
      if (phoneExists) {
        return NextResponse.json({ error: 'This phone number is already registered to another account.' }, { status: 400 });
      }
    }

    const hashedPassword = hashPassword(password);
    
    // Generate 7-digit OTP if seller
    let unhashedOtp = '';
    let hashedOtp = null;
    let otpExpiresAt = null;
    
    if (uppercaseRole === 'SELLER') {
      unhashedOtp = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 digits
      hashedOtp = hashPassword(unhashedOtp);
      otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    }

    // 4. Perform database insertions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          role: uppercaseRole,
          fullName: cleanFullName,
          phone: phone ? phone.trim() : null,
        }
      });

      if (uppercaseRole === 'SELLER') {
        const storeName = businessInfo?.storeName || `${cleanFullName}'s Store`;
        await tx.seller.create({
          data: {
            userId: newUser.id,
            storeName: sanitizeString(storeName.trim()),
            storeDescription: businessInfo?.storeDescription ? sanitizeString(businessInfo.storeDescription.trim()) : null,
            businessType: businessInfo?.businessType ? sanitizeString(businessInfo.businessType.trim()) : 'INDIVIDUAL',
            panNumber: businessInfo?.panCard ? sanitizeString(businessInfo.panCard.trim().toUpperCase()) : null,
            city: businessInfo?.city ? sanitizeString(businessInfo.city.trim()) : null,
            state: businessInfo?.state ? sanitizeString(businessInfo.state.trim()) : null,
            pincode: businessInfo?.pinCode ? sanitizeString(businessInfo.pinCode.trim()) : null,
            status: 'PENDING',
            verificationStatus: 'PENDING_VERIFICATION',
            otpCode: hashedOtp,
            otpExpiresAt: otpExpiresAt,
            lastOtpSentAt: new Date(),
          }
        });
      }

      return newUser;
    });

    if (uppercaseRole === 'SELLER') {
      // Dispatch email asynchronously
      sendVerificationEmail(cleanEmail, cleanFullName, unhashedOtp);
    }

    console.log(`[USER REGISTERED]: ID=${result.id}, Email=${result.email}, Role=${result.role}`);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: result.id,
        email: result.email,
        role: result.role.toLowerCase(),
        fullName: result.fullName,
      }
    });

  } catch (error: any) {
    console.error('Error during registration API execution:', error);
    return NextResponse.json(
      { error: 'An internal error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
