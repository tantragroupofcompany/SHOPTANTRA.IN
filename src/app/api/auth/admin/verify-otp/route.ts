import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { verifyPassword } from '../../../../../lib/authUtils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'shoptantra_secret_jwt_key_2026';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const otpRecord = await prisma.oTP.findUnique({
      where: { email: cleanEmail }
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'No OTP requested for this email.' }, { status: 400 });
    }

    // 1. Check Lockout
    if (otpRecord.lockedUntil && new Date() < otpRecord.lockedUntil) {
      return NextResponse.json({ error: 'Account temporarily locked. Please try again later.' }, { status: 429 });
    }

    // 2. Check Expiry
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: 'OTP has expired. Request a new one.' }, { status: 400 });
    }

    // 3. Verify OTP
    const isValid = verifyPassword(otp.trim(), otpRecord.otpCode);

    if (!isValid) {
      const newAttempts = otpRecord.attempts + 1;
      let lockedUntil = null;
      
      if (newAttempts >= 3) {
        lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes lock
      }

      await prisma.oTP.update({
        where: { email: cleanEmail },
        data: { attempts: newAttempts, lockedUntil }
      });

      if (lockedUntil) {
        return NextResponse.json({ error: 'Too many failed attempts. Account locked for 10 minutes.' }, { status: 429 });
      }

      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
    }

    // 4. Success: Get user & generate JWT
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Reset attempts on success
    await prisma.oTP.update({
      where: { email: cleanEmail },
      data: { attempts: 0, lockedUntil: null }
    });

    // JWT payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: payload
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Error verifying admin OTP:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
