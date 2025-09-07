import prisma from "@/db/client";
import { compare, hash } from "bcryptjs";

export interface AdminActionData {
  action: string;
  targetId?: string;
  targetType?: string;
  data?: Record<string, unknown>;
  adminId: string;
}

export const adminService = {
  async promoteToAdmin(userId: string, adminPassword: string, promotedBy: string) {
    const rawHash = process.env.ADMIN_PASSWORD_HASH;

    const inputPassword = (adminPassword ?? "").trim();
    const cleanedHash = rawHash ? rawHash.replace(/^"(.*)"$/, "$1").trim() : undefined;

    if (!cleanedHash) {
      throw new Error("Admin password not configured");
    }

    let isValidAdminPassword = false;
    try {
      isValidAdminPassword = await compare(inputPassword, cleanedHash);
    } catch {
      isValidAdminPassword = false;
    }

    if (!isValidAdminPassword) {
      throw new Error("Invalid admin password");
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: true },
    });

    // Log the admin action
    await this.logAdminAction({
      action: "user_promote",
      targetId: userId,
      targetType: "user",
      data: { promotedBy },
      adminId: promotedBy,
    });

    return updatedUser;
  },

  async revokeAdmin(userId: string, revokedBy: string) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: false },
    });

    await this.logAdminAction({
      action: "user_demote",
      targetId: userId,
      targetType: "user",
      data: { revokedBy },
      adminId: revokedBy,
    });

    return updatedUser;
  },

  async isAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    return user?.isAdmin || false;
  },

  async getAllUsers(filters?: {
    isAdmin?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: { isAdmin?: boolean } = {};
    if (filters?.isAdmin !== undefined) {
      where.isAdmin = filters.isAdmin;
    }

    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        emailVerified: true,
        image: true,
        _count: {
          select: {
            courses: true,
            assignments: true,
            errorLogs: true,
          },
        },
      },
      orderBy: { email: "asc" },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });
  },

  async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        emailVerified: true,
        image: true,
        accounts: {
          select: {
            provider: true,
            type: true,
          },
        },
        _count: {
          select: {
            courses: true,
            assignments: true,
            errorLogs: true,
            sessions: true,
          },
        },
      },
    });
  },

  async logAdminAction(data: AdminActionData) {
    return await prisma.adminAction.create({
      data: {
        action: data.action,
        targetId: data.targetId,
        targetType: data.targetType,
        data: data.data ? JSON.parse(JSON.stringify(data.data)) : null,
        adminId: data.adminId,
      },
    });
  },

  async getAdminActions(filters?: {
    adminId?: string;
    action?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: {
      adminId?: string;
      action?: string;
      targetType?: string;
      timestamp?: { gte?: Date; lte?: Date };
    } = {};

    if (filters?.adminId) where.adminId = filters.adminId;
    if (filters?.action) where.action = filters.action;
    if (filters?.targetType) where.targetType = filters.targetType;
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    return await prisma.adminAction.findMany({
      where,
      include: {
        admin: {
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

  async deleteUser(userId: string, deletedBy: string) {
    // First, log the action
    await this.logAdminAction({
      action: "user_delete",
      targetId: userId,
      targetType: "user",
      adminId: deletedBy,
    });

    // Delete the user (this will cascade delete related data)
    return await prisma.user.delete({
      where: { id: userId },
    });
  },

  async getSystemHealth() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      recentErrors,
      errorRate,
      activeUsers,
      systemLoad,
    ] = await Promise.all([
      prisma.errorLog.count({
        where: {
          timestamp: { gte: hourAgo },
          level: "ERROR",
        },
      }),
      prisma.errorLog.count({
        where: {
          timestamp: { gte: dayAgo },
        },
      }),
      prisma.analytics.findMany({
        where: { 
          timestamp: { gte: hourAgo },
          userId: { not: null },
        },
        distinct: ["userId"],
        select: { userId: true },
      }).then(users => users.length),
      this.calculateSystemLoad(),
    ]);

    return {
      status: recentErrors > 10 ? "unhealthy" : recentErrors > 5 ? "warning" : "healthy",
      recentErrors,
      errorRate,
      activeUsers,
      systemLoad,
      timestamp: now,
    };
  },

  async calculateSystemLoad() {
    // This is a simplified system load calculation
    // In a real system, you'd want to monitor actual system resources
    const [
      dbConnections,
      recentApiCalls,
    ] = await Promise.all([
      // Approximate database connection count
      prisma.$queryRaw`SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'` as Promise<Array<{ count: bigint }>>,
      prisma.analytics.count({
        where: {
          timestamp: { gte: new Date(Date.now() - 5 * 60 * 1000) },
          event: "api_call",
        },
      }),
    ]);

    const dbConnectionCount = Number(dbConnections[0]?.count || 0);
    
    return {
      dbConnections: dbConnectionCount,
      recentApiCalls,
      load: Math.min(100, (dbConnectionCount * 10) + (recentApiCalls * 2)),
    };
  },
};

// Helper function to generate admin password hash
export async function generateAdminPasswordHash(password: string): Promise<string> {
  return await hash(password, 12);
}
