import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword } from '../../../../lib/authUtils';
import { SignJWT } from 'jose';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 401 });
    }

    // Find user by username
    const dbUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    // Verify password
    const passwordValid = verifyPassword(password, dbUser.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    // Verify corporate role
    const allowedCorporateRoles = ['FOUNDER', 'CEO_MD', 'CHAIRMAN'];
    if (!allowedCorporateRoles.includes(dbUser.role)) {
      return NextResponse.json({ error: 'Access Denied. This account does not have executive privileges.' }, { status: 403 });
    }

    // Create session JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'shoptantra_super_secret_jwt_key_2026');
    const token = await new SignJWT({
      userId: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
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
        username: dbUser.username,
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

    // Also set regular auth_token for middleware compatibility
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Corporate login error:', error);
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 500 });
  }
}