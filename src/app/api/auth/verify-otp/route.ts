import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword } from '../../../../lib/authUtils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find the user and seller profile
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

    if (!seller.otpCode || !seller.otpExpiresAt) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    // Check expiration
    if (new Date() > seller.otpExpiresAt) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Verify OTP hash
    const isValid = verifyPassword(otp.trim(), seller.otpCode);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP. Please check and try again.' }, { status: 400 });
    }

    // Mark as verified
    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        verificationStatus: 'VERIFIED',
        emailVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'An internal error occurred during verification.' },
      { status: 500 }
    );
  }
}
