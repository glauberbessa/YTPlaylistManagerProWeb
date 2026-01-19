import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";
import { checkQuotaAvailable } from "@/lib/quota";
import { calculateRemoveCost } from "@/lib/quota.shared";

export const dynamic = "force-dynamic";

interface RemoveRequest {
  sourcePlaylistId: string;
  videos: Array<{
    playlistItemId: string;
    videoId: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: RemoveRequest = await request.json();

    if (!body.sourcePlaylistId) {
      return NextResponse.json(
        { error: "ID da playlist de origem é obrigatório" },
        { status: 400 }
      );
    }

    if (!body.videos || body.videos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum vídeo selecionado" },
        { status: 400 }
      );
    }

    const requiredQuota = calculateRemoveCost(body.videos.length);
    const hasQuota = await checkQuotaAvailable(session.user.id, requiredQuota);

    if (!hasQuota) {
      return NextResponse.json(
        {
          error: "Quota insuficiente para esta operação",
          requiredQuota,
        },
        { status: 429 }
      );
    }

    const youtubeService = new YouTubeService(
      session.accessToken,
      session.user.id
    );

    let removed = 0;
    let errors = 0;
    const details: Array<{
      videoId: string;
      status: "success" | "error";
      error?: string;
    }> = [];

    for (const video of body.videos) {
      const result = await youtubeService.removeVideoFromPlaylist(
        video.playlistItemId
      );
      if (result.success) {
        removed++;
        details.push({ videoId: video.videoId, status: "success" });
      } else {
        errors++;
        details.push({
          videoId: video.videoId,
          status: "error",
          error: result.error || "Erro ao remover vídeo",
        });
      }
    }

    return NextResponse.json({
      success: errors === 0,
      removed,
      errors,
      details,
    });
  } catch (error) {
    console.error("Erro ao remover vídeos da playlist:", error);
    return NextResponse.json(
      { error: "Erro ao remover vídeos da playlist" },
      { status: 500 }
    );
  }
}
