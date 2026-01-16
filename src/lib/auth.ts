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
  if (!account.refresh_token) {
    console.error("No refresh token available");
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: account.refresh_token });

    const { credentials } = await oauth2Client.refreshAccessToken();

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

      console.log("Access token refreshed successfully");
      return credentials.access_token;
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }

  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { accounts: true },
      });

      session.user.id = user.id;
      session.user.youtubeChannelId = dbUser?.youtubeChannelId;

      const account = dbUser?.accounts[0];
      if (account) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = account.expires_at || 0;
        const isExpired = expiresAt < now - 60;

        if (isExpired && account.refresh_token) {
          const newAccessToken = await refreshAccessToken({
            id: account.id,
            refresh_token: account.refresh_token,
          });
          session.accessToken = newAccessToken || account.access_token;
        } else {
          session.accessToken = account.access_token;
        }
      }

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
