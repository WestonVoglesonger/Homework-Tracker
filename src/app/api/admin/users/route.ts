import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { getAuth } from "@/lib/auth";
import { adminInterface } from "@/interfaces/admin";
import { z } from "zod";
import { logApiError } from "@/services/errorLogService";
import { trackApiCall } from "@/services/analyticsService";

const getUsersSchema = z.object({
  isAdmin: z.string().transform(val => val === "true").optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  offset: z.string().transform(val => parseInt(val)).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let session: Session | null = null;
  
  try {
    const { authOptions } = await getAuth();
    session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const qp = (key: string) => {
      const v = searchParams.get(key);
      return v === null ? undefined : v;
    };
    const parsed = getUsersSchema.safeParse({
      isAdmin: qp("isAdmin"),
      limit: qp("limit"),
      offset: qp("offset"),
    });

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.issues[0]?.message || "Invalid query parameters" 
      }, { status: 400 });
    }

    const users = await adminInterface.getAllUsers(session.user.id, parsed.data);

    // Track the API call
    await trackApiCall("/api/admin/users", "GET", req, session.user.id);

    return NextResponse.json(users);

  } catch (error) {
    await logApiError(req, error as Error, session?.user?.id);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
