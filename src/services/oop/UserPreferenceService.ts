import { PrismaClient, User } from "@prisma/client";
import { BaseService } from "../base/BaseService";
import { IUserPreferenceService, UserPreferences } from "../interfaces/IUserPreferenceService";

/**
 * User Preference Service using OOP architecture
 * Manages user-specific preferences and settings
 */
export class UserPreferenceService extends BaseService implements IUserPreferenceService {
  
  constructor(database: PrismaClient) {
    super(database);
  }

  async get(userId: string): Promise<UserPreferences> {
    this.validateUserId(userId);

    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { canvasSetupDismissed: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return { 
        canvasSetupDismissed: user.canvasSetupDismissed ?? false 
      };
    } catch (error: any) {
      // If column doesn't exist (migration not applied), return defaults
      if (error.code === 'P2021') {
        return { canvasSetupDismissed: false };
      }
      throw this.handleDatabaseError(error, 'Get user preferences');
    }
  }

  async update(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    this.validateUserId(userId);
    this.validatePreferences(preferences);

    try {
      const updated = await this.db.user.update({
        where: { id: userId },
        data: {
          ...(preferences.canvasSetupDismissed !== undefined ? 
            { canvasSetupDismissed: preferences.canvasSetupDismissed } : {})
        },
        select: { canvasSetupDismissed: true }
      });

      return { 
        canvasSetupDismissed: updated.canvasSetupDismissed ?? false 
      };
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Update user preferences');
    }
  }

  async reset(userId: string): Promise<UserPreferences> {
    this.validateUserId(userId);

    const defaultPreferences: UserPreferences = {
      canvasSetupDismissed: false
    };

    return await this.update(userId, defaultPreferences);
  }

  // Validation methods
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID provided');
    }
  }

  private validatePreferences(preferences: Partial<UserPreferences>): void {
    if (typeof preferences !== 'object' || preferences === null) {
      throw new Error('Preferences must be an object');
    }

    if (preferences.canvasSetupDismissed !== undefined && 
        typeof preferences.canvasSetupDismissed !== 'boolean') {
      throw new Error('canvasSetupDismissed must be a boolean');
    }
  }

  // Bulk operations for admin use
  async bulkResetPreferences(userIds: string[]): Promise<{ updated: number }> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { updated: 0 };
    }

    const result = await this.db.user.updateMany({
      where: { id: { in: userIds } },
      data: { canvasSetupDismissed: false }
    });

    return { updated: result.count };
  }

  async getPreferencesAnalytics(): Promise<{
    totalUsers: number;
    canvasSetupDismissed: number;
    canvasSetupActive: number;
  }> {
    const stats = await this.db.user.aggregate({
      _count: {
        id: true,
      },
      where: {}
    });

    const dismissedCount = await this.db.user.count({
      where: { canvasSetupDismissed: true }
    });

    return {
      totalUsers: stats._count.id,
      canvasSetupDismissed: dismissedCount,
      canvasSetupActive: stats._count.id - dismissedCount
    };
  }

  async cleanup(): Promise<void> {
    await this.db.$disconnect();
  }
}
