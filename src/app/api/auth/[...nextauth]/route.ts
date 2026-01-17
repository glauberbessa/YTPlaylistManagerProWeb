import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Strip PKCE cookies from the request to prevent "pkceCodeVerifier could not be parsed" error.
 *
 * Problem: Even with PKCE disabled (checks: ["state"]), NextAuth v5 still attempts to parse
 * existing PKCE cookies when they exist on the request. Stale PKCE cookies from previous
 * auth attempts (or when AUTH_SECRET changed) cannot be decrypted and cause this error.
 *
 * Solution: Remove PKCE-related cookies from the request before NextAuth processes it.
 * This ensures that callback requests don't fail due to stale/corrupt PKCE cookies.
 */
function stripPkceCookies(request: NextRequest): NextRequest {
  const url = new URL(request.url);
  const isCallback = url.pathname.includes('/callback') || url.searchParams.has('code');

  if (!isCallback) {
    return request;
  }

  // Get all cookies and filter out PKCE-related ones
  const cookies = request.cookies.getAll();
  const pkceCookieNames = cookies
    .filter(c => c.name.includes('pkce') || c.name.includes('code_verifier'))
    .map(c => c.name);

  if (pkceCookieNames.length === 0) {
    return request;
  }

  console.log(`[AUTH-PKCE-FIX] Stripping ${pkceCookieNames.length} PKCE cookie(s) from callback request:`, pkceCookieNames);

  // Rebuild the Cookie header without PKCE cookies
  const filteredCookies = cookies
    .filter(c => !c.name.includes('pkce') && !c.name.includes('code_verifier'))
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  // Create new headers with the filtered cookie string
  const newHeaders = new Headers(request.headers);
  if (filteredCookies) {
    newHeaders.set('cookie', filteredCookies);
  } else {
    newHeaders.delete('cookie');
  }

  // Create a new request with the modified headers
  const newRequest = new NextRequest(request.url, {
    method: request.method,
    headers: newHeaders,
    body: request.body,
    cache: request.cache,
    credentials: request.credentials,
    integrity: request.integrity,
    keepalive: request.keepalive,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    signal: request.signal,
  });

  return newRequest;
}

// Comprehensive auth debug logging
function logAuthRequest(request: NextRequest, action: string) {
  const url = new URL(request.url);
  const timestamp = new Date().toISOString();

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

  // Log complete debug info
  console.log(`\n${"=".repeat(80)}`);
  console.log(`[AUTH-DEBUG] ${timestamp} - ${action}`);
  console.log(`${"=".repeat(80)}`);
  console.log(`[AUTH-DEBUG] Request Details:`);
  console.log(`  - Method: ${request.method}`);
  console.log(`  - URL: ${url.toString()}`);
  console.log(`  - Pathname: ${url.pathname}`);
  console.log(`  - NextAuth Action: ${url.pathname.split('/').pop()}`);
  console.log(`[AUTH-DEBUG] Query Parameters:`, JSON.stringify(params, null, 2));
  console.log(`[AUTH-DEBUG] Cookies Present:`, JSON.stringify(cookies, null, 2));
  console.log(`[AUTH-DEBUG] Headers:`, JSON.stringify(headers, null, 2));
  console.log(`[AUTH-DEBUG] Environment Check:`);
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - VERCEL: ${process.env.VERCEL || 'not set'}`);
  console.log(`  - NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);
  console.log(`  - AUTH_URL: ${process.env.AUTH_URL || 'not set'}`);
  console.log(`  - Has GOOGLE_CLIENT_ID: ${!!process.env.GOOGLE_CLIENT_ID}`);
  console.log(`  - Has AUTH_SECRET: ${!!process.env.AUTH_SECRET}`);
  console.log(`  - Has NEXTAUTH_SECRET: ${!!process.env.NEXTAUTH_SECRET}`);
  console.log(`${"=".repeat(80)}\n`);

  return { timestamp, cookies, headers, params };
}

