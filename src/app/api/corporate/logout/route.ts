import { NextResponse } from 'next/server';

/**
 * POST /api/corporate/logout
 *
 * Signs the executive out server-side.
 *
 * WHY THIS EXISTS: the corporate session cookies (`corporate_auth_token` and
 * `auth_token`) are issued by /api/corporate/login with `httpOnly: true` — which
 * is correct, because it stops script from reading the JWT. But an HTTP-only
 * cookie is also invisible to and undeletable by `document.cookie`, so the old
 * client-side sign-out
 *
 *     document.cookie = 'auth_token=; path=/; max-age=0';
 *
 * silently did nothing. Pressing "Sign Out" left the executive JWT in the
 * browser for its full 8 hour max-age, so the next person to use that browser
 * was still authenticated as the Founder / Chairman / CEO.
 *
 * Only the server can expire an HTTP-only cookie, hence this route. It expires
 * both cookies with the same attributes they were set with (that is what makes
 * the browser drop them) and always reports success, including for an already
 * expired or absent session — a user must always be able to sign out.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  const clear = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };

  response.cookies.set('corporate_auth_token', '', clear);
  response.cookies.set('auth_token', '', clear);

  return response;
}

// A stray GET should still clear the session rather than 405 and leave the
// cookies in place.
export async function GET() {
  return POST();
}
