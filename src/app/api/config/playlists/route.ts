import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const configs = await prisma.playlistConfig.findMany({
      where: { userId: session.user.id },
      orderBy: { title: "asc" },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Erro ao buscar configurações de playlists:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Formato inválido" },
        { status: 400 }
      );
    }

    // Atualizar ou criar configurações
    const results = await Promise.all(
      body.map(async (config: { playlistId: string; title: string; isEnabled: boolean }) => {
        return prisma.playlistConfig.upsert({
          where: {
            userId_playlistId: {
              userId: session.user.id,
              playlistId: config.playlistId,
            },
          },
          update: {
            title: config.title,
            isEnabled: config.isEnabled,
          },
          create: {
            userId: session.user.id,
            playlistId: config.playlistId,
            title: config.title,
            isEnabled: config.isEnabled,
          },
        });
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erro ao salvar configurações de playlists:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
