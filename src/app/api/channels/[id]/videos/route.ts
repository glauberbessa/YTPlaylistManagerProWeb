import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const channelId = params.id;

    if (!channelId) {
      return NextResponse.json(
        { error: "ID do canal é obrigatório" },
        { status: 400 }
      );
    }

    const youtubeService = new YouTubeService(
      session.accessToken,
      session.user.id
    );

    // ATENÇÃO: Esta operação custa 100 unidades de quota!
    const videos = await youtubeService.getChannelVideos(channelId);

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Erro ao buscar vídeos do canal:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vídeos do canal" },
      { status: 500 }
    );
  }
}