function logAuthResponse(
  response: Response | NextResponse,
  debugInfo: { timestamp: string; cookies: Record<string, string>; headers: Record<string, string>; params: Record<string, string> },
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

  console.log(`\n${"=".repeat(80)}`);
  console.log(`[AUTH-DEBUG] ${debugInfo.timestamp} - ${action} RESPONSE`);
  console.log(`${"=".repeat(80)}`);
  console.log(`[AUTH-DEBUG] Response Details:`);
  console.log(`  - Status: ${response.status}`);
  console.log(`  - Status Text: ${response.statusText || 'N/A'}`);
  console.log(`  - Redirect Location: ${response.headers.get('location') || 'none'}`);
  console.log(`[AUTH-DEBUG] Response Cookies:`, JSON.stringify(responseCookies, null, 2));
  console.log(`${"=".repeat(80)}\n`);
}

async function logAuthError(error: unknown, debugInfo: ReturnType<typeof logAuthRequest>, action: string) {
  console.log(`\n${"!".repeat(80)}`);
  console.log(`[AUTH-ERROR] ${debugInfo.timestamp} - ${action} FAILED`);
  console.log(`${"!".repeat(80)}`);

  if (error instanceof Error) {
    console.log(`[AUTH-ERROR] Error Name: ${error.name}`);
    console.log(`[AUTH-ERROR] Error Message: ${error.message}`);
    console.log(`[AUTH-ERROR] Error Stack:\n${error.stack}`);

    // Check for specific PKCE error
    if (error.message.includes('pkceCodeVerifier') || error.name === 'InvalidCheck') {
      console.log(`[AUTH-ERROR] *** PKCE ERROR DETECTED ***`);
      console.log(`[AUTH-ERROR] This error typically occurs when:`);
      console.log(`  1. A pkceCodeVerifier cookie exists from a previous auth attempt`);
      console.log(`  2. The cookie value cannot be decrypted (AUTH_SECRET changed)`);
      console.log(`  3. The cookie is from when PKCE was enabled`);
      console.log(`[AUTH-ERROR] Request Cookies at time of error:`, JSON.stringify(debugInfo.cookies, null, 2));
      console.log(`[AUTH-ERROR] Suggested fix: Clear browser cookies for this domain`);
    }
  } else {
    console.log(`[AUTH-ERROR] Unknown error type:`, error);
  }

  console.log(`[AUTH-ERROR] Full Debug Context:`);
  console.log(`  - Cookies:`, JSON.stringify(debugInfo.cookies, null, 2));
  console.log(`  - Headers:`, JSON.stringify(debugInfo.headers, null, 2));
  console.log(`  - Params:`, JSON.stringify(debugInfo.params, null, 2));
  console.log(`${"!".repeat(80)}\n`);
}

// Wrap GET handler with logging and PKCE cookie stripping
export async function GET(request: NextRequest) {
  const debugInfo = logAuthRequest(request, 'GET');

  try {
    // Strip PKCE cookies from callback requests to prevent parsing errors
    const sanitizedRequest = stripPkceCookies(request);
    const response = await handlers.GET(sanitizedRequest);
    logAuthResponse(response, debugInfo, 'GET');
    return response;
  } catch (error) {
    await logAuthError(error, debugInfo, 'GET');
    throw error;
  }
}

// Wrap POST handler with logging and PKCE cookie stripping
export async function POST(request: NextRequest) {
  const debugInfo = logAuthRequest(request, 'POST');

  try {
    // Strip PKCE cookies to prevent parsing errors
    const sanitizedRequest = stripPkceCookies(request);
    const response = await handlers.POST(sanitizedRequest);
    logAuthResponse(response, debugInfo, 'POST');
    return response;
  } catch (error) {
    await logAuthError(error, debugInfo, 'POST');
    throw error;
  }
}
