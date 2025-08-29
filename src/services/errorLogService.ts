import prisma from "@/db/client";
import type { NextRequest } from "next/server";

export type ErrorLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  requestBody?: any;
  additionalData?: Record<string, any>;
}

export interface CreateErrorLogInput {
  level: ErrorLevel;
  message: string;
  stack?: string;
  context?: ErrorContext;
}

export const errorLogService = {
  async create(input: CreateErrorLogInput) {
    try {
      return await prisma.errorLog.create({
        data: {
          level: input.level,
          message: input.message,
          stack: input.stack,
          context: input.context ? JSON.parse(JSON.stringify(input.context)) : null,
          endpoint: input.context?.endpoint,
          method: input.context?.method,
          userAgent: input.context?.userAgent,
          ip: input.context?.ip,
          userId: input.context?.userId,
          sessionId: input.context?.sessionId,
        },
      });
    } catch (error) {
      // Fallback logging to console if database fails
      console.error("Failed to log error to database:", error);
      console.error("Original error:", input);
      return null;
    }
  },

  async list(filters?: {
    level?: ErrorLevel;
    userId?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (filters?.level) where.level = filters.level;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.resolved !== undefined) where.resolved = filters.resolved;
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    return await prisma.errorLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });
  },

  async getById(id: string) {
    return await prisma.errorLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  },

  async resolve(id: string, resolvedBy: string) {
    return await prisma.errorLog.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });
  },

  async getStats(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [
      total,
      byLevel,
      resolved,
      unresolved,
    ] = await Promise.all([
      prisma.errorLog.count({ where }),
      prisma.errorLog.groupBy({
        by: ["level"],
        where,
        _count: { level: true },
      }),
      prisma.errorLog.count({ where: { ...where, resolved: true } }),
      prisma.errorLog.count({ where: { ...where, resolved: false } }),
    ]);

    return {
      total,
      resolved,
      unresolved,
      byLevel: byLevel.reduce((acc, item) => {
        acc[item.level] = item._count.level;
        return acc;
      }, {} as Record<string, number>),
    };
  },

  async deleteOld(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await prisma.errorLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });
  },
};

// Helper function to extract context from Next.js request
export function extractRequestContext(req: NextRequest, userId?: string): ErrorContext {
  return {
    userId,
    endpoint: req.nextUrl.pathname,
    method: req.method,
    userAgent: req.headers.get("user-agent") || undefined,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        undefined,
  };
}

// Helper function to log errors with automatic context
export async function logError(
  level: ErrorLevel,
  message: string,
  error?: Error,
  context?: ErrorContext
) {
  await errorLogService.create({
    level,
    message,
    stack: error?.stack,
    context,
  });
}

// Helper function specifically for API route errors
export async function logApiError(
  req: NextRequest,
  error: Error,
  userId?: string,
  additionalContext?: Record<string, any>
) {
  // Skip routine/client-side errors to avoid noisy logs
  const msg = (error?.message || "").toLowerCase();
  const routine = [
    "unauthorized",
    "forbidden",
    "invalid credentials",
    "invalid admin password",
    "invalid input",
    "bad request",
    "not found",
    "too many requests",
    "csrf"
  ];
  if ((error as any)?.name === "ZodError" || routine.some(s => msg.includes(s))) {
    return;
  }

  const context = extractRequestContext(req, userId);
  if (additionalContext) {
    context.additionalData = additionalContext;
  }

  await logError("ERROR", error.message, error, context);
}
