import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import { analyticsInterface } from "@/interfaces/analyticsInterface";
import { errorLogInterface } from "@/interfaces/errorLogInterface";
import { z } from "zod";

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
  let session: Session | null = null;
  
  try {
    session = await auth();
    
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
    await analyticsInterface.trackEvent({
      event: "api_call",
      data: { endpoint: "/api/admin/analytics", method: "GET" },
      userId: session.user.id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(result);

  } catch (error) {
    // Log the error using the interface
    await errorLogInterface.createErrorLog({
      level: "ERROR",
      message: (error as Error).message,
      stack: (error as Error).stack,
      context: {
        userId: session?.user?.id,
        endpoint: req.nextUrl.pathname,
        method: req.method,
        userAgent: req.headers.get("user-agent") || undefined,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
        additionalData: { adminOperation: true },
      },
    }, session?.user?.id);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
