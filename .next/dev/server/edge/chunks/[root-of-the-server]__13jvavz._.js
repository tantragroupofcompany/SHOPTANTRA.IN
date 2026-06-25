(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__13jvavz._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
// In-memory rate limiting map (IP -> timestamps)
const rateLimitMap = new Map();
const LIMIT = 100; // max requests
const WINDOW = 60 * 1005; // 1 minute window in ms
function middleware(request) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const path = request.nextUrl.pathname;
    const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
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
        timestamps = timestamps.filter((t)=>now - t < WINDOW);
        if (timestamps.length >= LIMIT) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"](JSON.stringify({
                error: 'Too many requests. Please try again later.'
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        timestamps.push(now);
        rateLimitMap.set(ip, timestamps);
        // 3. CSRF PROTECTION ON API POST/PUT/DELETE
        if ([
            'POST',
            'PUT',
            'DELETE',
            'PATCH'
        ].includes(request.method)) {
            const origin = request.headers.get('origin');
            const host = request.headers.get('host');
            const referer = request.headers.get('referer');
            // Basic domain validation
            if (origin && host) {
                const originUrl = new URL(origin);
                if (originUrl.host !== host) {
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"](JSON.stringify({
                        error: 'CSRF validation failed. Invalid Origin.'
                    }), {
                        status: 403,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }
            }
        }
    }
    return response;
}
const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__13jvavz._.js.map