import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getAuth } from "@/lib/auth";
import { adminInterface } from "../../../../interfaces/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { authOptions } = await getAuth();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const converted = searchParams.get('converted') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const waitlistUsers = await adminInterface.getWaitlistUsers(session.user.id, {
      converted,
      limit,
      offset,
    });

    return NextResponse.json({ users: waitlistUsers });
  } catch (error: unknown) {
    console.error("Error fetching waitlist users:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
