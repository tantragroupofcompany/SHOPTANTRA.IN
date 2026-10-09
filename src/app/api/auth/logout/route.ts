import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 *
 * Server-side sign-out. The `auth_token` session cookie is HttpOnly, so the SPA
 * CANNOT delete it with `document.cookie` — the client-side "clear" that used to
 * run in AuthContext.signOut silently left a fully valid server session behind
 * after logout (any device with the cookie kept the caller's privileges until
 * the 1-hour expiry).
 *
 * This route only expires cookies and returns no data. It must stay reachable
 * with an expired/invalid token (mirrors /api/corporate/logout), so it performs
 * no authentication check — clearing a cookie that is already dead is a no-op.
 */
export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ success: true });

  response.cookies.set({ name: 'auth_token', value: '', httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/', maxAge: 0 });
  response.cookies.set({ name: 'auth_role', value: '', httpOnly: false, secure: isProduction, sameSite: 'lax', path: '/', maxAge: 0 });
  // A full SPA sign-out also clears the executive cookie when present. It is
  // HttpOnly too, so the client cannot clear it itself.
  response.cookies.set({ name: 'corporate_auth_token', value: '', httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/', maxAge: 0 });

  return response;
}
