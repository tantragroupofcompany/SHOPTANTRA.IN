import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret, normalizeCorporateRole } from '../../../../lib/corporateAuth';

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
    const role = normalizeCorporateRole(payload.role);

    if (!role) {
      return NextResponse.json({ authenticated: false, error: 'Access Denied' }, { status: 403 });
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