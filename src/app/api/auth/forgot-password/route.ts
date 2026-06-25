import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Query Database for user
    const dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'No registered account was found with this email address.' }, { status: 404 });
    }

    // 3. Generate Secure Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 4. Save to Database
    await prisma.passwordResetToken.create({
      data: {
        email: cleanEmail,
        token: token,
        expiresAt: expiresAt,
      }
    });

    console.log(`[PASSWORD RESET REQUEST]: Email=${cleanEmail}, Token=${token}, Expires=${expiresAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset link generated successfully.',
      token: token,
      expiresAt: expiresAt,
    });
  } catch (error: any) {
    console.error('Error during forgot-password execution:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating the reset link.' },
      { status: 500 }
    );
  }
}
