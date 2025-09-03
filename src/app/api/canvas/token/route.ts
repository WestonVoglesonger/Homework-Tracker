import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { canvasInterface } = await import("../../../../interfaces/canvasInterface");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const accessToken = (body as any)?.accessToken as string | undefined;
  if (!accessToken) return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
  await canvasInterface.upsertCanvasAccount(session.user.id, { access_token: accessToken });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { canvasInterface } = await import("../../../../interfaces/canvasInterface");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await canvasInterface.deleteCanvasAccount(session.user.id);
  return NextResponse.json({ ok: true });
}


