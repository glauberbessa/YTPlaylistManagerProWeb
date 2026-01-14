import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const configs = await prisma.channelConfig.findMany({
      where: { userId: session.user.id },
      orderBy: { title: "asc" },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Erro ao buscar configurações de canais:", error);
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
      body.map(async (config: { channelId: string; title: string; isEnabled: boolean }) => {
        return prisma.channelConfig.upsert({
          where: {
            userId_channelId: {
              userId: session.user.id,
              channelId: config.channelId,
            },
          },
          update: {
            title: config.title,
            isEnabled: config.isEnabled,
          },
          create: {
            userId: session.user.id,
            channelId: config.channelId,
            title: config.title,
            isEnabled: config.isEnabled,
          },
        });
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erro ao salvar configurações de canais:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
