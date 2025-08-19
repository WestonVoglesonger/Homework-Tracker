import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { canvasTokenService } = await import("../../../../../services/canvasService");

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  // Exchange code for token
  const tokenJson = await canvasTokenService.exchangeCodeForToken(code);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Upsert account for provider "canvas"
  await canvasTokenService.upsertCanvasAccount(session.user.id, tokenJson);

  return NextResponse.redirect(new URL("/settings", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}


