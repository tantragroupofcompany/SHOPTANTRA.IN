import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/authUtils';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // 1. Validation
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // 2. Find Token in database
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: token }
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: 'This password reset link is invalid. Please request a new link.' }, { status: 400 });
    }

    // 3. Expiry Check (10 minutes)
    if (tokenRecord.expiresAt < new Date()) {
      // Invalidate expired token
      await prisma.passwordResetToken.delete({
        where: { token: token }
      }).catch(err => console.error('Failed to delete expired token:', err));

      return NextResponse.json({ error: 'This password reset link has expired (10-minute limit). Please request a new one.' }, { status: 400 });
    }

    // 4. Update Password
    const hashedPassword = hashPassword(newPassword);
    const updatedUser = await prisma.user.update({
      where: { email: tokenRecord.email },
      data: { password: hashedPassword }
    });

    // 5. Invalidate Token (Delete after use)
    await prisma.passwordResetToken.delete({
      where: { token: token }
    });

    console.log(`[PASSWORD RESET SUCCESS]: Email=${tokenRecord.email}, UserID=${updatedUser.id}`);

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.'
    });
  } catch (error: any) {
    console.error('Error during reset-password execution:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting the password.' },
      { status: 500 }
    );
  }
}
