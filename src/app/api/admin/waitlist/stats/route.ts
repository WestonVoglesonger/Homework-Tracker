import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getAuth } from "@/lib/auth";
import { adminInterface } from "../../../../../interfaces/admin";

export async function GET() {
  try {
    const { authOptions } = await getAuth();
    const session = await getServerSession(authOptions);
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
