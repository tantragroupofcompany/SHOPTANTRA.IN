import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/authUtils';
import { sendVerificationEmail } from '../../../../lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { sellerProfile: true },
    });

    if (!user || !user.sellerProfile) {
      return NextResponse.json({ error: 'Seller account not found.' }, { status: 404 });
    }

    const seller = user.sellerProfile;

    if (seller.verificationStatus === 'VERIFIED') {
      return NextResponse.json({ error: 'Account is already verified.' }, { status: 400 });
    }

    const now = new Date();

    // Check 24-hour reset for resend count
    let resendCount = seller.otpResendCount;
    if (seller.lastOtpSentAt) {
      const hoursSinceLast = (now.getTime() - seller.lastOtpSentAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast > 24) {
        resendCount = 0; // Reset after 24 hours
      }
    }

    // Max 3 attempts
    if (resendCount >= 3) {
      return NextResponse.json({ 
        error: 'Maximum OTP resend attempts reached. Please try again after 24 hours.' 
      }, { status: 429 });
    }

    // 60-second cooldown
    if (seller.lastOtpSentAt) {
      const secondsSinceLast = (now.getTime() - seller.lastOtpSentAt.getTime()) / 1000;
      if (secondsSinceLast < 60) {
        return NextResponse.json({ 
          error: `Please wait ${Math.ceil(60 - secondsSinceLast)} seconds before requesting a new OTP.` 
        }, { status: 429 });
      }
    }

    // Generate new OTP
    const unhashedOtp = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 digits
    const hashedOtp = hashPassword(unhashedOtp);
    const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins

    // Update DB
    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        otpCode: hashedOtp,
        otpExpiresAt,
        lastOtpSentAt: now,
        otpResendCount: resendCount + 1,
      },
    });

    // Dispatch email
    await sendVerificationEmail(user.email, user.fullName || 'Seller', unhashedOtp);

    return NextResponse.json({
      success: true,
      message: 'A new OTP has been sent to your email.',
    });
  } catch (error: any) {
    console.error('Error resending OTP:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while resending the OTP.' },
      { status: 500 }
    );
  }
}
