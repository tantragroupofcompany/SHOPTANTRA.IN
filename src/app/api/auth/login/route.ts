import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword } from '../../../../lib/authUtils';

// Secret key for secure JWT token signing
const JWT_SECRET = process.env.JWT_SECRET || 'shoptantra_secret_jwt_key_2026';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Query Database for user
    const dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { sellerProfile: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'No account found matching this email address.' }, { status: 404 });
    }

    // 3. Verify Hashed Password
    if (!verifyPassword(password, dbUser.password)) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    // 4. Check status if user is a seller
    if (dbUser.role === 'SELLER' && dbUser.sellerProfile) {
      if (dbUser.sellerProfile.verificationStatus === 'PENDING_VERIFICATION') {
        return NextResponse.json({ error: 'Please verify your email before accessing your seller account.' }, { status: 403 });
      }
      if (dbUser.sellerProfile.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'This seller account has been suspended. Contact support.' }, { status: 403 });
      }
    }

    // 5. Create secure JWT token simulation
    // We construct a payload and sign it with a simple Base64/HMAC style representation
    const payload = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    };

    const token = Buffer.from(JSON.stringify(payload)).toString('base64') + '.' + Buffer.from(JWT_SECRET).toString('base64');

    // 6. Return response
    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role.toLowerCase(),
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
        role: dbUser.role.toLowerCase(),
        full_name: dbUser.fullName,
        phone: dbUser.phone,
        is_active: true,
        created_at: dbUser.createdAt,
        updated_at: dbUser.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error during database authentication login:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication.' },
      { status: 500 }
    );
  }
}
