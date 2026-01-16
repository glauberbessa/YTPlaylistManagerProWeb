import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const youtubeService = new YouTubeService(
      session.accessToken,
      session.user.id
    );

    const playlists = await youtubeService.getPlaylists();
    console.log("Playlists fetched from YouTube:", playlists.length);

    // Buscar configurações das playlists
    console.log("Fetching playlist configs for user:", session.user.id);
    const configs = await prisma.playlistConfig.findMany({
      where: { userId: session.user.id },
    });
    console.log("Configs found:", configs.length);

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

    return NextResponse.json(playlistsWithConfig);
  } catch (error) {
    console.error("Erro ao buscar playlists:", error);
    return NextResponse.json(
      { error: "Erro ao buscar playlists", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
