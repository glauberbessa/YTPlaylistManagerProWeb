import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("[API/playlists] Starting request...");
    const session = await auth();

    console.log("[API/playlists] Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      hasAccessToken: !!session?.accessToken,
    });

    if (!session?.user?.id || !session.accessToken) {
      const reason = !session
        ? "no_session"
        : !session.user?.id
          ? "no_user_id"
          : "no_access_token";

      console.log("[API/playlists] Unauthorized - reason:", reason);

      return NextResponse.json(
        {
          error: "Não autorizado",
          reason,
          hint:
            reason === "no_session"
              ? "Sessão não encontrada. Verifique se está logado e se os cookies estão sendo enviados."
              : reason === "no_access_token"
                ? "Access token ausente. Pode ser necessário fazer login novamente."
                : "ID do usuário ausente na sessão.",
        },
        { status: 401 }
      );
    }

    console.log("[API/playlists] User authenticated:", session.user.id);

    const youtubeService = new YouTubeService(
      session.accessToken,
      session.user.id
    );

    console.log("[API/playlists] Fetching playlists from YouTube...");
    const playlists = await youtubeService.getPlaylists();
    console.log("[API/playlists] Playlists fetched from YouTube:", playlists.length);

    // Buscar configurações das playlists
    console.log("[API/playlists] Fetching playlist configs from database...");
    const configs = await prisma.playlistConfig.findMany({
      where: { userId: session.user.id },
    });
    console.log("[API/playlists] Configs found:", configs.length);

    // Mesclar playlists com configurações
    const playlistsWithConfig = playlists.map((playlist) => {
      const config = configs.find((c) => c.playlistId === playlist.id);
      return {
        ...playlist,
        config: config
          ? {
            id: config.id,
            playlistId: config.playlistId,
            title: config.title,
            isEnabled: config.isEnabled,
            videoCount: config.videoCount,
            totalDurationSeconds: config.totalDurationSeconds,
          }
          : undefined,
      };
    });

    // Ordenar playlists por título (A-Z)
    playlistsWithConfig.sort((a, b) => a.title.localeCompare(b.title));

    console.log("[API/playlists] Returning", playlistsWithConfig.length, "playlists");
    return NextResponse.json(playlistsWithConfig);
  } catch (error) {
    console.error("[API/playlists] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar playlists", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
