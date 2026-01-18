import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";
import { logger, generateTraceId, setTraceId, clearTraceId } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const traceId = generateTraceId();
  setTraceId(traceId);
  const startTime = Date.now();

  try {
    logger.info("API", "GET /api/playlists - Request started", { traceId });

    const session = await auth();

    logger.info("API", "Session retrieved", {
      traceId,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userId: session?.user?.id,
      hasAccessToken: !!session?.accessToken,
      accessTokenLength: session?.accessToken?.length || 0,
      userEmail: session?.user?.email,
    });

    if (!session?.user?.id || !session.accessToken) {
      const reason = !session
        ? "no_session"
        : !session.user?.id
          ? "no_user_id"
          : "no_access_token";

      logger.warn("API", "GET /api/playlists - Unauthorized", {
        traceId,
        reason,
        hasSession: !!session,
        hasUser: !!session?.user,
        hasUserId: !!session?.user?.id,
        hasAccessToken: !!session?.accessToken,
      });

      clearTraceId();

      return NextResponse.json(
        {
          error: "Não autorizado",
          reason,
          traceId,
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

    logger.info("API", "User authenticated, creating YouTubeService", {
      traceId,
      userId: session.user.id,
      accessTokenPreview: `${session.accessToken.substring(0, 20)}...`,
    });

    const youtubeService = new YouTubeService(
      session.accessToken,
      session.user.id
    );

    logger.info("API", "Fetching playlists from YouTube API", { traceId });
    const youtubeStartTime = Date.now();
    const playlists = await youtubeService.getPlaylists();
    const youtubeElapsed = Date.now() - youtubeStartTime;

    logger.info("API", "Playlists fetched from YouTube", {
      traceId,
      playlistCount: playlists.length,
      elapsed: `${youtubeElapsed}ms`,
    });

    // Buscar configurações das playlists
    logger.info("API", "Fetching playlist configs from database", { traceId });
    const dbStartTime = Date.now();
    const configs = await prisma.playlistConfig.findMany({
      where: { userId: session.user.id },
    });
    const dbElapsed = Date.now() - dbStartTime;

    logger.database("Fetch playlist configs", true, {
      traceId,
      configCount: configs.length,
      elapsed: `${dbElapsed}ms`,
    });

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

    const totalElapsed = Date.now() - startTime;

    logger.info("API", "GET /api/playlists - Request completed successfully", {
      traceId,
      playlistCount: playlistsWithConfig.length,
      configuredCount: playlistsWithConfig.filter((p) => p.config).length,
      totalElapsed: `${totalElapsed}ms`,
      youtubeApiTime: `${youtubeElapsed}ms`,
      databaseTime: `${dbElapsed}ms`,
    });

    clearTraceId();

    return NextResponse.json(playlistsWithConfig);
  } catch (error) {
    const totalElapsed = Date.now() - startTime;

    logger.error("API", "GET /api/playlists - Request failed", error instanceof Error ? error : undefined, {
      traceId,
      elapsed: `${totalElapsed}ms`,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as { code?: number })?.code,
    });

    clearTraceId();

    return NextResponse.json(
      {
        error: "Erro ao buscar playlists",
        traceId,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
