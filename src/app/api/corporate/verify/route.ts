import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret, normalizeCorporateRole } from '../../../../lib/corporateAuth';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  // Read cookies from the request
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const parts = c.trim().split('=');
      return [parts[0], parts.slice(1).join('=')];
    })
  );

  const token = cookies['auth_token'] || cookies['corporate_auth_token'];

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    // Canonicalise legacy CEO/MD aliases to the single stored role CEO_MD and
    // reject anyone who is not an executive. CORPORATE_ROLES in
    // lib/corporateAuth.ts is the single source of truth for this allow-list.
    const tokenRole = normalizeCorporateRole(payload.role);

    if (!tokenRole) {
      return NextResponse.json({ authenticated: false, error: 'Access Denied' }, { status: 403 });
    }

    // REVALIDATE AGAINST THE DATABASE.
    //
    // A "remember me" session lives up to 30 days, so the signed JWT alone
    // cannot tell us the account still exists, still has an executive role and
    // has not been switched off by an admin. This check makes a deactivated or
    // role-changed account lose its dashboards at the next guard render instead
    // of at token expiry. It runs AFTER the signature check, so it can only
    // ever narrow an already-valid session — never widen it.
    let role = tokenRole;
    if (payload.userId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(payload.userId) },
          select: { role: true, isActive: true },
        });
        if (!dbUser || dbUser.isActive === false) {
          return NextResponse.json(
            { authenticated: false, error: 'Account disabled' },
            { status: 403 }
          );
        }
        const storedRole = normalizeCorporateRole(dbUser.role);
        if (!storedRole) {
          return NextResponse.json({ authenticated: false, error: 'Access Denied' }, { status: 403 });
        }
        role = storedRole;
      } catch (dbErr: any) {
        // Fail OPEN on the lookup only, and never on the signature: the token
        // is still cryptographically valid, and a database outage must not
        // bounce every executive off the guard screen while the dashboard APIs
        // (which carry their own guards) are still deciding what to do. The
        // failure detail stays in the server log.
        console.error(
          '[corporate/verify] user revalidation skipped:',
          dbErr?.code || dbErr?.message
        );
      }
    }

    return NextResponse.json({
      authenticated: true,
      role,
      user: {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
        role,
      },
    });
  } catch (e) {
    return NextResponse.json({ authenticated: false, error: 'Invalid token' }, { status: 401 });
  }
}