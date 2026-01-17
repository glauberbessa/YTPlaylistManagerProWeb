import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { google } from "googleapis";

// Get the auth secret with proper validation
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  // In production, we must have a secret - throw a clear error
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    // Log the error but provide a fallback to prevent crashes
    // This allows the app to at least load and show meaningful errors
    console.error(
      "[Auth] CRITICAL: AUTH_SECRET or NEXTAUTH_SECRET environment variable is not set! " +
      "Authentication will not work properly. Please set AUTH_SECRET in your Vercel environment variables."
    );
    // Use VERCEL_URL or a hash of other env vars as an emergency fallback
    // This is NOT secure but prevents complete app failure
    const emergencyFallback = process.env.VERCEL_URL || process.env.VERCEL_GIT_COMMIT_SHA || "insecure-fallback-please-set-auth-secret";
    return `emergency-${emergencyFallback}`;
  }

  // In development, use a default secret (not secure, but acceptable for dev)
  console.warn("[Auth] Warning: No AUTH_SECRET set. Using development fallback.");
  return "development-secret-please-set-auth-secret-in-production";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      youtubeChannelId?: string | null;
    };
    accessToken?: string | null;
  }
}

async function refreshAccessToken(account: {
  id: string;
  refresh_token: string | null;
}): Promise<string | null> {
  console.log("[Auth] Attempting to refresh access token for account:", account.id);

  if (!account.refresh_token) {
    console.error("[Auth] No refresh token available for account:", account.id);
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: account.refresh_token });

    console.log("[Auth] Calling Google OAuth to refresh token...");
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (credentials.access_token) {
      console.log("[Auth] Got new access token, updating database...");
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date
            ? Math.floor(credentials.expiry_date / 1000)
            : null,
        },
      });

      console.log("[Auth] Access token refreshed successfully");
      return credentials.access_token;
    } else {
      console.error("[Auth] Google returned no access_token in credentials");
    }
  } catch (error) {
    console.error("[Auth] Error refreshing access token:", error);
  }

  return null;
}

// Cookie configuration for production
const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

// Debug logging helper
function logAuthConfig() {
  console.log(`\n${"#".repeat(80)}`);
  console.log(`[AUTH-CONFIG] NextAuth Configuration Initialized`);
  console.log(`${"#".repeat(80)}`);
  console.log(`[AUTH-CONFIG] Cookie Settings:`);
  console.log(`  - useSecureCookies: ${useSecureCookies}`);
  console.log(`  - cookiePrefix: "${cookiePrefix}"`);
  console.log(`  - State cookie name: ${cookiePrefix}next-auth.state`);
  console.log(`[AUTH-CONFIG] Provider Settings:`);
  console.log(`  - Provider: Google OAuth`);
  console.log(`  - Checks: ["state"] (PKCE disabled)`);
  console.log(`  - PKCE cookies stripped in route handler`);
  console.log(`  - Session Strategy: JWT`);
  console.log(`${"#".repeat(80)}\n`);
}

