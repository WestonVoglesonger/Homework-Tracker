import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { canvasTokenService } = await import("../../../../services/canvasService");
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { canvasService } = await import("../../../../services/canvasService");
  const { courseService } = await import("../../../../services/courseService");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await canvasTokenService.getAccessTokenForUser(session.user.id);
  if (!access) return NextResponse.json({ error: "Not connected" }, { status: 401 });
  const data = await canvasService.listCanvasCourses(access);
  const imports = await courseService.list(session.user.id);
  const importedIds = new Set(imports.filter((c) => c.source === "canvas" && !!c.canvasId).map((c) => c.canvasId as string));
  const annotated = data.map((c) => ({ ...c, isImported: c.canvasId ? importedIds.has(c.canvasId) : false }));
  return NextResponse.json(annotated);
}


