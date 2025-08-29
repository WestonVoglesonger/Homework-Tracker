import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { errorLogInterface } from "@/interfaces/errorLogInterface";
import { z } from "zod";
import { logApiError } from "@/services/errorLogService";
import { trackApiCall } from "@/services/analyticsService";

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

    const filters = {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    };

    const errorLogs = await errorLogInterface.getErrorLogs(session.user.id, filters);

    // Track the API call
    await trackApiCall("/api/admin/errors", "GET", req, session.user.id);

    return NextResponse.json(errorLogs);

  } catch (error) {
    await logApiError(req, error as Error, session?.user?.id);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

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

    const body = await req.json();
    const { action, errorLogId } = body;

    if (action === "resolve" && errorLogId) {
      const result = await errorLogInterface.resolveErrorLog(session.user.id, errorLogId);
      
      // Track the API call
      await trackApiCall("/api/admin/errors", "POST", req, session.user.id);

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    await logApiError(req, error as Error, session?.user?.id);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
