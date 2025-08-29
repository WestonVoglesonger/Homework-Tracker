import { assignmentService } from "@/services/assignmentService";
import { courseService } from "@/services/courseService";
import { adminService } from "@/services/adminService";

export const adminInterface = {
  async purgeUserData(adminUserId: string, targetUserId: string): Promise<{ assignmentsDeleted: number; coursesDeleted: number }> {
    // Verify admin permissions
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const a = await assignmentService.purgeAllForUser(targetUserId);
    const c = await courseService.purgeAllForUser(targetUserId);

    // Log admin action
    await adminService.logAdminAction({
      action: "user_data_purge",
      targetId: targetUserId,
      targetType: "user",
      data: { assignmentsDeleted: a.deleted, coursesDeleted: c.deleted },
      adminId: adminUserId,
    });

    return { assignmentsDeleted: a.deleted, coursesDeleted: c.deleted };
  },

  async promoteUserToAdmin(currentAdminId: string, targetUserId: string, adminPassword: string) {
    // For self-promotion (initial admin), skip the admin check
    if (currentAdminId === targetUserId) {
      return await adminService.promoteToAdmin(targetUserId, adminPassword, currentAdminId);
    }
    
    // For promoting others, verify current user is admin
    const isAdmin = await adminService.isAdmin(currentAdminId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await adminService.promoteToAdmin(targetUserId, adminPassword, currentAdminId);
  },

  async revokeAdminAccess(currentAdminId: string, targetUserId: string) {
    // Verify current user is admin
    const isAdmin = await adminService.isAdmin(currentAdminId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Prevent self-demotion
    if (currentAdminId === targetUserId) {
      throw new Error("Cannot revoke your own admin access");
    }

    return await adminService.revokeAdmin(targetUserId, currentAdminId);
  },

  async getAllUsers(adminUserId: string, filters?: {
    isAdmin?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await adminService.getAllUsers(filters);
  },

  async getUserDetails(adminUserId: string, targetUserId: string) {
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await adminService.getUserById(targetUserId);
  },

  async getAdminActions(adminUserId: string, filters?: {
    adminId?: string;
    action?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await adminService.getAdminActions(filters);
  },

  async deleteUser(adminUserId: string, targetUserId: string) {
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Prevent self-deletion
    if (adminUserId === targetUserId) {
      throw new Error("Cannot delete your own account");
    }

    return await adminService.deleteUser(targetUserId, adminUserId);
  },

  async getSystemHealth(adminUserId: string) {
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await adminService.getSystemHealth();
  },

  async isUserAdmin(userId: string): Promise<boolean> {
    return await adminService.isAdmin(userId);
  },
};


