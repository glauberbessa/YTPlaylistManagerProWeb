import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { logger, AuthFlowTracker, generateTraceId, setTraceId, clearTraceId } from "@/lib/logger";

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
    // Auth.js v5 patterns
    lowerName.includes('authjs.pkce') ||
    // Legacy NextAuth v4 patterns
    lowerName.includes('next-auth.pkce')
  );
}

/**
 * Strip PKCE cookies from the request to prevent "pkceCodeVerifier could not be parsed" error.
 *
 * Problem: Even with PKCE disabled (checks: ["state"]), Auth.js v5 still attempts to parse
 * existing PKCE cookies when they exist on the request. Stale PKCE cookies from previous
 * auth attempts (or when AUTH_SECRET changed) cannot be decrypted and cause this error.
 *
 * The error "InvalidCheck: pkceCodeVerifier value could not be parsed" occurs when:
 * 1. A PKCE cookie exists from a previous auth attempt
 * 2. The AUTH_SECRET changed, making old encrypted cookies unreadable
 * 3. The cookie was created when PKCE was enabled but now PKCE is disabled
 *
 * Solution: Remove ALL PKCE-related cookies from the request before Auth.js processes it.
 * This includes cookies with both authjs.* and next-auth.* prefixes.
 *
 * IMPORTANT: NextRequest cloning doesn't properly re-parse cookies from modified headers.
 * We need to use the native Request API and wrap it appropriately.
 */
function stripPkceCookies(request: NextRequest): Request {
  const url = new URL(request.url);
  const isCallback = url.pathname.includes('/callback') || url.searchParams.has('code');

  // Log all cookies for debugging on callback requests
  if (isCallback) {
    const allCookies = request.cookies.getAll();
    logger.info("AUTH_PKCE", "Callback request received - analyzing cookies", {
      pathname: url.pathname,
      totalCookies: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
    });
  }

  // Get all cookies and filter out PKCE-related ones
  const cookies = request.cookies.getAll();
  const pkceCookieNames = cookies
    .filter(c => isPkceCookie(c.name))
    .map(c => c.name);

  if (pkceCookieNames.length === 0) {
    if (isCallback) {
      logger.info("AUTH_PKCE", "No PKCE cookies found to strip", {
        pathname: url.pathname,
      });
    }
    return request;
  }

  logger.info("AUTH_PKCE", `Stripping ${pkceCookieNames.length} PKCE cookie(s) from request`, {
    cookieNames: pkceCookieNames,
    pathname: url.pathname,
    isCallback,
  });

  // Rebuild the Cookie header without PKCE cookies
  const filteredCookies = cookies
    .filter(c => !isPkceCookie(c.name))
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  // Create new headers with the filtered cookie string
  // Use the native Headers API for proper cookie handling
  const newHeaders = new Headers();
  request.headers.forEach((value, key) => {
    // Skip the cookie header - we'll set it manually
    if (key.toLowerCase() !== 'cookie') {
      newHeaders.set(key, value);
    }
  });

  // Set the filtered cookies (or omit if empty)
  if (filteredCookies) {
    newHeaders.set('cookie', filteredCookies);
  }

  // Use the native Request API instead of NextRequest
  // This ensures cookies are properly parsed from the new headers
  // Auth.js handlers accept standard Request objects
  const cleanRequest = new Request(request.url, {
    method: request.method,
    headers: newHeaders,
    body: request.body,
    // Note: Not all properties are transferable, but these are the critical ones
  });

  logger.info("AUTH_PKCE", "Created clean request without PKCE cookies", {
    originalCookieCount: cookies.length,
    newCookieCount: filteredCookies ? filteredCookies.split(';').length : 0,
    strippedCount: pkceCookieNames.length,
  });

  return cleanRequest;
}

