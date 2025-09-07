import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { auth } = await import("../../../../lib/auth");
  const { canvasInterface } = await import("../../../../interfaces/canvasInterface");
  const { courseInterface } = await import("../../../../interfaces/course");

  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await canvasInterface.listCanvasCourses(session.user.id);
    if (data.length === 0) return NextResponse.json({ error: "Not connected" }, { status: 401 });

    const imports = await courseInterface.listForUser(session.user.id);
    const importedIds = new Set(imports.filter((c) => c.source === "canvas" && !!c.canvasId).map((c) => c.canvasId as string));
    const annotated = data.map((c) => ({ ...c, isImported: c.canvasId ? importedIds.has(c.canvasId) : false }));
    return NextResponse.json(annotated);
  } catch (error) {
    console.error("Canvas API error:", error);
    return NextResponse.json(
      { error: "Canvas integration error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


