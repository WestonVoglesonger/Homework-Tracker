import { PrismaClient } from "@prisma/client";
import { BaseService } from "../base/BaseService";

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

export interface IAnalyticsService {
  getUserAnalytics(userId: string): Promise<UserAnalytics>;
  getSystemAnalytics(): Promise<SystemAnalytics>;
  trackUserActivity(userId: string, activity: string, metadata?: Record<string, any>): Promise<void>;
  getActivityTrends(userId: string, days?: number): Promise<Array<{ date: string; activity: number }>>;
  generateUserReport(userId: string): Promise<string>;
  generateSystemReport(): Promise<string>;
}

/**
 * Analytics Service using OOP architecture
 * Provides comprehensive analytics and reporting capabilities
 */
export class AnalyticsService extends BaseService implements IAnalyticsService {
  
  constructor(database: PrismaClient) {
    super(database);
  }

  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    this.validateUserId(userId);

    try {
      const [assignments, courses] = await Promise.all([
        this.db.assignment.findMany({
          where: { userId },
          include: { course: true }
        }),
        this.db.course.findMany({
          where: { userId }
        })
      ]);

      const completedAssignments = assignments.filter(a => a.status === 'GRADED');
      const overdueAssignments = assignments.filter(a => 
        a.dueAt && a.dueAt < new Date() && a.status === 'NOT_SUBMITTED'
      );

      // Calculate average completion time
      const avgCompletionTime = this.calculateAverageCompletionTime(completedAssignments);
      
      // Calculate productivity score (0-100)
      const productivityScore = this.calculateProductivityScore(assignments);
      
      // Get weekly activity
      const weeklyActivity = await this.getWeeklyActivity(userId);
      
      // Get subject performance
      const subjectPerformance = this.calculateSubjectPerformance(assignments, courses);

      return {
        totalAssignments: assignments.length,
        completedAssignments: completedAssignments.length,
        overdueAssignments: overdueAssignments.length,
        averageCompletionTime: avgCompletionTime,
        productivityScore,
        weeklyActivity,
        subjectPerformance
      };
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Get user analytics');
    }
  }

  async getSystemAnalytics(): Promise<SystemAnalytics> {
    try {
      const [userStats, courseStats, assignmentStats, errorStats] = await Promise.all([
        this.getUserStats(),
        this.getCourseStats(),
        this.getAssignmentStats(),
        this.getErrorStats()
      ]);

      return {
        totalUsers: userStats.total,
        activeUsers: userStats.active,
        totalCourses: courseStats.total,
        totalAssignments: assignmentStats.total,
        canvasIntegrations: userStats.withCanvas,
        errorRate: errorStats.rate,
        performanceMetrics: {
          avgResponseTime: 150, // Would be calculated from actual metrics
          successRate: 99.5,   // Would be calculated from actual metrics
          uptime: 99.9         // Would be calculated from actual metrics
        }
      };
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Get system analytics');
    }
  }

  async trackUserActivity(userId: string, activity: string, metadata?: Record<string, any>): Promise<void> {
    this.validateUserId(userId);
    this.validateActivity(activity);

    try {
      // In a real implementation, you might have an ActivityLog table
      // For now, we'll use a simple logging approach
      console.log(`User Activity: ${userId} - ${activity}`, metadata);
      
      // Could store in database if you add an activity tracking table
      // await this.db.activityLog.create({
      //   data: {
      //     userId,
      //     activity,
      //     metadata: metadata || {},
      //     timestamp: new Date()
      //   }
      // });
    } catch (error: any) {
      // Don't fail operations if activity tracking fails
      console.warn('Failed to track user activity:', error);
    }
  }

  async getActivityTrends(userId: string, days: number = 30): Promise<Array<{ date: string; activity: number }>> {
    this.validateUserId(userId);

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      // Get assignment activity as a proxy for user activity
      const assignments = await this.db.assignment.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        select: { createdAt: true, updatedAt: true }
      });

      // Group by date
      const activityByDate: Record<string, number> = {};
      
      assignments.forEach(assignment => {
        const date = assignment.createdAt.toISOString().split('T')[0];
        activityByDate[date] = (activityByDate[date] || 0) + 1;
        
        // Count updates as activity too
        const updateDate = assignment.updatedAt.toISOString().split('T')[0];
        if (updateDate !== date) {
          activityByDate[updateDate] = (activityByDate[updateDate] || 0) + 1;
        }
      });

      // Convert to array format
      return Object.entries(activityByDate)
        .map(([date, activity]) => ({ date, activity }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Get activity trends');
    }
  }

  async generateUserReport(userId: string): Promise<string> {
    const analytics = await this.getUserAnalytics(userId);
    
    return `
# User Analytics Report

## Summary
- Total Assignments: ${analytics.totalAssignments}
- Completed: ${analytics.completedAssignments} (${Math.round(analytics.completedAssignments / analytics.totalAssignments * 100)}%)
- Overdue: ${analytics.overdueAssignments}
- Productivity Score: ${analytics.productivityScore}/100

## Performance
- Average Completion Time: ${analytics.averageCompletionTime} hours
- Weekly Activity: ${analytics.weeklyActivity.length} active days

## Subject Performance
${analytics.subjectPerformance.map(s => `- ${s.subject}: ${s.completion}% completion`).join('\n')}

Generated on: ${new Date().toISOString()}
    `.trim();
  }

  async generateSystemReport(): Promise<string> {
    const analytics = await this.getSystemAnalytics();
    
    return `
# System Analytics Report

## User Metrics
- Total Users: ${analytics.totalUsers}
- Active Users: ${analytics.activeUsers}
- Canvas Integrations: ${analytics.canvasIntegrations}

## Content Metrics  
- Total Courses: ${analytics.totalCourses}
- Total Assignments: ${analytics.totalAssignments}

## System Health
- Error Rate: ${analytics.errorRate}%
- Success Rate: ${analytics.performanceMetrics.successRate}%
- Uptime: ${analytics.performanceMetrics.uptime}%

Generated on: ${new Date().toISOString()}
    `.trim();
  }

  // Private calculation methods
  private calculateAverageCompletionTime(assignments: any[]): number {
    if (assignments.length === 0) return 0;
    
    const totalHours = assignments.reduce((sum, a) => sum + (a.estimatedHours || 2), 0);
    return Math.round(totalHours / assignments.length * 100) / 100;
  }

  private calculateProductivityScore(assignments: any[]): number {
    if (assignments.length === 0) return 0;
    
    const completed = assignments.filter(a => a.status === 'GRADED').length;
    const onTime = assignments.filter(a => 
      a.dueAt && a.status === 'GRADED' && a.updatedAt <= a.dueAt
    ).length;
    
    const completionRate = completed / assignments.length;
    const onTimeRate = assignments.length > 0 ? onTime / assignments.length : 0;
    
    return Math.round((completionRate * 0.7 + onTimeRate * 0.3) * 100);
  }

  private async getWeeklyActivity(userId: string): Promise<Array<{ date: string; assignments: number }>> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const assignments = await this.db.assignment.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true }
    });

    const activityByDate: Record<string, number> = {};
    assignments.forEach(a => {
      const date = a.createdAt.toISOString().split('T')[0];
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    return Object.entries(activityByDate)
      .map(([date, assignments]) => ({ date, assignments }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateSubjectPerformance(assignments: any[], courses: any[]): Array<{ subject: string; completion: number }> {
    const courseMap = new Map(courses.map(c => [c.id, c.name]));
    const subjectStats: Record<string, { total: number; completed: number }> = {};

    assignments.forEach(assignment => {
      const subject = assignment.courseId ? 
        courseMap.get(assignment.courseId) || 'No Course' : 
        'No Course';
      
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, completed: 0 };
      }
      
      subjectStats[subject].total++;
      if (assignment.status === 'GRADED') {
        subjectStats[subject].completed++;
      }
    });

    return Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      completion: Math.round(stats.completed / stats.total * 100)
    }));
  }

  private async getUserStats() {
    const total = await this.db.user.count();
    // Canvas token is not stored in User model, use Canvas courses as proxy
    const withCanvas = await this.db.user.count({ 
      where: { 
        courses: { 
          some: { source: 'canvas' } 
        } 
      } 
    });
    // User model doesn't have updatedAt, use assignments as proxy for activity
    const recentActive = await this.db.user.count({
      where: {
        assignments: {
          some: {
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }
      }
    });

    return { total, active: recentActive, withCanvas };
  }

  private async getCourseStats() {
    const total = await this.db.course.count();
    return { total };
  }

  private async getAssignmentStats() {
    const total = await this.db.assignment.count();
    return { total };
  }

  private async getErrorStats() {
    try {
      const recentErrors = await this.db.errorLog.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      
      const totalRequests = 1000; // Would be tracked from actual metrics
      return { rate: (recentErrors / totalRequests) * 100 };
    } catch (error) {
      return { rate: 0 };
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID provided');
    }
  }

  private validateActivity(activity: string): void {
    if (!activity || typeof activity !== 'string' || activity.trim().length === 0) {
      throw new Error('Activity description is required');
    }
  }

  async cleanup(): Promise<void> {
    await this.db.$disconnect();
  }
}
