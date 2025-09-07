import { NextRequest, NextResponse } from "next/server";
import { isValidOrigin } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Origin validation
    if (!isValidOrigin(req as unknown as Request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
    }

    // Check user limit
    const { waitlistInterface } = await import("../../../interfaces/waitlist");
    const { waitlistService } = await import("../../../services/waitlistService");

    const [maxUsers, activeUsers] = await Promise.all([
      waitlistService.getMaxUserLimit(),
      waitlistService.getTotalUserCount(),
    ]);
    const isLimitReached = await waitlistInterface.checkUserLimit();

    const response = NextResponse.json({
      limitReached: isLimitReached,
      maxUsers,
      activeUsers
    });

    // Cache for a short time to avoid too many database calls
    response.headers.set("Cache-Control", "public, max-age=60"); // Cache for 1 minute
    return response;
  } catch (err: unknown) {
    console.error("Error checking user limit:", err);
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    return response;
  }
}
