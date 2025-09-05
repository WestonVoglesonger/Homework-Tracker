import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../../lib/auth");
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { PrismaClient } = await import("@prisma/client");
  const { getCanvasIntegrationService } = await import("../../../../../services/container/ServiceContainer");

  const db = new PrismaClient();
  const canvasService = getCanvasIntegrationService(db);
  const result = await canvasService.syncUser(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 401 });
  return NextResponse.json(result);
}


