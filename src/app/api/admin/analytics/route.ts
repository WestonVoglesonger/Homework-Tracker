import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { z } from "zod";
import { getAdminService, getAnalyticsService, getErrorLogService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

const getAnalyticsSchema = z.object({
  timeRange: z.enum(["day", "week", "month"]).default("day"),
  type: z.enum(["dashboard", "system", "events"]).default("dashboard"),
  event: z.string().optional(),
  userId: z.string().optional(),
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const qp = (key: string) => {
      const v = searchParams.get(key);
      return v === null ? undefined : v;
    };
    const parsed = getAnalyticsSchema.safeParse({
      timeRange: qp("timeRange"),
      type: qp("type"),
      event: qp("event"),
      userId: qp("userId"),
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

    // Check admin permissions
    const adminService = getAdminService(prisma);
    const isAdmin = await adminService.isAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { type, timeRange, ...filters } = parsed.data;
    const analyticsService = getAnalyticsService(prisma);

    let result;

    switch (type) {
      case "dashboard":
        result = await analyticsService.getDashboardMetrics(timeRange);
        break;
      case "system":
        result = await analyticsService.getSystemMetrics();
        break;
      case "events":
        const eventFilters = {
          ...filters,
          startDate: filters.startDate ? new Date(filters.startDate) : undefined,
          endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        };
        result = await analyticsService.getEvents(eventFilters);
        break;
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    // Track the API call
    await analyticsService.trackUserActivity(session.user.id, "API: GET /api/admin/analytics");

    return NextResponse.json(result);

  } catch (error) {
    // Log the error using OOP service
    const errorLogService = getErrorLogService(prisma);
    await errorLogService.logApiError("/api/admin/analytics", "GET", error as Error, session?.user?.id);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
