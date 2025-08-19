import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { canvasService } from "../../../../services/canvasService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  const account = await prisma.account.findFirst({ where: { userId: session.user.id, provider: "canvas" } });
  if (!account?.access_token) return NextResponse.json({ error: "Not connected" }, { status: 401 });
  const data = await canvasService.listCanvasAssignments(account.access_token, courseId);
  return NextResponse.json(data);
}