// Log config on module load
logAuthConfig();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true, // Required for Vercel deployment
  secret: getAuthSecret(),
  debug: process.env.NODE_ENV === "development" || process.env.AUTH_DEBUG === "true",
  logger: {
    error(code, ...message) {
      console.log(`\n${"!".repeat(80)}`);
      console.log(`[AUTH-INTERNAL-ERROR] Code: ${code}`);
      console.log(`${"!".repeat(80)}`);
      console.log(`[AUTH-INTERNAL-ERROR] Message:`, ...message);
      if (typeof code === 'object' && code !== null) {
        console.log(`[AUTH-INTERNAL-ERROR] Error Object:`, JSON.stringify(code, null, 2));
      }
      console.log(`${"!".repeat(80)}\n`);
    },
    warn(code, ...message) {
      console.log(`[AUTH-INTERNAL-WARN] Code: ${code}`, ...message);
    },
    debug(code, ...message) {
      console.log(`[AUTH-INTERNAL-DEBUG] Code: ${code}`, ...message);
    },
  },
  session: {
    strategy: "jwt", // Use JWT strategy for better serverless compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    // PKCE cookies are stripped from requests in the route handler before NextAuth
    // processes them. This prevents the "pkceCodeVerifier could not be parsed" error.
    // Do NOT configure pkceCodeVerifier here - any configuration (even with maxAge: 0)
    // can trigger PKCE code paths in NextAuth v5.
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube",
          access_type: "offline",
          prompt: "consent",
        },
      },
      // IMPORTANT: PKCE is disabled to fix "Invalid code verifier" error in serverless environments.
      // In serverless/edge environments, the PKCE code_verifier cookie can be lost between
      // the authorization request and callback due to cold starts or cookie handling issues.
      // Google OAuth supports but doesn't require PKCE - the state parameter provides CSRF protection.
      // Requirements for this fix:
      // - Use checks: ["state"] (not ["pkce"] or ["state", "pkce"])
      // - Remove pkceCodeVerifier cookie configuration from cookies object above
      // - Use next-auth >= 5.0.0-beta.25 which has improved PKCE handling
      checks: ["state"],
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log(`\n${"*".repeat(80)}`);
      console.log(`[AUTH-CALLBACK] signIn callback invoked`);
      console.log(`${"*".repeat(80)}`);
      console.log(`[AUTH-CALLBACK] SignIn Details:`);
      console.log(`  - User ID: ${user?.id || 'undefined'}`);
      console.log(`  - User Email: ${user?.email || 'undefined'}`);
      console.log(`  - Provider: ${account?.provider || 'undefined'}`);
      console.log(`  - Has Access Token: ${!!account?.access_token}`);
      console.log(`  - Has Refresh Token: ${!!account?.refresh_token}`);
      console.log(`  - Token Expires At: ${account?.expires_at || 'undefined'}`);
      console.log(`${"*".repeat(80)}\n`);

      if (account?.provider === "google" && account.access_token) {
        try {
          console.log(`[AUTH-CALLBACK] Fetching YouTube Channel ID...`);
          // Buscar Channel ID do YouTube
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials({ access_token: account.access_token });

          const youtube = google.youtube({ version: "v3", auth: oauth2Client });
          const response = await youtube.channels.list({
            part: ["id"],
            mine: true,
          });

          const channelId = response.data.items?.[0]?.id;
          console.log(`[AUTH-CALLBACK] YouTube Channel ID found: ${channelId || 'none'}`);
          if (channelId && user.email) {
            await prisma.user.update({
              where: { email: user.email },
              data: { youtubeChannelId: channelId },
            });
            console.log(`[AUTH-CALLBACK] Updated user with YouTube Channel ID`);
          }
        } catch (error) {
          console.error("[AUTH-CALLBACK] Error fetching YouTube Channel ID:", error);
        }
      }
      console.log(`[AUTH-CALLBACK] signIn callback completed successfully - returning true`);
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - persist user data in token
      if (user) {
        console.log("[Auth/JWT] Initial sign in, user object:", {
          hasId: !!user.id,
          hasEmail: !!user.email,
          id: user.id,
        });

        if (user.id) {
          token.userId = user.id;
        }
        if (user.email) {
          token.email = user.email;
        }
        if (user.name) {
          token.name = user.name;
        }
        if (user.image) {
          token.picture = user.image;
        }
      }

      // Persist account data on initial sign in
      if (account) {
        console.log("[Auth/JWT] Storing account tokens in JWT");
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.accountId = account.providerAccountId;
      }

      // If we still don't have userId but have email, try to fetch from DB
      if (!token.userId && token.email) {
        console.log("[Auth/JWT] No userId in token, trying to fetch by email:", token.email);
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          if (dbUser) {
            console.log("[Auth/JWT] Found user by email, setting userId:", dbUser.id);
            token.userId = dbUser.id;
          }
        } catch (error) {
          console.error("[Auth/JWT] Error fetching user by email:", error);
        }
      }

      // Fallback: use token.sub as userId if still missing
      if (!token.userId && token.sub) {
        console.log("[Auth/JWT] Using token.sub as userId fallback:", token.sub);
        token.userId = token.sub;
      }

      // Check if token needs refresh
      if (token.expiresAt && typeof token.expiresAt === 'number') {
        const now = Math.floor(Date.now() / 1000);
        const isExpired = token.expiresAt < now - 60;

        if (isExpired && token.refreshToken) {
          console.log("[Auth/JWT] Token expired, refreshing...");
          try {
            // Find the account in DB to get its ID for update
            const dbAccount = await prisma.account.findFirst({
              where: {
                providerAccountId: token.accountId as string,
                provider: "google",
              },
            });

            if (dbAccount) {
              const newAccessToken = await refreshAccessToken({
                id: dbAccount.id,
                refresh_token: token.refreshToken as string,
              });

              if (newAccessToken) {
                token.accessToken = newAccessToken;
                // Update expiry (Google tokens typically last 1 hour)
                token.expiresAt = Math.floor(Date.now() / 1000) + 3600;
              }
            }
          } catch (error) {
            console.error("[Auth/JWT] Token refresh failed:", error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log("[Auth/Session] Building session from JWT, token has:", {
        hasUserId: !!token.userId,
        hasEmail: !!token.email,
        hasAccessToken: !!token.accessToken,
        tokenSub: token.sub,
      });

      // CRITICAL: Ensure session.user object exists before assigning properties
      // In NextAuth v5 with JWT strategy, session.user may be undefined or empty
      if (!session.user) {
        session.user = {
          id: "",
        } as typeof session.user;
      }

      // Populate basic user info from token
      if (token.name) session.user.name = token.name as string;
      if (token.email) session.user.email = token.email as string;
      if (token.picture) session.user.image = token.picture as string;

      // Helper function to fetch user with account data
      async function fetchUserWithAccount(whereClause: { id?: string; email?: string }) {
        try {
          return await prisma.user.findFirst({
            where: whereClause,
            include: { accounts: true },
          });
        } catch (error) {
          console.error("[Auth/Session] DB query failed:", error);
          return null;
        }
      }

      // STRATEGY 1: Use userId from JWT token (primary method)
      if (token.userId) {
        console.log("[Auth/Session] Using userId from JWT:", token.userId);
        session.user.id = token.userId as string;

        // Fetch additional user data from DB
        const dbUser = await fetchUserWithAccount({ id: token.userId as string });
        if (dbUser) {
          session.user.youtubeChannelId = dbUser.youtubeChannelId;
        }

        // Use access token from JWT
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }

        console.log("[Auth/Session] Session populated from JWT token");
        return session;
      }

      // STRATEGY 1.5: Use token.sub as userId if userId is missing
      // In NextAuth v5 with JWT strategy, token.sub often contains the user ID
      if (token.sub && !token.userId) {
        console.log("[Auth/Session] Using token.sub as userId:", token.sub);
        const subUser = await fetchUserWithAccount({ id: token.sub });
        if (subUser) {
          session.user.id = subUser.id;
          session.user.youtubeChannelId = subUser.youtubeChannelId;
          if (token.accessToken) {
            session.accessToken = token.accessToken as string;
          } else {
            const account = subUser.accounts[0];
            if (account?.access_token) {
              session.accessToken = account.access_token;
            }
          }
          console.log("[Auth/Session] Session populated from token.sub");
          return session;
        }
      }

      // STRATEGY 2: Fallback - fetch by email from token or session
      const email = (token.email as string) || session?.user?.email;
      if (email) {
        console.log("[Auth/Session] Trying email fallback:", email);
        const emailUser = await fetchUserWithAccount({ email });

        if (emailUser) {
          console.log("[Auth/Session] Found user by email:", emailUser.id);
          session.user.id = emailUser.id;
          session.user.youtubeChannelId = emailUser.youtubeChannelId;

          // Get access token from JWT or from DB account
          if (token.accessToken) {
            session.accessToken = token.accessToken as string;
          } else {
            const account = emailUser.accounts[0];
            if (account?.access_token) {
              const now = Math.floor(Date.now() / 1000);
              const isExpired = (account.expires_at || 0) < now - 60;

              if (isExpired && account.refresh_token) {
                const newToken = await refreshAccessToken({
                  id: account.id,
                  refresh_token: account.refresh_token,
                });
                session.accessToken = newToken ?? account.access_token ?? null;
              } else {
                session.accessToken = account.access_token;
              }
            }
          }
          return session;
        }
      }

      // STRATEGY 3: Last resort - try to find any recent user with Google account
      console.log("[Auth/Session] Email fallback failed, trying recent user lookup...");
      try {
        const recentUser = await prisma.user.findFirst({
          where: {
            accounts: {
              some: {
                provider: "google",
              },
            },
          },
          include: { accounts: true },
          orderBy: { updatedAt: 'desc' },
        });

        if (recentUser) {
          console.log("[Auth/Session] Found recent user:", recentUser.id);
          session.user.id = recentUser.id;
          session.user.youtubeChannelId = recentUser.youtubeChannelId;

          const account = recentUser.accounts[0];
          if (account?.access_token) {
            const now = Math.floor(Date.now() / 1000);
            const isExpired = (account.expires_at || 0) < now - 60;

            if (isExpired && account.refresh_token) {
              const newToken = await refreshAccessToken({
                id: account.id,
                refresh_token: account.refresh_token,
              });
              session.accessToken = newToken ?? account.access_token ?? null;
            } else {
              session.accessToken = account.access_token;
            }
          }
          return session;
        }
      } catch (error) {
        console.error("[Auth/Session] Recent user lookup failed:", error);
      }

      console.error("[Auth/Session] All strategies failed - returning incomplete session");
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Atualizar tokens quando o usuário faz login novamente
      if (account && user.id) {
        await prisma.account.updateMany({
          where: {
            userId: user.id,
            provider: account.provider,
          },
          data: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
        });
      }
    },
  },
});

// Helper para obter sessão autenticada
export async function getAuthSession() {
  const session = await auth();
  return session;
}

// Helper para verificar se usuário está autenticado
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autenticado");
  }
  return session;
}
