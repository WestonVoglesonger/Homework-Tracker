import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { waitlistService } = await import("../../../../services/waitlistService");
    const maxUsers = await waitlistService.getMaxUserLimit();
    const currentUsers = await waitlistService.getTotalUserCount();

    return NextResponse.json({
      maxUsers,
      currentUsers,
      canIncrease: true,
      minAllowed: currentUsers
    });
  } catch (error: unknown) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { maxUsers } = body;

    if (typeof maxUsers !== 'number' || maxUsers < 1) {
      return NextResponse.json({ error: "Invalid maxUsers value" }, { status: 400 });
    }

    const { waitlistService } = await import("../../../../services/waitlistService");
    await waitlistService.setMaxUserLimit(maxUsers, session.user.id);

    // Log admin action
    const { adminService } = await import("../../../../services/adminService");
    await adminService.logAdminAction({
      action: "settings_update",
      targetType: "system",
      data: { setting: "max_users", oldValue: "unknown", newValue: maxUsers.toString() },
      adminId: session.user.id,
    });

    return NextResponse.json({ success: true, maxUsers });
  } catch (error: unknown) {
    console.error("Error updating settings:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
