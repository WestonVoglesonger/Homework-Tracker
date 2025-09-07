import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminInterface } from "../../../../../interfaces/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { waitlistId, convertAll } = body;

    if (convertAll) {
      const count = await adminInterface.convertAllWaitlistUsers(session.user.id);
      return NextResponse.json({ success: true, converted: count });
    } else if (waitlistId) {
      const result = await adminInterface.convertWaitlistUser(session.user.id, waitlistId);
      return NextResponse.json({ success: true, user: result });
    } else {
      return NextResponse.json({ error: "Missing waitlistId or convertAll parameter" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Error converting waitlist user:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
