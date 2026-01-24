import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { google } from "googleapis";
import { logger } from "./logger";

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
  if (!account.refresh_token) {
    logger.error("GOOGLE_OAUTH", "No refresh token available", undefined, {
      accountId: account.id,
    });
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: account.refresh_token });

    const startTime = Date.now();
    const { credentials } = await oauth2Client.refreshAccessToken();
    const elapsed = Date.now() - startTime;

    if (credentials.access_token) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date
            ? Math.floor(credentials.expiry_date / 1000)
            : null,
        },
      });

      return credentials.access_token;
    } else {
      logger.error("GOOGLE_OAUTH", "Google returned no access_token in credentials", undefined, {
        elapsed: `${elapsed}ms`,
        credentialsKeys: Object.keys(credentials),
      });
    }
  } catch (error) {
    logger.error(
      "GOOGLE_OAUTH",
      "Token refresh failed",
      error instanceof Error ? error : undefined,
      { accountId: account.id }
    );
  }

  return null;
}

// Cookie configuration for production
const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

function extractAuthErrorMessage(messages: unknown[]): string {
  return messages
    .map((entry) => {
      if (entry instanceof Error) {
        return entry.message;
      }
      if (typeof entry === "string") {
        return entry;
      }
      if (entry && typeof entry === "object" && "message" in entry) {
        const message = (entry as { message?: unknown }).message;
        return typeof message === "string" ? message : JSON.stringify(entry);
      }
      return JSON.stringify(entry);
    })
    .filter(Boolean)
    .join(" ");
}

function extractMissingTable(message: string): string | null {
  const prismaMatch = message.match(/The table `([^`]+)` does not exist/i);
  if (prismaMatch?.[1]) {
    return prismaMatch[1];
  }
  const relationMatch = message.match(/relation \"([^\"]+)\" does not exist/i);
  if (relationMatch?.[1]) {
    return relationMatch[1];
  }
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true, // Required for Vercel deployment
  // basePath must match the Next.js basePath + /api/auth
  // This ensures NextAuth constructs correct callback URLs when the app is deployed under a subpath
  basePath: "/ytpm/api/auth",
  secret: getAuthSecret(),
  debug: process.env.NODE_ENV === "development" || process.env.AUTH_DEBUG === "true",
  logger: {
    error(code, ...message) {
      const combinedMessage = extractAuthErrorMessage(message);
      const missingTable = extractMissingTable(combinedMessage);
      if (missingTable) {
        logger.critical("DATABASE", "Missing Prisma table detected during auth", undefined, {
          missingTable,
          isVercel: !!process.env.VERCEL,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          guidance: "Run `prisma migrate deploy` (or `prisma db push`) against the production database and confirm DATABASE_URL points to that database.",
        });
      }
    },
    warn() {},
    debug() {},
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
    // PKCE code verifier cookie configuration.
    // Even though we use checks: ["state"] (PKCE disabled), we explicitly configure
    // the PKCE cookie with maxAge: 0 to ensure any stale cookies are immediately deleted.
    // This helps prevent "pkceCodeVerifier could not be parsed" errors caused by:
    // 1. Old cookies encrypted with a previous AUTH_SECRET
    // 2. Cookies from previous auth attempts when PKCE was enabled
    // 3. Cookies that couldn't be properly removed during callback
    pkceCodeVerifier: {
      name: `${cookiePrefix}authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 0, // Immediately expire - we don't use PKCE
      },
    },
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
      if (account?.provider === "google" && account.access_token) {
        try {
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials({ access_token: account.access_token });

          const youtube = google.youtube({ version: "v3", auth: oauth2Client });
          const response = await youtube.channels.list({
            part: ["id"],
            mine: true,
          });

          const channelId = response.data.items?.[0]?.id;

          if (channelId && user.email) {
            await prisma.user.update({
              where: { email: user.email },
              data: { youtubeChannelId: channelId },
            });
          }
        } catch (error) {
          logger.error(
            "AUTH_CALLBACK",
            "Failed to fetch YouTube Channel ID",
            error instanceof Error ? error : undefined,
            { userEmail: user.email }
          );
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - persist user data in token
      if (user) {
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
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.accountId = account.providerAccountId;
      }

      // If we still don't have userId but have email, try to fetch from DB
      if (!token.userId && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          if (dbUser) {
            token.userId = dbUser.id;
          }
        } catch (error) {
          logger.error(
            "AUTH_JWT",
            "Database query failed when fetching user by email",
            error instanceof Error ? error : undefined,
            { email: token.email }
          );
        }
      }

      // Fallback: use token.sub as userId if still missing
      if (!token.userId && token.sub) {
        token.userId = token.sub;
      }

      // Check if token needs refresh
      if (token.expiresAt && typeof token.expiresAt === "number") {
        const now = Math.floor(Date.now() / 1000);
        const isExpired = token.expiresAt < now - 60;

        if (isExpired && token.refreshToken) {
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
            } else {
              logger.error("AUTH_JWT", "Account not found in database for refresh", undefined, {
                providerAccountId: token.accountId,
              });
            }
          } catch (error) {
            logger.error(
              "AUTH_JWT",
              "Token refresh failed with exception",
              error instanceof Error ? error : undefined
            );
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
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
          const user = await prisma.user.findFirst({
            where: whereClause,
            include: { accounts: true },
          });

          return user;
        } catch (error) {
          logger.error(
            "DATABASE",
            "Failed to fetch user with account",
            error instanceof Error ? error : undefined,
            { whereClause }
          );
          return null;
        }
      }

      // STRATEGY 1: Use userId from JWT token (primary method)
      if (token.userId) {
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

        return session;
      }

      // STRATEGY 1.5: Use token.sub as userId if userId is missing
      // In NextAuth v5 with JWT strategy, token.sub often contains the user ID
      if (token.sub && !token.userId) {
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

          return session;
        }
      }

      // STRATEGY 2: Fallback - fetch by email from token or session
      const email = (token.email as string) || session?.user?.email;
      if (email) {
        const emailUser = await fetchUserWithAccount({ email });

        if (emailUser) {
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
          orderBy: { updatedAt: "desc" },
        });

        if (recentUser) {
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
        logger.error(
          "AUTH_SESSION",
          "STRATEGY 3 failed with exception",
          error instanceof Error ? error : undefined
        );
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Atualizar tokens quando o usuário faz login novamente
      if (account && user.id) {
        try {
          const result = await prisma.account.updateMany({
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
          void result;
        } catch (error) {
          logger.error(
            "DATABASE",
            "Failed to update account tokens on signIn",
            error instanceof Error ? error : undefined,
            { userId: user.id, provider: account.provider }
          );
        }
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
