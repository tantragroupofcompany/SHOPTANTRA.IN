import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import crypto from 'crypto';
import { hashResetToken } from '../../../../lib/authUtils';
import { sendPasswordResetEmail } from '../../../../lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Look up the identity record (a single email may map to a BUYER and/or SELLER account).
    const dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { sellerProfile: true },
    });

    // 3. Send a GENERIC success response regardless of whether the account exists
    //    to avoid leaking which email addresses are registered (user enumeration).
    const genericResponse = NextResponse.json({
      success: true,
      message:
        'If an account is linked to this email address, a password reset link has been sent. Please check your inbox (and spam folder).',
    });

    if (!dbUser) {
      // No account with this email; still return the generic message.
      console.log(`[PASSWORD RESET REQUEST] No account found for email ${cleanEmail}`);
      return genericResponse;
    }

    // 4. Generate a cryptographically-secure reset token.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 5. Store only the SHA-256 hash of the token (single-use, short-lived).
    //    Delete any previous unused tokens for this email so old links stop working.
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { email: cleanEmail },
      }),
      prisma.passwordResetToken.create({
        data: {
          email: cleanEmail,
          token: hashResetToken(rawToken),
          expiresAt,
        },
      }),
    ]);

    // 6. Build the reset URL (production: https://shoptantra.in) and send it ONLY by email.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      new URL(request.url).origin;
    const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    const recipientName = dbUser.fullName || dbUser.sellerProfile?.storeName || '';

    try {
      const mailResult = await sendPasswordResetEmail(cleanEmail, recipientName, resetUrl);
      if (!mailResult.success) {
        // Do NOT expose the token/link on the page. In production SMTP is configured and
        // delivers this link; if it failed we still return the generic response and log.
        console.error('[PASSWORD RESET EMAIL] Delivery failed for ' + cleanEmail, mailResult.error);
      }
    } catch (mailError) {
      console.error('[PASSWORD RESET EMAIL] Unexpected failure for ' + cleanEmail, mailError);
    }

    console.log(`[PASSWORD RESET REQUEST] Reset link emailed to ${cleanEmail}. Expires=${expiresAt.toISOString()}`);
    return genericResponse;
  } catch (error: any) {
    console.error('Error during forgot-password execution:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the password reset request.' },
      { status: 500 }
    );
  }
}
