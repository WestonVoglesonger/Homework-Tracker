import { analyticsService, type AnalyticsEvent } from "@/services/analyticsService";
import { adminService } from "@/services/adminService";

export const analyticsInterface = {
  async trackEvent(event: AnalyticsEvent) {
    return await analyticsService.track(event);
  },

  async getDashboardMetrics(
    adminUserId: string,
    timeRange: "day" | "week" | "month" = "day"
  ) {
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await analyticsService.getDashboardMetrics(timeRange);
  },

  async getSystemMetrics(adminUserId: string) {
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await analyticsService.getSystemMetrics();
  },

  async getEvents(
    adminUserId: string,
    filters?: {
      event?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await analyticsService.getEvents(filters);
  },

  async cleanupOldAnalytics(adminUserId: string, daysOld: number = 90) {
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const result = await analyticsService.deleteOld(daysOld);

    // Log admin action
    await adminService.logAdminAction({
      action: "analytics_cleanup",
      targetType: "analytics",
      data: { daysOld, deletedCount: result.count },
      adminId: adminUserId,
    });

    return result;
  },
};
