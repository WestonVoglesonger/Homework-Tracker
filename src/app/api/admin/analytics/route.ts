import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { analyticsInterface } from "@/interfaces/analyticsInterface";
import { z } from "zod";
import { logApiError } from "@/services/errorLogService";
import { trackApiCall } from "@/services/analyticsService";

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

    const { type, timeRange, ...filters } = parsed.data;

    let result;
    
    switch (type) {
      case "dashboard":
        result = await analyticsInterface.getDashboardMetrics(session.user.id, timeRange);
        break;
      case "system":
        result = await analyticsInterface.getSystemMetrics(session.user.id);
        break;
      case "events":
        const eventFilters = {
          ...filters,
          startDate: filters.startDate ? new Date(filters.startDate) : undefined,
          endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        };
        result = await analyticsInterface.getEvents(session.user.id, eventFilters);
        break;
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    // Track the API call
    await trackApiCall("/api/admin/analytics", "GET", req, session.user.id);

    return NextResponse.json(result);

  } catch (error) {
    await logApiError(req, error as Error, session?.user?.id);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
