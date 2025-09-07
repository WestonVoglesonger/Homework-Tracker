import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/adminService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = `last_canvas_sync_${session.user.id}`;
  const value = await adminService.getSystemSetting(key);
  return NextResponse.json({ lastSyncedAt: value || null });
}


