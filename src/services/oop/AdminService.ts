import { PrismaClient, User, AdminAction } from "@prisma/client";
import { BaseService } from "../base/BaseService";
import { compare, hash } from "bcryptjs";

export interface AdminActionData {
  action: string;
  targetId?: string;
  targetType?: string;
  data?: Record<string, any>;
  adminId: string;
}

export interface IAdminService {
  promoteToAdmin(userId: string, adminPassword: string, promotedBy: string): Promise<User>;
  demoteFromAdmin(userId: string, demotedBy: string): Promise<User>;
  isAdmin(userId: string): Promise<boolean>;
  logAdminAction(action: AdminActionData): Promise<AdminAction>;
  getAdminActions(adminId?: string, limit?: number): Promise<AdminAction[]>;
  getUserAnalytics(): Promise<any>;
  getSystemHealth(): Promise<any>;
}

/**
 * Admin Service using OOP architecture
 * Manages administrative operations and user management
 */
export class AdminService extends BaseService implements IAdminService {
  
  constructor(database: PrismaClient) {
    super(database);
  }

  async promoteToAdmin(userId: string, adminPassword: string, promotedBy: string): Promise<User> {
    this.validateUserId(userId);
    this.validateUserId(promotedBy);
    
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    if (!adminPasswordHash) {
      throw new Error("Admin password not configured");
    }

    const isValidAdminPassword = await compare(adminPassword, adminPasswordHash);
    if (!isValidAdminPassword) {
      throw new Error("Invalid admin password");
    }

    // Verify promoter is admin
    const promoterIsAdmin = await this.isAdmin(promotedBy);
    if (!promoterIsAdmin) {
      throw new Error("Only admins can promote users");
    }

    try {
      // Update user to admin
      const updatedUser = await this.db.user.update({
        where: { id: userId },
        data: { isAdmin: true },
      });

      // Log the promotion
      await this.logAdminAction({
        action: "user_promotion",
        targetId: userId,
        targetType: "user",
        data: { promotedBy },
        adminId: promotedBy,
      });

      return updatedUser;
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Promote user to admin');
    }
  }

  async demoteFromAdmin(userId: string, demotedBy: string): Promise<User> {
    this.validateUserId(userId);
    this.validateUserId(demotedBy);

    // Verify demoter is admin
    const demoterIsAdmin = await this.isAdmin(demotedBy);
    if (!demoterIsAdmin) {
      throw new Error("Only admins can demote users");
    }

    // Prevent self-demotion
    if (userId === demotedBy) {
      throw new Error("Cannot demote yourself");
    }

    try {
      const updatedUser = await this.db.user.update({
        where: { id: userId },
        data: { isAdmin: false },
      });

      // Log the demotion
      await this.logAdminAction({
        action: "user_demotion",
        targetId: userId,
        targetType: "user",
        data: { demotedBy },
        adminId: demotedBy,
      });

      return updatedUser;
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Demote user from admin');
    }
  }

  async isAdmin(userId: string): Promise<boolean> {
    this.validateUserId(userId);

    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      return user?.isAdmin === true;
    } catch (error: any) {
      // If isAdmin column doesn't exist, no one is admin
      if (error.code === 'P2021') {
        return false;
      }
      throw this.handleDatabaseError(error, 'Check admin status');
    }
  }

  async logAdminAction(action: AdminActionData): Promise<AdminAction> {
    this.validateAdminAction(action);

    try {
      return await this.db.adminAction.create({
        data: {
          action: action.action,
          targetId: action.targetId,
          targetType: action.targetType,
          data: action.data || {},
          adminId: action.adminId,
        },
      });
    } catch (error: any) {
      // If AdminAction table doesn't exist, return a mock object
      if (error.code === 'P2021') {
        return {
          id: 'mock-id',
          action: action.action,
          targetId: action.targetId || null,
          targetType: action.targetType || null,
          data: action.data || {},
          adminId: action.adminId,
          timestamp: new Date(),
        } as AdminAction;
      }
      throw this.handleDatabaseError(error, 'Log admin action');
    }
  }

  async getAdminActions(adminId?: string, limit: number = 50): Promise<AdminAction[]> {
    if (adminId) {
      this.validateUserId(adminId);
    }

    try {
      return await this.db.adminAction.findMany({
        where: adminId ? { adminId } : {},
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error: any) {
      // If AdminAction table doesn't exist, return empty array
      if (error.code === 'P2021') {
        return [];
      }
      throw this.handleDatabaseError(error, 'Get admin actions');
    }
  }

  async getUserAnalytics(): Promise<{
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    recentSignups: number;
    activeUsers: number;
    usersWithCanvas: number;
  }> {
    try {
      const [totalCount, adminCount, recentSignups, usersWithCanvas] = await Promise.all([
        this.db.user.count(),
        this.db.user.count({ where: { isAdmin: true } }),
        this.db.user.count({
          where: {
            // User model doesn't have createdAt, use assignments as proxy for activity
            assignments: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }),
        this.db.user.count({ 
          where: { 
            courses: { 
              some: { source: 'canvas' } 
            } 
          } 
        })
      ]);

      return {
        totalUsers: totalCount,
        adminUsers: adminCount,
        regularUsers: totalCount - adminCount,
        recentSignups,
        activeUsers: totalCount, // For now, all users are considered active
        usersWithCanvas
      };
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Get user analytics');
    }
  }

  async getSystemHealth(): Promise<{
    database: string;
    totalRecords: number;
    recentErrors: number;
    lastBackup?: Date;
  }> {
    try {
      const [userCount, courseCount, assignmentCount, errorCount] = await Promise.all([
        this.db.user.count(),
        this.db.course.count(),
        this.db.assignment.count(),
        this.getRecentErrorCount()
      ]);

      return {
        database: 'Connected',
        totalRecords: userCount + courseCount + assignmentCount,
        recentErrors: errorCount,
        lastBackup: undefined // Would need to implement backup tracking
      };
    } catch (error: any) {
      return {
        database: 'Error',
        totalRecords: 0,
        recentErrors: 0,
        lastBackup: undefined
      };
    }
  }

  // Private helper methods
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID provided');
    }
  }

  private validateAdminAction(action: AdminActionData): void {
    if (!action.action || typeof action.action !== 'string') {
      throw new Error('Action is required');
    }

    if (!action.adminId || typeof action.adminId !== 'string') {
      throw new Error('Admin ID is required');
    }

    if (action.targetId && typeof action.targetId !== 'string') {
      throw new Error('Target ID must be a string');
    }

    if (action.targetType && typeof action.targetType !== 'string') {
      throw new Error('Target type must be a string');
    }

    if (action.data && typeof action.data !== 'object') {
      throw new Error('Action data must be an object');
    }
  }

  private async getRecentErrorCount(): Promise<number> {
    try {
      return await this.db.errorLog.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
    } catch (error: any) {
      // If ErrorLog table doesn't exist, return 0
      return 0;
    }
  }

  async cleanup(): Promise<void> {
    await this.db.$disconnect();
  }
}
