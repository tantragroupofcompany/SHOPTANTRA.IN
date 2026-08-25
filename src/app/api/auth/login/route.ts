import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword } from '../../../../lib/authUtils';
import { ensureSchema } from '../../../../lib/dbBootstrap';

import jwt from 'jsonwebtoken';

// Secret key for secure JWT token signing
const JWT_SECRET = process.env.JWT_SECRET;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // Make sure additive marketplace schema exists before querying Seller relations
    await ensureSchema();

    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const { email, password, username, accountType } = body;

    // Support username as an alternative login identifier (email OR username)
    const loginIdentifier = (username || email || '').toString().trim();
    const isEmail = EMAIL_REGEX.test(loginIdentifier);
    const cleanIdentifier = isEmail ? loginIdentifier.toLowerCase() : loginIdentifier;

    // 1. Validation
    if (!loginIdentifier) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    // 2. Query Database for user (by email or username)
    let dbUser = await prisma.user.findFirst({
      where: isEmail ? { email: cleanIdentifier } : { username: cleanIdentifier },
      include: { sellerProfile: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'No account found matching this email address.' }, { status: 404 });
    }

    // 3. Check password using the actual stored hash (bcrypt OR pbkdf2 formats)
    if (!verifyPassword(password, dbUser.password)) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    // 3b. When accountType is requested, verify the requested account exists for this identity
    if (accountType) {
      const wanted = String(accountType).toUpperCase();
      if (wanted === 'SELLER' && !dbUser.sellerProfile) {
        return NextResponse.json({ error: 'No seller account is linked to this email address.' }, { status: 403 });
      }
      if (wanted === 'ADMIN' && dbUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No administrator account is linked to this email address.' }, { status: 403 });
      }
    }

    // 4. Check status if this identity is a seller
    if (dbUser.role === 'SELLER' && dbUser.sellerProfile) {
      if (dbUser.sellerProfile.verificationStatus === 'PENDING_VERIFICATION') {
        return NextResponse.json({ error: 'Please verify your email before accessing your seller account.' }, { status: 403 });
      }
      if (dbUser.sellerProfile.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'This seller account has been suspended. Contact support.' }, { status: 403 });
      }
    }

    // 5. Create secure JWT token
    const effectiveRole = accountType
      ? String(accountType).toUpperCase()
      : dbUser.role;
    const payload = {
      id: dbUser.id,
      userId: dbUser.id,
      email: dbUser.email,
      role: effectiveRole,
      accountType: effectiveRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    };

    const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
    const isProduction = process.env.NODE_ENV === 'production';

    // 6. Build response and set the shared HttpOnly auth cookie so the
    //    middleware RBAC/CSRF-protected APIs (/api/seller, /api/buyer, /api/corporate)
    //    recognise the session. This is the fix for seller/buyer login: previously the
    //    token was only returned in JSON and never stored in a cookie, so every
    //    protected dashboard API returned 401.
    const response = NextResponse.json({
      success: true,
      roles: buildRoles(dbUser),
      accountSelectionRequired: buildRoles(dbUser).length > 1 && !accountType,
      hasBuyer: true,
      hasSeller: !!dbUser.sellerProfile,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: effectiveRole.toLowerCase(),
        fullName: dbUser.fullName,
        phone: dbUser.phone,
      },
      session: {
        access_token: token,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: `refresh_${Math.random().toString(36).substring(2, 10)}`,
        user: {
          id: dbUser.id,
          email: dbUser.email,
        },
      },
      profile: {
        id: dbUser.id,
        user_id: dbUser.id,
        role: effectiveRole.toLowerCase(),
        full_name: dbUser.fullName,
        phone: dbUser.phone,
        has_seller_profile: !!dbUser.sellerProfile,
        is_active: true,
        created_at: dbUser.createdAt,
        updated_at: dbUser.updatedAt,
        seller_id: dbUser.sellerProfile?.id || null,
      },
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    // A non-HttpOnly flag cookie so the SPA can detect the active account type.
    response.cookies.set({
      name: 'auth_role',
      value: effectiveRole.toLowerCase(),
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    return response;
  } catch (error: any) {
    console.error('Error during database authentication login:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication.' },
      { status: 500 }
    );
  }
}

function buildRoles(dbUser: any): string[] {
  const roles: string[] = [];
  if (dbUser.email) {
    // Every identity row can act as a BUYER (buyer orders rely on the User record).
    roles.push('buyer');
  }
  if (dbUser.sellerProfile) {
    roles.push('seller');
  }
  if (dbUser.role === 'ADMIN') {
    roles.push('admin');
  }
  return roles;
}
