import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret, normalizeCorporateRole } from '../lib/corporateAuth';

const CORPORATE_COOKIE = 'corporate_auth_token';
const AUTH_COOKIE = 'auth_token';

function getToken(request: NextRequest | Request) {
  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    const val = (request as any).cookies.get(CORPORATE_COOKIE)?.value || (request as any).cookies.get(AUTH_COOKIE)?.value;
    if (val) return val;
  }
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)(?:corporate_auth_token|auth_token)=([^;]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return undefined;
}

// Verify JWT with jose (WebCrypto) so this works in BOTH the Edge runtime
// (Next.js middleware) and the Node.js runtime (API route handlers).
// jsonwebtoken relies on Node-only crypto and fails at the edge, which
// caused all protected corporate/founder/admin API calls to return 401.
async function verifyToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as { role?: string; userId?: string; id?: string; sub?: string };
}

export async function requireAuth(request: NextRequest | Request) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized access. Please login.' }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token);
    const resolvedUserId = payload.userId || payload.id || payload.sub;
    return { role: normalizeCorporateRole(payload.role) ?? payload.role?.toUpperCase(), userId: resolvedUserId };
  } catch (e) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }
}

export async function requireRole(request: NextRequest | Request, allowedRoles: string[]) {
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

    const resolvedUserId = (payload as any).userId || (payload as any).id || (payload as any).sub;
    return { role, userId: resolvedUserId };
  } catch (e) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }
}