import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword, hashResetToken } from '../../../../lib/authUtils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // 1. Validation
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // 2. Find token using its SHA-256 hash (tokens are never stored in plaintext)
    const tokenHash = hashResetToken(token);
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: 'This password reset link is invalid or has already been used. Please request a new link.' }, { status: 400 });
    }

    // 3. Expiry check (10 minutes)
    if (tokenRecord.expiresAt < new Date()) {
      // Invalidate expired tokens
      await prisma.passwordResetToken.deleteMany({
        where: { email: tokenRecord.email },
      }).catch(err => console.error('Failed to delete expired tokens:', err));

      return NextResponse.json({ error: 'This password reset link has expired. Please request a new one.' }, { status: 400 });
    }

    // 4. Update password for the identity record (covers BUYER and/or SELLER on this email)
    const hashedPassword = hashPassword(newPassword);
    await prisma.user.updateMany({
      where: { email: tokenRecord.email },
      data: { password: hashedPassword },
    });

    // 5. Single-use: delete this token AND any other pending tokens for the same email,
    //    so an already-used link can never be reused and older links stop working.
    await prisma.passwordResetToken.deleteMany({
      where: { email: tokenRecord.email },
    });

    console.log(`[PASSWORD RESET SUCCESS] Password updated for email=${tokenRecord.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error: any) {
    console.error('Error during reset-password execution:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting the password.' },
      { status: 500 }
    );
  }
}
