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
  const data = await canvasService.listCanvasAssignments(access, courseId);
  return NextResponse.json(data);
}


