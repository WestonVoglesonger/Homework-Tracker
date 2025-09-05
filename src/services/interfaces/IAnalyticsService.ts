export interface UserAnalytics {
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  averageCompletionTime: number;
  productivityScore: number;
  weeklyActivity: Array<{ date: string; assignments: number }>;
  subjectPerformance: Array<{ subject: string; completion: number; avgGrade?: number }>;
}

export interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalAssignments: number;
  canvasIntegrations: number;
  errorRate: number;
  performanceMetrics: {
    avgResponseTime: number;
    successRate: number;
    uptime: number;
  };
}

/**
 * Analytics Service Interface
 * Defines contract for analytics, reporting, and metrics collection
 */
export interface IAnalyticsService {
  getUserAnalytics(userId: string): Promise<UserAnalytics>;
  getSystemAnalytics(): Promise<SystemAnalytics>;
  getDashboardMetrics(timeRange: "day" | "week" | "month"): Promise<SystemAnalytics>;
  getSystemMetrics(): Promise<SystemAnalytics>;
  getEvents(filters?: any): Promise<any[]>;
  trackUserActivity(userId: string, activity: string, metadata?: Record<string, any>): Promise<void>;
  getActivityTrends(userId: string, days?: number): Promise<Array<{ date: string; activity: number }>>;
  generateUserReport(userId: string): Promise<string>;
  generateSystemReport(): Promise<string>;
}
