import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { canvasTokenService } = await import("../../../../services/canvasService");
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { canvasService } = await import("../../../../services/canvasService");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await canvasTokenService.getAccessTokenForUser(session.user.id);
  if (!access) return NextResponse.json({ error: "Not connected" }, { status: 401 });
  const data = await canvasService.listCanvasCourses(access);
  return NextResponse.json(data);
}


