import { errorLogService, type ErrorLevel, type CreateErrorLogInput } from "@/services/errorLogService";
import { adminInterface } from "@/interfaces/admin";

export const errorLogInterface = {
  async createErrorLog(input: CreateErrorLogInput, userId?: string) {
    // Add user context if available
    if (userId && input.context) {
      input.context.userId = userId;
    }

    return await errorLogService.create(input);
  },

  async getErrorLogs(
    adminUserId: string,
    filters?: {
      level?: ErrorLevel;
      userId?: string;
      resolved?: boolean;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    // Verify admin permissions
    const isAdmin = await adminInterface.isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await errorLogService.list(filters);
  },

  async getErrorLogById(adminUserId: string, errorLogId: string) {
    const isAdmin = await adminInterface.isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await errorLogService.getById(errorLogId);
  },

  async resolveErrorLog(adminUserId: string, errorLogId: string) {
    const isAdmin = await adminInterface.isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const result = await errorLogService.resolve(errorLogId, adminUserId);

    // Log admin action
    const { adminService } = await import("@/services/adminService");
    await adminService.logAdminAction({
      action: "error_resolve",
      targetId: errorLogId,
      targetType: "error_log",
      adminId: adminUserId,
    });

    return result;
  },

  async getErrorStats(
    adminUserId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const isAdmin = await adminInterface.isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await errorLogService.getStats(filters);
  },

  async cleanupOldErrors(adminUserId: string, daysOld: number = 30) {
    const isAdmin = await adminInterface.isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const result = await errorLogService.deleteOld(daysOld);

    // Log admin action
    const { adminService } = await import("@/services/adminService");
    await adminService.logAdminAction({
      action: "error_cleanup",
      targetType: "error_log",
      data: { daysOld, deletedCount: result.count },
      adminId: adminUserId,
    });

    return result;
  },
};
