import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { auth } = await import("../../../../lib/auth");
  const { canvasInterface } = await import("../../../../interfaces/canvasInterface");
  const { prisma } = await import("../../../../db/client");

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Verify the user exists in the database
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found in database" }, { status: 404 });
  }
  
  const body = await req.json().catch(() => ({}));
  const accessToken = (body as { accessToken?: string })?.accessToken;
  if (!accessToken) return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
  
  try {
    await canvasInterface.upsertCanvasAccount(session.user.id, { access_token: accessToken });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Canvas token upsert error:", error);
    return NextResponse.json({ error: "Failed to save Canvas token" }, { status: 500 });
  }
}

export async function DELETE() {
  const { auth } = await import("../../../../lib/auth");
  const { canvasInterface } = await import("../../../../interfaces/canvasInterface");
  const { prisma } = await import("../../../../db/client");

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Verify the user exists in the database
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found in database" }, { status: 404 });
  }
  
  try {
    await canvasInterface.deleteCanvasAccount(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Canvas token delete error:", error);
    return NextResponse.json({ error: "Failed to delete Canvas token" }, { status: 500 });
  }
}


