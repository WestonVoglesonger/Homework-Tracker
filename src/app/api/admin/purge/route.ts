import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { auth } = await import("../../../../lib/auth");
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { adminInterface } = await import("../../../../interfaces/admin");
  // Support optional target in body; default to current user
  let targetUserId: string | undefined;
  try {
    const body = await req.json().catch(() => null);
    targetUserId = body?.targetUserId as string | undefined;
  } catch {
    // ignore malformed body
  }
  const res = await adminInterface.purgeUserData(session.user.id, targetUserId || session.user.id);
  return NextResponse.json({ ok: true, ...res });
}


