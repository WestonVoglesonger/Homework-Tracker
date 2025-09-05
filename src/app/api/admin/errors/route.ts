import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { z } from "zod";
import { getAdminService, getErrorLogService, getAnalyticsService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

const getErrorsSchema = z.object({
  level: z.enum(["ERROR", "WARN", "INFO", "DEBUG"]).optional(),
  userId: z.string().optional(),
  resolved: z.string().transform(val => val === "true").optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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

    // Check admin permissions
    const adminService = getAdminService(prisma);
    const isAdmin = await adminService.isAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const qp = (key: string) => {
      const v = searchParams.get(key);
      return v === null ? undefined : v;
    };
    const parsed = getErrorsSchema.safeParse({
      level: qp("level"),
      userId: qp("userId"),
      resolved: qp("resolved"),
      startDate: qp("startDate"),
      endDate: qp("endDate"),
      limit: qp("limit"),
      offset: qp("offset"),
    });

    if (!parsed.success) {
      return NextResponse.json({
        error: parsed.error.issues[0]?.message || "Invalid query parameters"
      }, { status: 400 });
    }

    const errorLogService = getErrorLogService(prisma);
    const errorLogs = await errorLogService.getErrorLogs(parsed.data.limit || 100, parsed.data.userId);

    // Track the API call
    const analyticsService = getAnalyticsService(prisma);
    await analyticsService.trackUserActivity(session.user.id, "API: GET /api/admin/errors");

    return NextResponse.json(errorLogs);

  } catch (error) {
    // Log the error using OOP service
    const errorLogService = getErrorLogService(prisma);
    await errorLogService.logApiError("/api/admin/errors", "GET", error as Error, session?.user?.id);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let session: any = null;

  try {
    const { authOptions } = await getAuth();
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    const adminService = getAdminService(prisma);
    const isAdmin = await adminService.isAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, errorLogId } = body;

    if (action === "resolve" && errorLogId) {
      const errorLogService = getErrorLogService(prisma);
      const result = await errorLogService.resolveErrorLog(errorLogId, session.user.id);

      // Track the API call
      const analyticsService = getAnalyticsService(prisma);
      await analyticsService.trackUserActivity(session.user.id, "API: POST /api/admin/errors");

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    // Log the error using OOP service
    const errorLogService = getErrorLogService(prisma);
    await errorLogService.logApiError("/api/admin/errors", "POST", error as Error, session?.user?.id);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
