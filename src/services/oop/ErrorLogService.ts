import { PrismaClient, ErrorLog } from "@prisma/client";
import { BaseService } from "../base/BaseService";

export interface ErrorLogData {
  message: string;
  stack?: string;
  userId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export interface IErrorLogService {
  logError(error: ErrorLogData): Promise<ErrorLog>;
  getErrorLogs(limit?: number, userId?: string): Promise<ErrorLog[]>;
  getErrorStats(days?: number): Promise<{
    total: number;
    byPath: Record<string, number>;
    byUser: Record<string, number>;
    recent: number;
  }>;
  clearOldLogs(daysToKeep?: number): Promise<{ deleted: number }>;
  getErrorTrends(days?: number): Promise<Array<{ date: string; errors: number }>>;
}

/**
 * Error Log Service using OOP architecture
 * Manages error logging, analysis, and cleanup
 */
export class ErrorLogService extends BaseService implements IErrorLogService {
  
  constructor(database: PrismaClient) {
    super(database);
  }

  async logError(error: ErrorLogData): Promise<ErrorLog> {
    this.validateErrorData(error);

    try {
      return await this.db.errorLog.create({
        data: {
          level: 'ERROR',
          message: error.message,
          stack: error.stack || null,
          userId: error.userId || null,
          endpoint: error.path || null,
          method: error.method || null,
          userAgent: error.userAgent || null,
          ip: error.ip || null,
          context: error.metadata || {},
        }
      });
    } catch (dbError: any) {
      // If ErrorLog table doesn't exist, create a mock response
      if (dbError.code === 'P2021') {
        console.error('ErrorLog table not found, logging to console:', error);
        return {
          id: `mock-${Date.now()}`,
          level: 'ERROR',
          message: error.message,
          stack: error.stack || null,
          context: error.metadata || {},
          endpoint: error.path || null,
          method: error.method || null,
          userAgent: error.userAgent || null,
          ip: error.ip || null,
          userId: error.userId || null,
          sessionId: null,
          timestamp: new Date(),
          resolved: false,
          resolvedAt: null,
          resolvedBy: null,
        } as ErrorLog;
      }
      
      // If we can't log to database, at least log to console
      console.error('Failed to log error to database:', error, dbError);
      throw this.handleDatabaseError(dbError, 'Log error');
    }
  }

  async getErrorLogs(limit: number = 100, userId?: string): Promise<ErrorLog[]> {
    if (userId) {
      this.validateUserId(userId);
    }

    try {
      return await this.db.errorLog.findMany({
        where: userId ? { userId } : {},
        orderBy: { timestamp: 'desc' },
        take: limit
      });
    } catch (error: any) {
      if (error.code === 'P2021') {
        return []; // Table doesn't exist
      }
      throw this.handleDatabaseError(error, 'Get error logs');
    }
  }

  async getErrorStats(days: number = 30): Promise<{
    total: number;
    byPath: Record<string, number>;
    byUser: Record<string, number>;
    recent: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    try {
      const [allErrors, recentErrors] = await Promise.all([
        this.db.errorLog.findMany({
          where: { timestamp: { gte: startDate } },
          select: { endpoint: true, userId: true }
        }),
        this.db.errorLog.count({
          where: { timestamp: { gte: recentDate } }
        })
      ]);

      const byPath: Record<string, number> = {};
      const byUser: Record<string, number> = {};

      allErrors.forEach(error => {
        if (error.endpoint) {
          byPath[error.endpoint] = (byPath[error.endpoint] || 0) + 1;
        }
        if (error.userId) {
          byUser[error.userId] = (byUser[error.userId] || 0) + 1;
        }
      });

      return {
        total: allErrors.length,
        byPath,
        byUser,
        recent: recentErrors
      };
    } catch (error: any) {
      if (error.code === 'P2021') {
        return { total: 0, byPath: {}, byUser: {}, recent: 0 };
      }
      throw this.handleDatabaseError(error, 'Get error statistics');
    }
  }

  async clearOldLogs(daysToKeep: number = 90): Promise<{ deleted: number }> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    try {
      const result = await this.db.errorLog.deleteMany({
        where: { timestamp: { lt: cutoffDate } }
      });

      return { deleted: result.count };
    } catch (error: any) {
      if (error.code === 'P2021') {
        return { deleted: 0 }; // Table doesn't exist
      }
      throw this.handleDatabaseError(error, 'Clear old error logs');
    }
  }

  async getErrorTrends(days: number = 30): Promise<Array<{ date: string; errors: number }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const errors = await this.db.errorLog.findMany({
        where: { timestamp: { gte: startDate } },
        select: { timestamp: true }
      });

      const errorsByDate: Record<string, number> = {};
      
      errors.forEach(error => {
        const date = error.timestamp.toISOString().split('T')[0];
        errorsByDate[date] = (errorsByDate[date] || 0) + 1;
      });

      return Object.entries(errorsByDate)
        .map(([date, errors]) => ({ date, errors }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error: any) {
      if (error.code === 'P2021') {
        return []; // Table doesn't exist
      }
      throw this.handleDatabaseError(error, 'Get error trends');
    }
  }

  // Convenience methods for common error types
  async logApiError(path: string, method: string, error: Error, userId?: string, ip?: string): Promise<ErrorLog> {
    return await this.logError({
      message: `API Error: ${error.message}`,
      stack: error.stack,
      path,
      method,
      userId,
      ip,
      metadata: { type: 'api_error' }
    });
  }

  async logAuthenticationError(email: string, reason: string, ip?: string): Promise<ErrorLog> {
    return await this.logError({
      message: `Authentication failed: ${reason}`,
      path: '/auth',
      method: 'POST',
      ip,
      metadata: { 
        type: 'auth_error',
        email: email.substring(0, 3) + '***' // Partial email for privacy
      }
    });
  }

  async logDatabaseError(operation: string, error: Error, userId?: string): Promise<ErrorLog> {
    return await this.logError({
      message: `Database error in ${operation}: ${error.message}`,
      stack: error.stack,
      userId,
      metadata: { 
        type: 'database_error',
        operation
      }
    });
  }

  // Private validation methods
  private validateErrorData(error: ErrorLogData): void {
    if (!error.message || typeof error.message !== 'string') {
      throw new Error('Error message is required');
    }

    if (error.message.length > 1000) {
      throw new Error('Error message too long (max 1000 characters)');
    }

    if (error.userId && typeof error.userId !== 'string') {
      throw new Error('User ID must be a string');
    }

    if (error.path && typeof error.path !== 'string') {
      throw new Error('Path must be a string');
    }

    if (error.method && typeof error.method !== 'string') {
      throw new Error('Method must be a string');
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID provided');
    }
  }

  async cleanup(): Promise<void> {
    // Clean up old logs automatically
    await this.clearOldLogs(90); // Keep 90 days
    await this.db.$disconnect();
  }
}