// Comprehensive auth debug logging
function logAuthRequest(request: NextRequest, action: string) {
  const url = new URL(request.url);
  const traceId = generateTraceId();
  setTraceId(traceId);

  // Get all cookies
  const cookies: Record<string, string> = {};
  request.cookies.getAll().forEach((cookie) => {
    // Mask sensitive cookie values but show they exist
    if (cookie.name.includes('session') || cookie.name.includes('csrf')) {
      cookies[cookie.name] = `[EXISTS:${cookie.value.length}chars]`;
    } else if (cookie.name.includes('pkce') || cookie.name.includes('code_verifier')) {
      // Full details for PKCE cookies since they're the problem
      cookies[cookie.name] = `[VALUE:${cookie.value.substring(0, 50)}...len:${cookie.value.length}]`;
    } else if (cookie.name.includes('state')) {
      cookies[cookie.name] = `[EXISTS:${cookie.value.length}chars]`;
    } else {
      cookies[cookie.name] = cookie.value.length > 20
        ? `${cookie.value.substring(0, 20)}...`
        : cookie.value;
    }
  });

  // Get relevant headers
  const headers: Record<string, string> = {};
  const relevantHeaders = [
    'host', 'origin', 'referer', 'user-agent',
    'x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-for',
    'x-vercel-deployment-url', 'x-vercel-id'
  ];
  relevantHeaders.forEach((name) => {
    const value = request.headers.get(name);
    if (value) {
      headers[name] = value;
    }
  });

  // Get query parameters
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    if (key === 'code') {
      params[key] = `[EXISTS:${value.length}chars]`;
    } else if (key === 'state') {
      params[key] = `[EXISTS:${value.length}chars]`;
    } else {
      params[key] = value;
    }
  });

  // Determine auth action type
  const authAction = url.pathname.split('/').pop();
  const isCallback = authAction === 'callback' || url.searchParams.has('code');
  const isSignIn = authAction === 'signin';
  const isSignOut = authAction === 'signout';

  logger.info("AUTH_ROUTE", `${action} Request - ${authAction}`, {
    traceId,
    method: request.method,
    url: url.toString(),
    pathname: url.pathname,
    authAction,
    isCallback,
    isSignIn,
    isSignOut,
    queryParams: params,
    cookies,
    headers,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasAuthUrl: !!process.env.AUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    },
  });

  return { traceId, cookies, headers, params, isCallback };
}

function logAuthResponse(
  response: Response | NextResponse,
  debugInfo: { traceId: string; cookies: Record<string, string>; headers: Record<string, string>; params: Record<string, string>; isCallback: boolean },
  action: string
) {
  // Get response cookies
  const responseCookies: Record<string, string> = {};
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    // Parse set-cookie header
    setCookieHeader.split(',').forEach((cookie) => {
      const match = cookie.match(/^([^=]+)=/);
      if (match) {
        const name = match[1].trim();
        responseCookies[name] = cookie.includes('Max-Age=0') ? '[DELETED]' : '[SET]';
      }
    });
  }

  const redirectLocation = response.headers.get('location');
  const isRedirect = response.status >= 300 && response.status < 400;

  logger.info("AUTH_ROUTE", `${action} Response`, {
    traceId: debugInfo.traceId,
    status: response.status,
    statusText: response.statusText || 'N/A',
    isRedirect,
    redirectLocation,
    responseCookies,
    isCallback: debugInfo.isCallback,
  });

  // Log successful callback completion separately as it's important
  if (debugInfo.isCallback && isRedirect && redirectLocation) {
    logger.info("AUTH_ROUTE", "OAuth callback completed - redirecting user", {
      traceId: debugInfo.traceId,
      redirectTo: redirectLocation,
      cookiesSet: Object.keys(responseCookies).filter(k => responseCookies[k] === '[SET]'),
    });
  }

  clearTraceId();
}

async function logAuthError(error: unknown, debugInfo: ReturnType<typeof logAuthRequest>, action: string) {
  const isPkceError = error instanceof Error &&
    (error.message.includes('pkceCodeVerifier') || error.name === 'InvalidCheck');

  if (isPkceError) {
    logger.critical("AUTH_PKCE", "PKCE Error Detected - This is likely causing auth failures", error as Error, {
      traceId: debugInfo.traceId,
      explanation: [
        "A pkceCodeVerifier cookie exists from a previous auth attempt",
        "The cookie value cannot be decrypted (AUTH_SECRET may have changed)",
        "The cookie is from when PKCE was enabled",
      ],
      suggestedFix: "Clear browser cookies for this domain or wait for cookies to expire",
      requestCookies: debugInfo.cookies,
    });
  } else if (error instanceof Error) {
    logger.error("AUTH_ROUTE", `${action} Failed`, error, {
      traceId: debugInfo.traceId,
      cookies: debugInfo.cookies,
      headers: debugInfo.headers,
      params: debugInfo.params,
    });
  } else {
    logger.error("AUTH_ROUTE", `${action} Failed with unknown error`, undefined, {
      traceId: debugInfo.traceId,
      error: String(error),
      cookies: debugInfo.cookies,
      headers: debugInfo.headers,
      params: debugInfo.params,
    });
  }

  clearTraceId();
}

/**
 * Check if an error is a PKCE-related error.
 */
function isPkceError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  const name = error.name?.toLowerCase() || '';
  return (
    message.includes('pkcecod') ||
    message.includes('pkce') ||
    message.includes('code_verifier') ||
    message.includes('code verifier') ||
    name === 'invalidcheck'
  );
}

/**
 * Create a response that clears PKCE cookies from the client browser.
 * This is called when a PKCE error occurs to prevent future errors.
 */
