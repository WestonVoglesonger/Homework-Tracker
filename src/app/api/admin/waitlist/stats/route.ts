import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminInterface } from "../../../../../interfaces/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await adminInterface.getWaitlistStats(session.user.id);

    return NextResponse.json(stats);
  } catch (error: unknown) {
    console.error("Error fetching waitlist stats:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
