import prisma from "@/db/client";
import type { NextRequest } from "next/server";
import  { Prisma } from "@prisma/client";

export interface AnalyticsEvent {
  event: string;
  data?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

export const analyticsService = {
  async track(input: AnalyticsEvent) {
    try {
      return await prisma.analytics.create({
        data: {
          event: input.event,
          data: input.data ? JSON.parse(JSON.stringify(input.data)) : null,
          userId: input.userId,
          sessionId: input.sessionId,
          ip: input.ip,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      // Fallback logging to console if database fails
      console.error("Failed to track analytics event:", error);
      console.error("Original event:", input);
      return null;
    }
  },

  async getEvents(filters?: {
    event?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (filters?.event) where.event = filters.event;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    return await prisma.analytics.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });
  },

  async getDashboardMetrics(timeRange: "day" | "week" | "month" = "day") {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case "day":
        startDate.setDate(now.getDate() - 1);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const [
      totalEvents,
      uniqueUsers,
      topEvents,
      userActivity,
      pageViews,
    ] = await Promise.all([
      // Total events
      prisma.analytics.count({
        where: { timestamp: { gte: startDate } },
      }),

      // Unique users
      prisma.analytics.findMany({
        where: { 
          timestamp: { gte: startDate },
          userId: { not: null },
        },
        distinct: ["userId"],
        select: { userId: true },
      }).then(users => users.length),

      // Top events
      prisma.analytics.groupBy({
        by: ["event"],
        where: { timestamp: { gte: startDate } },
        _count: { event: true },
        orderBy: { _count: { event: "desc" } },
        take: 10,
      }),

      // User activity over time (hourly for day, daily for week/month)
      this.getUserActivityOverTime(startDate, timeRange),

      // Page views
      prisma.analytics.count({
        where: {
          timestamp: { gte: startDate },
          event: "page_view",
        },
      }),
    ]);

    return {
      totalEvents,
      uniqueUsers,
      pageViews,
      topEvents: topEvents.map(item => ({
        event: item.event,
        count: item._count.event,
      })),
      userActivity,
    };
  },

  async getUserActivityOverTime(startDate: Date, timeRange: "day" | "week" | "month") {
    // This would be more complex in a real implementation
    // For now, we'll do a simple grouping by date
    const rawData = await prisma.$queryRaw(
      Prisma.sql`
      SELECT
        DATE_TRUNC('hour', timestamp) as period,
        COUNT(*) as count
      FROM "Analytics"
      WHERE timestamp >= ${startDate}
      GROUP BY DATE_TRUNC('hour', timestamp)
      ORDER BY period ASC
      `
    ) as Array<{ period: Date; count: bigint }>;

    return rawData.map(item => ({
      period: item.period.toISOString(),
      count: Number(item.count),
    }));
  },

  async getSystemMetrics() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsersToday,
      activeUsersWeek,
      totalCourses,
      totalAssignments,
      errorCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.analytics.findMany({
        where: { 
          timestamp: { gte: dayAgo },
          userId: { not: null },
        },
        distinct: ["userId"],
        select: { userId: true },
      }).then(users => users.length),
      prisma.analytics.findMany({
        where: { 
          timestamp: { gte: weekAgo },
          userId: { not: null },
        },
        distinct: ["userId"],
        select: { userId: true },
      }).then(users => users.length),
      prisma.course.count(),
      prisma.assignment.count(),
      prisma.errorLog.count({
        where: { timestamp: { gte: dayAgo } },
      }),
    ]);

    return {
      totalUsers,
      activeUsersToday,
      activeUsersWeek,
      totalCourses,
      totalAssignments,
      errorCount,
    };
  },

  async deleteOld(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await prisma.analytics.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });
  },
};

// Helper function to track events from API routes
export async function trackEvent(
  event: string,
  req?: NextRequest,
  userId?: string,
  data?: Record<string, any>
) {
  const analyticsData: AnalyticsEvent = {
    event,
    data,
    userId,
  };

  if (req) {
    analyticsData.ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                      req.headers.get("x-real-ip") || undefined;
    analyticsData.userAgent = req.headers.get("user-agent") || undefined;
  }

  return await analyticsService.track(analyticsData);
}

// Common event tracking functions
export const trackPageView = (page: string, req?: NextRequest, userId?: string) =>
  trackEvent("page_view", req, userId, { page });

export const trackUserAction = (action: string, req?: NextRequest, userId?: string, data?: Record<string, any>) =>
  trackEvent("user_action", req, userId, { action, ...data });

export const trackApiCall = (endpoint: string, method: string, req?: NextRequest, userId?: string) =>
  trackEvent("api_call", req, userId, { endpoint, method });
