import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";
import { checkQuotaAvailable, calculateAssignCost } from "@/lib/quota";

interface AssignRequest {
  playlistId: string;
  videoIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: AssignRequest = await request.json();

    if (!body.playlistId) {
      return NextResponse.json(
        { error: "ID da playlist é obrigatório" },
        { status: 400 }
      );
    }

    if (!body.videoIds || body.videoIds.length === 0) {
      return NextResponse.json(
        { error: "Nenhum vídeo selecionado" },
        { status: 400 }
      );
    }

    // Verificar quota disponível
    const requiredQuota = calculateAssignCost(body.videoIds.length);
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

    const result = await youtubeService.assignVideosToPlaylist(
      body.playlistId,
      body.videoIds
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao atribuir vídeos:", error);
    return NextResponse.json(
      { error: "Erro ao atribuir vídeos" },
      { status: 500 }
    );
  }
}
