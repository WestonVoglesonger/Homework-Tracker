import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { PrismaClient } = await import("@prisma/client");
  const { getCanvasIntegrationService, getCourseService } = await import("../../../../services/container/ServiceContainer");

  const db = new PrismaClient();
  const canvasInterface = getCanvasIntegrationService(db);
  const courseService = getCourseService(db);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await canvasInterface.listCanvasCourses(session.user.id);
  if (data.length === 0) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  const imports = await courseService.listCourses(session.user.id);
  const importedIds = new Set(imports.filter((c) => c.source === "canvas" && !!c.canvasId).map((c) => c.canvasId as string));
  const annotated = data.map((c) => ({ ...c, isImported: c.canvasId ? importedIds.has(c.canvasId) : false }));
  return NextResponse.json(annotated);
}


