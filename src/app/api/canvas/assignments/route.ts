import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { canvasTokenService } = await import("../../../../services/canvasService");
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { canvasService } = await import("../../../../services/canvasService");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  const access = await canvasTokenService.getAccessTokenForUser(session.user.id);
  if (!access) return NextResponse.json({ error: "Not connected" }, { status: 401 });
  const items = await canvasService.listCanvasAssignments(access, courseId);
  // Enrich with submission status
  const enriched = await Promise.all(
    items.map(async (a) => {
      try {
        const sub = await canvasService.getSubmissionForSelf(access, courseId, a.canvasId!);
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


