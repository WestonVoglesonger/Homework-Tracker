import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { canvasTokenService } from "../../../../services/canvasService";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const accessToken = body?.accessToken as string | undefined;
  if (!accessToken) return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
  await canvasTokenService.upsertCanvasAccount(session.user.id, { access_token: accessToken });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await canvasTokenService.deleteCanvasAccount(session.user.id);
  return NextResponse.json({ ok: true });
}


