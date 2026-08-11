import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const CORPORATE_COOKIE = 'corporate_auth_token';
const AUTH_COOKIE = 'auth_token';

function getToken(request: NextRequest) {
  return request.cookies.get(CORPORATE_COOKIE)?.value || request.cookies.get(AUTH_COOKIE)?.value;
}

// Verify JWT with jose (WebCrypto) so this works in BOTH the Edge runtime
// (Next.js middleware) and the Node.js runtime (API route handlers).
// jsonwebtoken relies on Node-only crypto and fails at the edge, which
// caused all protected corporate/founder/admin API calls to return 401.
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'shoptantra_super_secret_jwt_key_2026');
  const { payload } = await jwtVerify(token, secret);
  return payload as { role?: string; userId?: string };
}

export async function requireAuth(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized access. Please login.' }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token);
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
    const payload = await verifyToken(token);
    const role = payload.role?.toUpperCase();

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Access Denied – You do not have permission to access this area.' }, { status: 403 });
    }

    return { role, userId: (payload as any).userId };
  } catch (e) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }
}