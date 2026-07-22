import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from './middleware/index';

// In-memory rate limiting map (IP -> timestamps)
const rateLimitMap = new Map<string, number[]>();
const LIMIT = 100; // max requests
const WINDOW = 60 * 1000; // 1 minute window in ms

export async function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();

  // 1. SECURITY HEADERS
  // Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://images.pexels.com https://images.unsplash.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.razorpay.com;
    frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 2. RATE LIMITING FOR API PATHS
  if (path.startsWith('/api')) {
    const now = Date.now();
    let timestamps = rateLimitMap.get(ip) || [];
    
    // Filter timestamps outside current window
    timestamps = timestamps.filter(t => now - t < WINDOW);
    
    if (timestamps.length >= LIMIT) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);

    // 3. CSRF PROTECTION ON API POST/PUT/DELETE
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      const referer = request.headers.get('referer');
      
      // Basic domain validation
      if (origin && host) {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return new NextResponse(
            JSON.stringify({ error: 'CSRF validation failed. Invalid Origin.' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }

    // 4. ROLE-BASED ACCESS CONTROL (RBAC) FOR PROTECTED APIS
  if (
    path.startsWith('/api/founder') ||
    path.startsWith('/api/admin') ||
    path.startsWith('/api/management') ||
    path.startsWith('/api/corporate') ||
    path.startsWith('/api/seller') ||
    path.startsWith('/api/buyer')
  ) {
    if (path.startsWith('/api/founder')) {
      const guard = await requireRole(request, ['FOUNDER']);
      if (guard instanceof NextResponse) return guard;
    } else if (path.startsWith('/api/admin') || path.startsWith('/api/management')) {
      const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'ADMIN']);
      if (guard instanceof NextResponse) return guard;
    } else if (path.startsWith('/api/corporate')) {
      const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
      if (guard instanceof NextResponse) return guard;
    } else if (path.startsWith('/api/seller')) {
      const guard = await requireRole(request, ['SELLER', 'ADMIN', 'FOUNDER', 'CEO_MD']);
      if (guard instanceof NextResponse) return guard;
    } else if (path.startsWith('/api/buyer')) {
      const guard = await requireRole(request, ['BUYER', 'ADMIN', 'FOUNDER', 'CEO_MD']);
      if (guard instanceof NextResponse) return guard;
    }
  }

  return response;
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
