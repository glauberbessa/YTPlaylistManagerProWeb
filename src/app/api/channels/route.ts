import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { YouTubeService } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("[API/channels] Starting request...");
    const session = await auth();

    if (!session?.user?.id || !session.accessToken) {
      console.log("[API/channels] Unauthorized - no session or access token");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("[API/channels] User authenticated:", session.user.id);

    const youtubeService = new YouTubeService(
      session.accessToken,
      session.user.id
    );

    console.log("[API/channels] Fetching subscribed channels from YouTube...");
    const channels = await youtubeService.getSubscribedChannels();
    console.log("[API/channels] Channels fetched from YouTube:", channels.length);

    // Buscar configurações dos canais
    console.log("[API/channels] Fetching channel configs from database...");
    const configs = await prisma.channelConfig.findMany({
      where: { userId: session.user.id },
    });
    console.log("[API/channels] Configs found:", configs.length);

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

    console.log("[API/channels] Returning", channelsWithConfig.length, "channels");
    return NextResponse.json(channelsWithConfig);
  } catch (error) {
    console.error("[API/channels] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar canais", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
