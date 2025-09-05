import { ErrorLog } from "@prisma/client";

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

/**
 * Error Log Service Interface
 * Defines contract for error logging, analysis, and management
 */
export interface IErrorLogService {
  logError(error: ErrorLogData): Promise<ErrorLog>;
  getErrorLogs(limit?: number, userId?: string): Promise<ErrorLog[]>;
  resolveErrorLog(errorLogId: string, resolvedBy: string): Promise<ErrorLog>;
  getErrorStats(days?: number): Promise<{
    total: number;
    byPath: Record<string, number>;
    byUser: Record<string, number>;
    recent: number;
  }>;
  clearOldLogs(daysToKeep?: number): Promise<{ deleted: number }>;
  getErrorTrends(days?: number): Promise<Array<{ date: string; errors: number }>>;
}
