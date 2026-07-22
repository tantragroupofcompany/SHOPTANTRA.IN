import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CORPORATE_COOKIE = 'corporate_auth_token';
const AUTH_COOKIE = 'auth_token';

function getToken(request: NextRequest) {
  return request.cookies.get(CORPORATE_COOKIE)?.value || request.cookies.get(AUTH_COOKIE)?.value;
}

export async function requireAuth(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized access. Please login.' }, { status: 401 });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { role?: string; userId?: string };
    return { role: payload.role?.toUpperCase(), userId: payload.userId };
  } catch (e) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }
}

export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized access. Please login.' }, { status: 401 });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { role?: string };
    const role = payload.role?.toUpperCase();

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Access Denied – You do not have permission to access this area.' }, { status: 403 });
    }

    return { role, userId: (payload as any).userId };
  } catch (e) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }
}