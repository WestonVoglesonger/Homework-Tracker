import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Get user session for authentication
    const { authOptions } = await getAuth();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Import the Canvas integration service
    const { PrismaClient } = await import("@prisma/client");
    const { getCanvasIntegrationService } = await import("../../../../../services/container/ServiceContainer");

    const db = new PrismaClient();
    const canvasService = getCanvasIntegrationService(db);
    const results = await canvasService.syncUser(session.user.id);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
      message: "Canvas data synced successfully"
    });
  } catch (error) {
    console.error("Manual Canvas sync failed:", error);
    return NextResponse.json({
      error: "Sync failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
