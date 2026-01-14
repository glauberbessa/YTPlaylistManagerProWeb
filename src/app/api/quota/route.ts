import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/quota";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const quotaStatus = await getQuotaStatus(session.user.id);

    return NextResponse.json(quotaStatus);
  } catch (error) {
    console.error("Erro ao buscar status de quota:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status de quota" },
      { status: 500 }
    );
  }
}