function createPkceClearingRedirectResponse(request: NextRequest): NextResponse {
  const url = new URL(request.url);
  const isCallback = url.pathname.includes('/callback') || url.searchParams.has('code');

  // Determine redirect destination
  // If this is a callback, redirect to login with error
  // Otherwise redirect to the current auth endpoint without PKCE cookies
  let redirectUrl: string;
  if (isCallback) {
    redirectUrl = '/login?error=AuthenticationError';
  } else {
    redirectUrl = url.pathname;
  }

  const response = NextResponse.redirect(new URL(redirectUrl, request.url));

  // Clear all known PKCE cookie variations
  const cookiesToClear = [
    // Auth.js v5 patterns
    'authjs.pkce.code_verifier',
    '__Secure-authjs.pkce.code_verifier',
    '__Host-authjs.pkce.code_verifier',
    // NextAuth v4 patterns
    'next-auth.pkce.code_verifier',
    '__Secure-next-auth.pkce.code_verifier',
    '__Host-next-auth.pkce.code_verifier',
    // Additional patterns that might exist
    'authjs.pkce',
    '__Secure-authjs.pkce',
  ];

  for (const cookieName of cookiesToClear) {
    // Delete with various configurations to ensure removal
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      path: '/',
      expires: new Date(0),
    });
    // Also try with secure settings for __Secure- prefixed cookies
    if (cookieName.startsWith('__Secure-') || cookieName.startsWith('__Host-')) {
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
        expires: new Date(0),
        secure: true,
        sameSite: 'lax',
      });
    }
  }

  logger.info("AUTH_PKCE", "Created PKCE-clearing redirect response", {
    redirectUrl,
    clearedCookies: cookiesToClear.length,
  });

  return response;
}

/**
 * Add PKCE cookie deletion headers to an existing response.
 */
function addPkceClearingHeaders(response: Response | NextResponse, request: NextRequest): NextResponse {
  // Get PKCE cookies from the request
  const pkceCookies = request.cookies.getAll().filter(c => isPkceCookie(c.name));

  if (pkceCookies.length === 0) {
    return response instanceof NextResponse ? response : NextResponse.json(null, { status: response.status, headers: response.headers });
  }

  // Clone response and add cookie clearing headers
  const newResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  // Clear each PKCE cookie found
  for (const cookie of pkceCookies) {
    newResponse.cookies.set(cookie.name, '', {
      maxAge: 0,
      path: '/',
      expires: new Date(0),
    });
    logger.info("AUTH_PKCE", `Clearing PKCE cookie from response: ${cookie.name}`);
  }

  return newResponse;
}

// Wrap GET handler with logging, PKCE cookie stripping, and error recovery
export async function GET(request: NextRequest) {
  const debugInfo = logAuthRequest(request, 'GET');

  try {
    // Strip PKCE cookies from callback requests to prevent parsing errors
    // Cast to NextRequest for type compatibility - Auth.js handlers accept standard Request objects
    const sanitizedRequest = stripPkceCookies(request) as NextRequest;
    const response = await handlers.GET(sanitizedRequest);

    // Add PKCE clearing headers to the response to prevent future issues
    const enhancedResponse = addPkceClearingHeaders(response, request);

    logAuthResponse(enhancedResponse, debugInfo, 'GET');
    return enhancedResponse;
  } catch (error) {
    await logAuthError(error, debugInfo, 'GET');

    // If this is a PKCE error, return a response that clears the cookies
    // and redirects the user to retry authentication
    if (isPkceError(error)) {
      logger.info("AUTH_PKCE", "Caught PKCE error, returning cookie-clearing redirect", {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return createPkceClearingRedirectResponse(request);
    }

    throw error;
  }
}

// Wrap POST handler with logging, PKCE cookie stripping, and error recovery
export async function POST(request: NextRequest) {
  const debugInfo = logAuthRequest(request, 'POST');

  try {
    // Strip PKCE cookies to prevent parsing errors
    // Cast to NextRequest for type compatibility - Auth.js handlers accept standard Request objects
    const sanitizedRequest = stripPkceCookies(request) as NextRequest;
    const response = await handlers.POST(sanitizedRequest);

    // Add PKCE clearing headers to the response
    const enhancedResponse = addPkceClearingHeaders(response, request);

    logAuthResponse(enhancedResponse, debugInfo, 'POST');
    return enhancedResponse;
  } catch (error) {
    await logAuthError(error, debugInfo, 'POST');

    // If this is a PKCE error, return a response that clears the cookies
    if (isPkceError(error)) {
      logger.info("AUTH_PKCE", "Caught PKCE error, returning cookie-clearing redirect", {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return createPkceClearingRedirectResponse(request);
    }

    throw error;
  }
}
