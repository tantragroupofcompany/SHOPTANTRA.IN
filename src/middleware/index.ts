import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret, normalizeCorporateRole } from '../lib/corporateAuth';

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
  const secret = getJwtSecret();
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
    return { role: normalizeCorporateRole(payload.role) ?? payload.role?.toUpperCase(), userId: payload.userId };
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
    // Canonicalise legacy CEO/MD aliases to the single stored role CEO_MD so an
    // executive token is never rejected purely because of role-spelling drift.
    const role = normalizeCorporateRole(payload.role) ?? payload.role?.toUpperCase();

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Access Denied – You do not have permission to access this area.' }, { status: 403 });
    }

    return { role, userId: (payload as any).userId };
  } catch (e) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }
}