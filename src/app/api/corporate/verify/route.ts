import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

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
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'shoptantra_super_secret_jwt_key_2026');
    const { payload } = await jwtVerify(token, secret);

    const role = (payload.role as string)?.toUpperCase();
    const allowedRoles = ['FOUNDER', 'CEO_MD', 'CHAIRMAN'];

    if (!allowedRoles.includes(role)) {
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