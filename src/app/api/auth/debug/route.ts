import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("[API/auth/debug] Starting debug request...");
    console.log("[API/auth/debug] NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log("[API/auth/debug] Has NEXTAUTH_SECRET:", !!process.env.NEXTAUTH_SECRET);
    console.log("[API/auth/debug] Has GOOGLE_CLIENT_ID:", !!process.env.GOOGLE_CLIENT_ID);
    console.log("[API/auth/debug] Has GOOGLE_CLIENT_SECRET:", !!process.env.GOOGLE_CLIENT_SECRET);
    console.log("[API/auth/debug] Has DATABASE_URL:", !!process.env.DATABASE_URL);

    const session = await auth();

    console.log("[API/auth/debug] Session result:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      hasAccessToken: !!session?.accessToken,
      hasYoutubeChannelId: !!session?.user?.youtubeChannelId,
    });

    if (!session) {
      return NextResponse.json({
        status: "no_session",
        message: "Nenhuma sessão encontrada. Verifique se você está logado.",
        debug: {
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
      });
    }

    if (!session.user?.id) {
      return NextResponse.json({
        status: "no_user_id",
        message: "Sessão existe mas user.id está ausente.",
        debug: {
          hasSession: true,
          hasUser: !!session.user,
          userName: session.user?.name,
          userEmail: session.user?.email,
        },
      });
    }

    if (!session.accessToken) {
      return NextResponse.json({
        status: "no_access_token",
        message: "Sessão existe mas accessToken está ausente. Pode ser necessário fazer login novamente.",
        debug: {
          hasSession: true,
          hasUserId: true,
          userId: session.user.id,
          hasYoutubeChannelId: !!session.user.youtubeChannelId,
        },
      });
    }

    return NextResponse.json({
      status: "ok",
      message: "Sessão válida com access token.",
      debug: {
        hasSession: true,
        hasUserId: true,
        hasAccessToken: true,
        hasYoutubeChannelId: !!session.user.youtubeChannelId,
        userId: session.user.id.substring(0, 8) + "...",
        accessTokenLength: session.accessToken.length,
      },
    });
  } catch (error) {
    console.error("[API/auth/debug] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Erro ao verificar sessão",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
