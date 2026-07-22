import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword, verifyPassword } from '../../../../lib/authUtils';
import { SignJWT } from 'jose';

const CORPORATE_CODES: Record<string, string> = {
  FOUNDER: process.env.CORPORATE_ACCESS_CODE_FOUNDER || 'ST_2026_FOUNDER',
  CEO_MD: process.env.CORPORATE_ACCESS_CODE_CEO || 'ST_2026_CEO',
  CHAIRMAN: process.env.CORPORATE_ACCESS_CODE_CHAIRMAN || 'ST_2026_CHAIRMAN',
};

const ALLOWED_CORPORATE_ROLES = ['FOUNDER', 'CEO_MD', 'CHAIRMAN'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessCode, email, password } = body;

    if (!accessCode || !email || !password) {
      return NextResponse.json({ error: 'Invalid Corporate Access Code or credentials.' }, { status: 401 });
    }

    // Match access code to role
    const matchedRole = Object.keys(CORPORATE_CODES).find(
      (role) => CORPORATE_CODES[role] === accessCode
    );

    if (!matchedRole) {
      return NextResponse.json({ error: 'Invalid Corporate Access Code or credentials.' }, { status: 401 });
    }

    // Find user by email
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Invalid Corporate Access Code or credentials.' }, { status: 401 });
    }

    // Verify password
    const passwordValid = verifyPassword(password, dbUser.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid Corporate Access Code or credentials.' }, { status: 401 });
    }

    // Verify role match
    if (dbUser.role !== matchedRole) {
      return NextResponse.json({ error: 'Invalid Corporate Access Code or credentials.' }, { status: 403 });
    }

    // Create session JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'shoptantra_super_secret_jwt_key_2026');
    const token = await new SignJWT({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      type: 'corporate',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        fullName: dbUser.fullName,
      },
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set('corporate_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Corporate login error:', error);
    return NextResponse.json({ error: 'Invalid Corporate Access Code or credentials.' }, { status: 500 });
  }
}