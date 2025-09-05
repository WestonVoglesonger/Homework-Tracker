import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { z } from "zod";
import { getAdminService, getErrorLogService, getAnalyticsService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

const getUsersSchema = z.object({
  isAdmin: z.string().transform(val => val === "true").optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  offset: z.string().transform(val => parseInt(val)).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let session: any = null;

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

    // Check admin permissions
    const adminService = getAdminService(prisma);
    const isAdmin = await adminService.isAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const users = await adminService.getAllUsers(parsed.data);

    // Track the API call using OOP service
    const analyticsService = getAnalyticsService(prisma);
    await analyticsService.trackUserActivity(session.user.id, "API: GET /api/admin/users");

    return NextResponse.json(users);

  } catch (error) {
    const errorLogService = getErrorLogService(prisma);
    await errorLogService.logApiError("/api/admin/users", "GET", error as Error, session?.user?.id);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
