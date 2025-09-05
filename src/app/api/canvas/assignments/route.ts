import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { PrismaClient } = await import("@prisma/client");
  const { getCanvasIntegrationService } = await import("../../../../services/container/ServiceContainer");

  const db = new PrismaClient();
  const canvasInterface = getCanvasIntegrationService(db);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });

  const items = await canvasInterface.listCanvasAssignments(session.user.id, courseId);
  if (items.length === 0) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  // Enrich with submission status
  const enriched = await Promise.all(
    items.map(async (a) => {
      try {
        if (!session.user?.id) return a;
        const sub = await canvasInterface.getSubmissionForSelf(session.user.id, courseId, a.canvasId!);
        const wf = (sub as any)?.workflow_state as string | undefined;
        const status = wf === "graded" ? "GRADED" : wf === "submitted" || wf === "pending_review" ? "SUBMITTED" : "NOT_SUBMITTED";
        return { ...a, status };
      } catch {
        return a;
      }
    })
  );
  return NextResponse.json(enriched);
}


