import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const playlistId = params.id;

    if (!playlistId) {
      return NextResponse.json(
        { error: "ID da playlist é obrigatório" },
        { status: 400 }
      );
    }

    const youtubeService = new YouTubeService(
      session.accessToken,
      session.user.id
    );

    const items = await youtubeService.getPlaylistItems(playlistId);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Erro ao buscar itens da playlist:", error);
    return NextResponse.json(
      { error: "Erro ao buscar itens da playlist" },
      { status: 500 }
    );
  }
}
