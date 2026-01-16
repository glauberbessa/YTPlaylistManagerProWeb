import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { google } from "googleapis";

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true, // Required for Vercel deployment
  session: {
    strategy: "database", // Explicitly use database sessions with PrismaAdapter
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
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
          // Buscar Channel ID do YouTube
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
          console.error("Erro ao buscar Channel ID do YouTube:", error);
        }
      }
      return true;
    },
    async session({ session, user, token }) {
      console.log("[Auth/Session] Building session, params:", {
        hasUser: !!user,
        userId: user?.id,
        sessionUserEmail: session?.user?.email,
        hasToken: !!token,
      });

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

      // Helper function to populate session from user data
      function populateSession(
        sessionData: { user: { id: string; youtubeChannelId?: string | null }; accessToken?: string | null },
        userData: { id: string; youtubeChannelId?: string | null; accounts: { access_token?: string | null; refresh_token?: string | null; expires_at?: number | null; id: string }[] }
      ) {
        sessionData.user.id = userData.id;
        sessionData.user.youtubeChannelId = userData.youtubeChannelId;

        const account = userData.accounts[0];
        if (account?.access_token) {
          const now = Math.floor(Date.now() / 1000);
          const isExpired = (account.expires_at || 0) < now - 60;

          if (isExpired && account.refresh_token) {
            console.log("[Auth/Session] Token expired, will refresh...");
            // Return the account for async refresh
            return { needsRefresh: true, account };
          }
          sessionData.accessToken = account.access_token;
        }
        return { needsRefresh: false, account };
      }

      // STRATEGY 1: Use the user parameter directly (normal case)
      if (user?.id) {
        console.log("[Auth/Session] Using user from callback param:", user.id);
        const dbUser = await fetchUserWithAccount({ id: user.id });

        if (dbUser) {
          const result = populateSession(session, dbUser);
          if (result.needsRefresh && result.account) {
            const newToken = await refreshAccessToken({
              id: result.account.id,
              refresh_token: result.account.refresh_token ?? null,
            });
            session.accessToken = newToken ?? result.account.access_token ?? null;
          }
          console.log("[Auth/Session] Session populated from user param");
          return session;
        }
      }

      // STRATEGY 2: Fallback - fetch by email
      console.log("[Auth/Session] User param missing, trying email fallback...");
      if (session?.user?.email) {
        const emailUser = await fetchUserWithAccount({ email: session.user.email });

        if (emailUser) {
          console.log("[Auth/Session] Found user by email:", emailUser.id);
          const result = populateSession(session, emailUser);
          if (result.needsRefresh && result.account) {
            const newToken = await refreshAccessToken({
              id: result.account.id,
              refresh_token: result.account.refresh_token ?? null,
            });
            session.accessToken = newToken ?? result.account.access_token ?? null;
          }
          return session;
        }
      }

      // STRATEGY 3: Last resort - try to find any active session for this user
      console.log("[Auth/Session] Email fallback failed, trying session lookup...");
      try {
        // Find sessions that haven't expired yet
        const activeSessions = await prisma.session.findMany({
          where: {
            expires: { gt: new Date() },
          },
          include: {
            user: {
              include: { accounts: true },
            },
          },
          orderBy: { expires: 'desc' },
          take: 1,
        });

        if (activeSessions.length > 0 && activeSessions[0].user) {
          const sessionUser = activeSessions[0].user;
          console.log("[Auth/Session] Found user from active session:", sessionUser.id);

          // Verify this matches the session email if available
          if (!session?.user?.email || sessionUser.email === session.user.email) {
            const result = populateSession(session, sessionUser);
            if (result.needsRefresh && result.account) {
              const newToken = await refreshAccessToken({
                id: result.account.id,
                refresh_token: result.account.refresh_token ?? null,
              });
              session.accessToken = newToken ?? result.account.access_token ?? null;
            }
            return session;
          }
        }
      } catch (error) {
        console.error("[Auth/Session] Session lookup failed:", error);
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
