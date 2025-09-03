import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("@/lib/auth");
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userPreferenceService } = await import("@/services/userPreferenceService");
  const prefs = await userPreferenceService.get(session.user.id);
  return NextResponse.json(prefs);
}

export async function POST(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("@/lib/auth");
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const canvasSetupDismissed = typeof body.canvasSetupDismissed === "boolean" ? body.canvasSetupDismissed : undefined;

  const { userPreferenceService } = await import("@/services/userPreferenceService");
  const prefs = await userPreferenceService.update(session.user.id, { canvasSetupDismissed });
  return NextResponse.json(prefs);
}


