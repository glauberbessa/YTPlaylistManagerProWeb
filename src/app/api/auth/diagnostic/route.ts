import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStoredLogs,
  getLogSummary,
  logger,
  LogCategory,
  LogLevel,
} from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Comprehensive diagnostic endpoint for debugging authentication issues
 *
 * GET /api/auth/diagnostic
 *
 * Query parameters:
 * - logs: "true" to include recent logs
 * - category: Filter logs by category (AUTH, GOOGLE_OAUTH, YOUTUBE_API, etc.)
 * - level: Minimum log level (debug, info, warn, error, critical)
 * - limit: Number of logs to return (default: 50)
 * - full: "true" to include all diagnostic info (logs, db status, env check)
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const includeLogs = url.searchParams.get("logs") === "true";
  const category = url.searchParams.get("category") as LogCategory | null;
  const level = url.searchParams.get("level") as LogLevel | null;
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const fullDiagnostic = url.searchParams.get("full") === "true";

  logger.info("API", "Diagnostic endpoint called", {
    includeLogs,
    category,
    level,
    limit,
    fullDiagnostic,
  });

  const diagnostic: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    requestId: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
  };

  // 1. Environment Check
  diagnostic.environment = {
    NODE_ENV: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV || null,
    vercelUrl: process.env.VERCEL_URL || null,
    runtime: typeof EdgeRuntime !== "undefined" ? "edge" : "nodejs",
    envVars: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "set" : "missing",
      AUTH_URL: process.env.AUTH_URL ? "set" : "missing",
      AUTH_SECRET: process.env.AUTH_SECRET ? "set" : "missing",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "missing",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "set" : "missing",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "set" : "missing",
      DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
    },
    // Check for common URL configuration issues
    urlAnalysis: analyzeUrls(),
  };

  // 2. Request Info
  diagnostic.request = {
    url: url.toString(),
    method: "GET",
    headers: {
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      "x-forwarded-host": request.headers.get("x-forwarded-host"),
      "x-forwarded-proto": request.headers.get("x-forwarded-proto"),
      "x-forwarded-for": request.headers.get("x-forwarded-for"),
      "x-vercel-id": request.headers.get("x-vercel-id"),
      "x-vercel-deployment-url": request.headers.get("x-vercel-deployment-url"),
    },
    cookies: analyzeCookies(request),
  };

  // 3. Session Check
  try {
    const session = await auth();
    diagnostic.session = {
      exists: !!session,
      user: session?.user
        ? {
            hasId: !!session.user.id,
            id: session.user.id || null,
            hasEmail: !!session.user.email,
            email: session.user.email || null,
            hasName: !!session.user.name,
            hasImage: !!session.user.image,
            hasYoutubeChannelId: !!session.user.youtubeChannelId,
            youtubeChannelId: session.user.youtubeChannelId || null,
          }
        : null,
      accessToken: session?.accessToken
        ? {
            exists: true,
            length: session.accessToken.length,
            preview: `${session.accessToken.substring(0, 20)}...`,
          }
        : { exists: false },
    };

    // Test if access token can be used to make API calls
    if (session?.accessToken) {
      diagnostic.tokenTest = await testAccessToken(session.accessToken);
    }
  } catch (error) {
    diagnostic.session = {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    };
  }

  // 4. Database Check
  if (fullDiagnostic) {
    try {
      const dbStatus = await checkDatabaseStatus();
      diagnostic.database = dbStatus;
    } catch (error) {
      diagnostic.database = {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // 5. Log Summary (always include)
  diagnostic.logSummary = getLogSummary();

  // 6. Recent Logs (if requested)
  if (includeLogs || fullDiagnostic) {
    diagnostic.recentLogs = getStoredLogs(
      category || undefined,
      level || undefined,
      limit
    );
  }

  // 7. Auth Flow Checklist
  diagnostic.authFlowChecklist = generateAuthChecklist(diagnostic);

  return NextResponse.json(diagnostic, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

/**
 * Analyze URL configuration for common issues
 */
function analyzeUrls(): Record<string, unknown> {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const authUrl = process.env.AUTH_URL;
  const vercelUrl = process.env.VERCEL_URL;

  const analysis: Record<string, unknown> = {
    configuredUrls: {
      NEXTAUTH_URL: nextAuthUrl || null,
      AUTH_URL: authUrl || null,
      VERCEL_URL: vercelUrl || null,
    },
    issues: [],
  };

  const issues: string[] = [];

  // Check for missing URLs
  if (!nextAuthUrl && !authUrl) {
    issues.push(
      "Neither NEXTAUTH_URL nor AUTH_URL is set. This can cause callback URL mismatches."
    );
  }

  // Check for localhost in production
  if (process.env.VERCEL && nextAuthUrl?.includes("localhost")) {
    issues.push(
      "NEXTAUTH_URL contains 'localhost' but app is running on Vercel. This will cause OAuth callback failures."
    );
  }

  // Check for protocol issues
  if (nextAuthUrl && !nextAuthUrl.startsWith("https://") && process.env.VERCEL) {
    issues.push(
      "NEXTAUTH_URL does not use HTTPS. OAuth callbacks may fail due to secure cookie requirements."
    );
  }

  // Check for trailing slash issues
  if (nextAuthUrl?.endsWith("/")) {
    issues.push(
      "NEXTAUTH_URL has a trailing slash. This might cause URL concatenation issues."
    );
  }

  // Check VERCEL_URL format
  if (vercelUrl && !vercelUrl.startsWith("https://")) {
    issues.push(
      "VERCEL_URL does not include protocol. When using it, ensure you add https://"
    );
  }

  analysis.issues = issues;
  analysis.hasIssues = issues.length > 0;

  return analysis;
}

/**
 * Analyze cookies for auth-related ones
 */
function analyzeCookies(request: NextRequest): Record<string, unknown> {
  const cookies = request.cookies.getAll();
  const analysis: Record<string, unknown> = {
    count: cookies.length,
    authCookies: {},
    pkceCookies: [],
    otherCookies: [],
  };

  const authCookies: Record<string, unknown> = {};
  const pkceCookies: string[] = [];
  const otherCookies: string[] = [];

  for (const cookie of cookies) {
    const name = cookie.name;
    if (
      name.includes("session") ||
      name.includes("csrf") ||
      name.includes("callback") ||
      name.includes("state")
    ) {
      authCookies[name] = {
        exists: true,
        length: cookie.value.length,
        preview:
          cookie.value.length > 30
            ? `${cookie.value.substring(0, 30)}...`
            : "[short]",
      };
    } else if (name.includes("pkce") || name.includes("code_verifier")) {
      pkceCookies.push(name);
    } else {
      otherCookies.push(name);
    }
  }

  analysis.authCookies = authCookies;
  analysis.pkceCookies = pkceCookies;
  analysis.hasPkceCookies = pkceCookies.length > 0;
  analysis.otherCookies = otherCookies;

  return analysis;
}

/**
 * Test if the access token can be used
 */
async function testAccessToken(
  accessToken: string
): Promise<Record<string, unknown>> {
  try {
    // Try to call Google's tokeninfo endpoint
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );

    if (response.ok) {
      const data = await response.json();
      return {
        valid: true,
        expiresIn: data.expires_in,
        scopes: data.scope?.split(" ") || [],
        audience: data.audience,
        userId: data.user_id,
        email: data.email,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        valid: false,
        status: response.status,
        error: errorData.error || "Unknown error",
        errorDescription: errorData.error_description || null,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: "Failed to verify token",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check database connectivity and auth-related data
 */
async function checkDatabaseStatus(): Promise<Record<string, unknown>> {
  const startTime = Date.now();

  try {
    // Test connection with a simple query
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();

    // Get recent accounts to check OAuth data
    const recentAccounts = await prisma.account.findMany({
      take: 5,
      orderBy: { id: "desc" },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        access_token: true,
        refresh_token: true,
        expires_at: true,
        userId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    const accountsAnalysis = recentAccounts.map((acc) => ({
      provider: acc.provider,
      hasAccessToken: !!acc.access_token,
      accessTokenLength: acc.access_token?.length || 0,
      hasRefreshToken: !!acc.refresh_token,
      refreshTokenLength: acc.refresh_token?.length || 0,
      expiresAt: acc.expires_at,
      isExpired: acc.expires_at
        ? acc.expires_at < Math.floor(Date.now() / 1000)
        : null,
      userEmail: acc.user?.email || null,
    }));

    return {
      connected: true,
      latency: `${Date.now() - startTime}ms`,
      counts: {
        users: userCount,
        accounts: accountCount,
        sessions: sessionCount,
      },
      recentAccounts: accountsAnalysis,
    };
  } catch (error) {
    return {
      connected: false,
      latency: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate a checklist of potential issues based on diagnostic data
 */
function generateAuthChecklist(
  diagnostic: Record<string, unknown>
): Record<string, unknown> {
  const checklist: Record<string, { status: "ok" | "warning" | "error"; message: string }> =
    {};

  const env = diagnostic.environment as Record<string, unknown>;
  const envVars = env?.envVars as Record<string, string>;
  const session = diagnostic.session as Record<string, unknown>;
  const tokenTest = diagnostic.tokenTest as Record<string, unknown>;
  const requestInfo = diagnostic.request as Record<string, unknown>;
  const cookies = requestInfo?.cookies as Record<string, unknown>;

  // Check environment variables
  if (envVars?.AUTH_SECRET === "set" || envVars?.NEXTAUTH_SECRET === "set") {
    checklist.authSecret = { status: "ok", message: "Auth secret is configured" };
  } else {
    checklist.authSecret = {
      status: "error",
      message: "AUTH_SECRET or NEXTAUTH_SECRET is not set",
    };
  }

  if (envVars?.GOOGLE_CLIENT_ID === "set" && envVars?.GOOGLE_CLIENT_SECRET === "set") {
    checklist.googleCredentials = {
      status: "ok",
      message: "Google OAuth credentials are configured",
    };
  } else {
    checklist.googleCredentials = {
      status: "error",
      message: "Google OAuth credentials are missing",
    };
  }

  if (envVars?.NEXTAUTH_URL === "set" || envVars?.AUTH_URL === "set") {
    const urlAnalysis = env?.urlAnalysis as Record<string, unknown>;
    if (urlAnalysis?.hasIssues) {
      checklist.authUrl = {
        status: "warning",
        message: `Auth URL is set but has issues: ${(urlAnalysis.issues as string[]).join("; ")}`,
      };
    } else {
      checklist.authUrl = { status: "ok", message: "Auth URL is properly configured" };
    }
  } else {
    checklist.authUrl = {
      status: "error",
      message: "NEXTAUTH_URL or AUTH_URL is not set",
    };
  }

  if (envVars?.DATABASE_URL === "set") {
    checklist.database = { status: "ok", message: "Database URL is configured" };
  } else {
    checklist.database = { status: "error", message: "DATABASE_URL is not set" };
  }

  // Check session state
  if (session?.error) {
    checklist.session = {
      status: "error",
      message: `Session error: ${(session as Record<string, unknown>).message}`,
    };
  } else if (session?.exists) {
    const user = session.user as Record<string, unknown>;
    if (user?.hasId) {
      checklist.session = { status: "ok", message: "Session exists with valid user ID" };
    } else {
      checklist.session = {
        status: "warning",
        message: "Session exists but user ID is missing",
      };
    }
  } else {
    checklist.session = {
      status: "warning",
      message: "No active session (user not logged in)",
    };
  }

  // Check access token
  if (tokenTest?.valid) {
    checklist.accessToken = {
      status: "ok",
      message: `Access token is valid, expires in ${tokenTest.expiresIn}s`,
    };
  } else if (session?.accessToken) {
    const accessTokenInfo = session.accessToken as Record<string, unknown>;
    if (accessTokenInfo?.exists) {
      checklist.accessToken = {
        status: "error",
        message: `Access token exists but is invalid: ${tokenTest?.error || "Unknown error"}`,
      };
    } else {
      checklist.accessToken = {
        status: "error",
        message: "No access token in session",
      };
    }
  } else {
    checklist.accessToken = {
      status: "warning",
      message: "No access token (user not logged in or token missing)",
    };
  }

  // Check for PKCE cookies (should not exist)
  if (cookies?.hasPkceCookies) {
    checklist.pkceCookies = {
      status: "warning",
      message: `PKCE cookies found: ${(cookies.pkceCookies as string[]).join(", ")}. These may cause auth issues.`,
    };
  } else {
    checklist.pkceCookies = {
      status: "ok",
      message: "No stale PKCE cookies present",
    };
  }

  // Check auth cookies
  const authCookies = cookies?.authCookies as Record<string, unknown>;
  if (authCookies && Object.keys(authCookies).length > 0) {
    checklist.authCookies = {
      status: "ok",
      message: `Auth cookies present: ${Object.keys(authCookies).join(", ")}`,
    };
  } else {
    checklist.authCookies = {
      status: "warning",
      message: "No auth cookies found",
    };
  }

  return checklist;
}

// Declare EdgeRuntime for type checking
declare const EdgeRuntime: string;
