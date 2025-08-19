import { NextResponse } from "next/server";
import prisma from "../../../../db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { canvasService } from "../../../../services/canvasService";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await prisma.account.findFirst({ where: { userId: session.user.id, provider: "canvas" } });
  if (!account?.access_token) return NextResponse.json({ error: "Not connected" }, { status: 401 });
  const data = await canvasService.listCanvasCourses(account.access_token);
  return NextResponse.json(data);
}


