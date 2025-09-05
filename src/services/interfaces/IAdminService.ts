import { User, AdminAction } from "@prisma/client";

export interface AdminActionData {
  action: string;
  targetId?: string;
  targetType?: string;
  data?: Record<string, any>;
  adminId: string;
}

/**
 * Admin Service Interface
 * Defines contract for administrative operations and user management
 */
export interface IAdminService {
  promoteToAdmin(userId: string, adminPassword: string, promotedBy: string): Promise<User>;
  demoteFromAdmin(userId: string, demotedBy: string): Promise<User>;
  isAdmin(userId: string): Promise<boolean>;
  logAdminAction(action: AdminActionData): Promise<AdminAction>;
  getAdminActions(adminId?: string, limit?: number): Promise<AdminAction[]>;
  getAllUsers(filters?: { isAdmin?: boolean; limit?: number; offset?: number }): Promise<User[]>;
  getUserAnalytics(): Promise<any>;
  getSystemHealth(): Promise<any>;
}
