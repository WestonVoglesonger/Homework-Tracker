import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Verify this is an authorized request (e.g., from a cron job)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { canvasAdminInterface } = await import("../../../../interfaces/canvasInterface");
    const results = await canvasAdminInterface.syncAllUsers();
    return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Canvas sync failed:", error);
    return NextResponse.json({ error: "Sync failed", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
