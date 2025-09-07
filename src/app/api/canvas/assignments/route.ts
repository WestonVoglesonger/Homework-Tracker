import { NextRequest, NextResponse } from "next/server";
import { CanvasSubmission } from "../../../../services/canvasService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { canvasInterface } = await import("../../../../interfaces/canvasInterface");

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
        const sub = await canvasInterface.getSubmissionForSelf(session.user.id, courseId, a.canvasId!) as CanvasSubmission | null;
        const wf = sub?.workflow_state;
        const status = wf === "graded" ? "GRADED" : wf === "submitted" || wf === "pending_review" ? "SUBMITTED" : "NOT_SUBMITTED";
        return { ...a, status };
      } catch {
        return a;
      }
    })
  );
  return NextResponse.json(enriched);
}


