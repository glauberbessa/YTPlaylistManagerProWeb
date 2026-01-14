import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";

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

    // Buscar configurações das playlists
    const configs = await prisma.playlistConfig.findMany({
      where: { userId: session.user.id },
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

    return NextResponse.json(playlistsWithConfig);
  } catch (error) {
    console.error("Erro ao buscar playlists:", error);
    return NextResponse.json(
      { error: "Erro ao buscar playlists" },
      { status: 500 }
    );
  }
}
