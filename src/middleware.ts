import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Check if a cookie name is PKCE-related.
 * Covers both Auth.js v5 (authjs.*) and legacy NextAuth v4 (next-auth.*) patterns.
 */
function isPkceCookie(cookieName: string): boolean {
  const lowerName = cookieName.toLowerCase();
  return (
    lowerName.includes('pkce') ||
    lowerName.includes('code_verifier') ||
    lowerName.includes('code-verifier') ||
    lowerName.includes('authjs.pkce') ||
    lowerName.includes('next-auth.pkce')
  );
}

/**
 * Middleware to handle authentication-related cookie issues.
 *
 * This middleware runs BEFORE the auth route handlers and:
 * 1. Detects PKCE cookies that could cause "pkceCodeVerifier could not be parsed" errors
 * 2. Deletes stale PKCE cookies from the response to clean up the browser
 *
 * This is necessary because:
 * - PKCE cookies from previous auth attempts may be encrypted with old AUTH_SECRET
 * - Auth.js tries to parse these cookies even when PKCE is disabled (checks: ["state"])
 * - The cookie stripping in the route handler may not catch all cases
 */
export function middleware(request: NextRequest) {
  const url = new URL(request.url);

  // Only process auth-related routes
  if (!url.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check for PKCE cookies
  const allCookies = request.cookies.getAll();
  const pkceCookies = allCookies.filter(c => isPkceCookie(c.name));

  if (pkceCookies.length === 0) {
    return NextResponse.next();
  }

  // Log detection of PKCE cookies (this runs before the route handler logging)
  console.log(`[MIDDLEWARE] Detected ${pkceCookies.length} PKCE cookie(s):`, pkceCookies.map(c => c.name));

  // Create response that will delete the PKCE cookies from the browser
  // This is a "belt and suspenders" approach - we delete them from the response
  // while the route handler strips them from the request
  const response = NextResponse.next();

  // Delete PKCE cookies by setting them with maxAge=0
  for (const cookie of pkceCookies) {
    console.log(`[MIDDLEWARE] Scheduling deletion of PKCE cookie: ${cookie.name}`);

    // Delete with multiple configurations to ensure removal across different cookie settings
    // Standard deletion
    response.cookies.set(cookie.name, '', {
      maxAge: 0,
      path: '/',
    });

    // Also try with secure flag for __Secure- prefixed cookies
    if (cookie.name.startsWith('__Secure-')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        secure: true,
        sameSite: 'lax',
      });
    }
  }

  return response;
}

// Configure middleware to only run on auth routes
export const config = {
  matcher: ['/api/auth/:path*'],
};
