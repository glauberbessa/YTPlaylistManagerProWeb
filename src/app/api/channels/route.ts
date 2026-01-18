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

    const channels = await youtubeService.getSubscribedChannels();

    // Buscar configurações dos canais
    const configs = await prisma.channelConfig.findMany({
      where: { userId: session.user.id },
    });

    // Mesclar canais com configurações
    const channelsWithConfig = channels.map((channel) => {
      const config = configs.find((c) => c.channelId === channel.id);
      return {
        ...channel,
        config: config
          ? {
              id: config.id,
              channelId: config.channelId,
              title: config.title,
              isEnabled: config.isEnabled,
              subscriptionDate: config.subscriptionDate?.toISOString(),
              totalDurationSeconds: config.totalDurationSeconds,
            }
          : undefined,
      };
    });

    return NextResponse.json(channelsWithConfig);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar canais", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
