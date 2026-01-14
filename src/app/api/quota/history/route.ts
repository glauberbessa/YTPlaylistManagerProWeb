import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotaHistory } from "@/lib/quota";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const history = await getQuotaHistory(session.user.id, 7);

    return NextResponse.json(history);
  } catch (error) {
    console.error("Erro ao buscar histórico de quota:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico de quota" },
      { status: 500 }
    );
  }
}
