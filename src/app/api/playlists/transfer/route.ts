import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";
import { checkQuotaAvailable } from "@/lib/quota";
import { calculateTransferCost } from "@/lib/quota.shared";

export const dynamic = "force-dynamic";

interface TransferRequest {
  sourcePlaylistId: string;
  destinationPlaylistId: string;
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

    const body: TransferRequest = await request.json();

    if (!body.sourcePlaylistId || !body.destinationPlaylistId) {
      return NextResponse.json(
        { error: "IDs das playlists são obrigatórios" },
        { status: 400 }
      );
    }

    if (!body.videos || body.videos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum vídeo selecionado" },
        { status: 400 }
      );
    }

    if (body.sourcePlaylistId === body.destinationPlaylistId) {
      return NextResponse.json(
        { error: "Playlist de origem e destino são iguais" },
        { status: 400 }
      );
    }

    // Verificar quota disponível
    const requiredQuota = calculateTransferCost(body.videos.length);
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

    const result = await youtubeService.transferVideos(
      body.sourcePlaylistId,
      body.destinationPlaylistId,
      body.videos
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao transferir vídeos:", error);
    return NextResponse.json(
      { error: "Erro ao transferir vídeos" },
      { status: 500 }
    );
  }
}
