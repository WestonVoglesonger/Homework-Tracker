import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { canvasTokenService } from "../../../../../services/canvasService";

export async function GET(req: NextRequest) {
  const base = process.env.CANVAS_BASE_URL || "";
  const clientId = process.env.CANVAS_CLIENT_ID || "";
  const clientSecret = process.env.CANVAS_CLIENT_SECRET || "";
  const redirect = process.env.CANVAS_REDIRECT_URL || "";
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


