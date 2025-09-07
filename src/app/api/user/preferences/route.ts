import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userInterface } = await import("@/interfaces/user");
  const prefs = await userInterface.getPreferences(session.user.id);
  return NextResponse.json(prefs);
}

export async function POST(req: NextRequest) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const canvasSetupDismissed = typeof body.canvasSetupDismissed === "boolean" ? body.canvasSetupDismissed : undefined;

  const { userInterface } = await import("@/interfaces/user");
  const prefs = await userInterface.updatePreferences(session.user.id, { canvasSetupDismissed });
  return NextResponse.json(prefs);
}


