import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword, hashPasswordBcrypt } from '../../../../lib/authUtils';
import { SignJWT } from 'jose';

const EXECUTIVE_ACCOUNTS = [
  {
    username: 'founder_2027',
    email: 'founder@shoptantra.in',
    passwordPlain: 'FOUNDER@2027',
    role: 'FOUNDER',
    fullName: 'Founder',
  },
  {
    username: 'ceo_2027',
    email: 'ceo@shoptantra.in',
    passwordPlain: 'CEO@2027',
    role: 'CEO_MD',
    fullName: 'CEO & MD',
  },
  {
    username: 'chairman_2027',
    email: 'chairman@shoptantra.in',
    passwordPlain: 'CHAIRMAN@2027',
    role: 'CHAIRMAN',
    fullName: 'Chairman',
  },
];

const HASHED_PASSWORDS: Record<string, string> = {};

// Hash all passwords once at module load
for (const exec of EXECUTIVE_ACCOUNTS) {
  HASHED_PASSWORDS[exec.role] = hashPasswordBcrypt(exec.passwordPlain);
}

/**
 * Ensures the username column exists on the User table (production fix).
 * Uses raw SQL so it works even if Prisma hasn't run a migration.
 */
async function ensureUsernameColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT UNIQUE;`
    );
    console.log('✓ Ensured username column exists on User table');
  } catch (e: any) {
    // Column might already exist or table name varies
    console.log('Note: username column check:', e.message);
  }
}

/**
 * Creates or updates the three executive accounts if they don't exist.
 */
async function ensureExecutiveAccounts() {
  await ensureUsernameColumn();

  for (const exec of EXECUTIVE_ACCOUNTS) {
    const hashedPw = HASHED_PASSWORDS[exec.role];

    // Check if an executive account with this email already exists (regardless of username)
    const existingByRole = await prisma.user.findFirst({
      where: { role: exec.role },
    });

    if (existingByRole) {
      // Update with latest username + password if needed
      const needsUpdate =
        existingByRole.username !== exec.username ||
        !verifyPassword(exec.passwordPlain, existingByRole.password);

      if (needsUpdate) {
        await prisma.user.update({
          where: { id: existingByRole.id },
          data: {
            username: exec.username,
            password: hashedPw,
            fullName: exec.fullName,
          },
        });
        console.log(`✓ Updated ${exec.role} account`);
      }
      continue;
    }

    // Try to find by username (in case column exists but no role match)
    let existingByUsername = null;
    try {
      existingByUsername = await prisma.user.findUnique({
        where: { username: exec.username },
      });
    } catch {
      // username column might not exist yet
    }

    if (existingByUsername) {
      await prisma.user.update({
        where: { id: existingByUsername.id },
        data: {
          password: hashedPw,
          role: exec.role,
          fullName: exec.fullName,
        },
      });
      console.log(`✓ Updated ${exec.role} account (found by username)`);
      continue;
    }

    // Try to find by email
    const existingByEmail = await prisma.user.findUnique({
      where: { email: exec.email },
    });

    if (existingByEmail) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          username: exec.username,
          password: hashedPw,
          role: exec.role,
          fullName: exec.fullName,
        },
      });
      console.log(`✓ Updated ${exec.role} account (found by email)`);
      continue;
    }

    // Create new executive account
    try {
      await prisma.user.create({
        data: {
          username: exec.username,
          email: exec.email,
          password: hashedPw,
          role: exec.role,
          fullName: exec.fullName,
        },
      });
      console.log(`✓ Created ${exec.role} account`);
    } catch (createErr: any) {
      console.error(`Failed to create ${exec.role}:`, createErr.message);
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const trimmedUsername = username.toLowerCase().trim();

    // Step 1: Auto-seed executive accounts if they don't exist
    await ensureExecutiveAccounts();

    // Step 2: Find user — try username first, then email as fallback
    let dbUser = null;

    try {
      dbUser = await prisma.user.findUnique({
        where: { username: trimmedUsername },
      });
    } catch {
      // username column may not exist in production yet — fall back
    }

    if (!dbUser) {
      try {
        dbUser = await prisma.user.findUnique({
          where: { email: trimmedUsername },
        });
      } catch {
        // email lookup failed
      }
    }

    // Step 2b: If still not found, check if they might have typed a role name
    if (!dbUser) {
      const roleMap: Record<string, string> = {
        founder: 'FOUNDER',
        ceo: 'CEO_MD',
        'ceo & md': 'CEO_MD',
        chairman: 'CHAIRMAN',
      };
      const possibleRole = roleMap[trimmedUsername];
      if (possibleRole) {
        dbUser = await prisma.user.findFirst({
          where: { role: possibleRole },
        });
      }
    }

    if (!dbUser) {
      console.log(`Login failed: user not found for "${trimmedUsername}"`);
      return NextResponse.json({
        error: 'User not found',
        detail: `No executive account found with username "${trimmedUsername}".`,
      }, { status: 401 });
    }

    // Step 3: Verify password — supports bcrypt, pbkdf2, and plaintext
    let passwordValid = false;
    try {
      passwordValid = verifyPassword(password, dbUser.password);
    } catch (pwErr: any) {
      console.error('Password verification threw:', pwErr);
    }

    if (!passwordValid) {
      console.log(`Login failed: wrong password for "${trimmedUsername}"`);
      return NextResponse.json({
        error: 'Wrong password',
        detail: 'The password you entered is incorrect.',
      }, { status: 401 });
    }

    // Step 4: Verify corporate role
    const allowedCorporateRoles = ['FOUNDER', 'CEO_MD', 'CHAIRMAN'];
    if (!allowedCorporateRoles.includes(dbUser.role)) {
      console.log(`Login failed: role ${dbUser.role} not allowed`);
      return NextResponse.json({
        error: 'Access Denied',
        detail: `Your account (role: ${dbUser.role}) does not have executive privileges.`,
      }, { status: 403 });
    }

    // Step 5: Create session JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'shoptantra_super_secret_jwt_key_2026');
    const token = await new SignJWT({
      userId: dbUser.id,
      email: dbUser.email,
      username: dbUser.username || trimmedUsername,
      role: dbUser.role,
      type: 'corporate',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(secret);

    // Step 6: Determine redirect based on role
    const dashboardMap: Record<string, string> = {
      FOUNDER: '/founder/dashboard',
      CEO_MD: '/ceo/dashboard',
      CHAIRMAN: '/chairman/dashboard',
    };
    const redirectTo = dashboardMap[dbUser.role] || '/';

    const response = NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username || null,
        role: dbUser.role,
        fullName: dbUser.fullName,
      },
      token,
    });

    // Step 7: Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 8 * 60 * 60,
      path: '/',
    };

    response.cookies.set('corporate_auth_token', token, cookieOptions);
    response.cookies.set('auth_token', token, cookieOptions);

    console.log(`✓ ${dbUser.role} login successful: ${trimmedUsername}`);
    return response;
  } catch (error: any) {
    console.error('Corporate login error:', error);
    return NextResponse.json({
      error: 'Login failed',
      detail: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.',
    }, { status: 500 });
  }
}