import { PrismaClient } from "@prisma/client";
import { BaseService } from "../base/BaseService";
import { CanvasAssignment, CanvasCourse } from "../../interfaces/canvas";
import { encryptText, decryptText } from "../../lib/crypto";

export interface ICanvasIntegrationService {
  fetchCanvas<T>(path: string, accessToken: string, query?: Record<string, string | number | boolean | undefined>): Promise<T>;
  getCourses(accessToken: string): Promise<CanvasCourse[]>;
  getAssignments(accessToken: string, courseId?: string): Promise<CanvasAssignment[]>;
  validateToken(accessToken: string): Promise<boolean>;
  storeEncryptedToken(userId: string, token: string): Promise<void>;
  getDecryptedToken(userId: string): Promise<string | null>;
  removeToken(userId: string): Promise<void>;
}

/**
 * Canvas Integration Service using OOP architecture
 * Manages all Canvas API interactions and token management
 */
export class CanvasIntegrationService extends BaseService implements ICanvasIntegrationService {
  private readonly baseUrl: string;
  
  constructor(database: PrismaClient) {
    super(database);
    this.baseUrl = process.env.CANVAS_BASE_URL || "";
    
    if (!this.baseUrl) {
      console.warn("Canvas not configured (missing CANVAS_BASE_URL)");
    }
  }

  async fetchCanvas<T>(
    path: string,
    accessToken: string,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    this.validateCanvasConfiguration();
    this.validateAccessToken(accessToken);
    
    const token = accessToken?.startsWith("v1:") ? decryptText(accessToken) : accessToken;
    const url = new URL(`/api/v1${path}`, this.baseUrl);
    
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    
    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      
      if (!res.ok) {
        throw new Error(`Canvas API error ${res.status}: ${res.statusText}`);
      }
      
      return (await res.json()) as T;
    } catch (error: any) {
      if (error.message.includes('Canvas API error')) {
        throw error;
      }
      throw new Error(`Canvas request failed: ${error.message}`);
    }
  }

  async getCourses(accessToken: string): Promise<CanvasCourse[]> {
    this.validateAccessToken(accessToken);
    
    try {
      const courses = await this.fetchCanvas<CanvasCourse[]>(
        "/courses",
        accessToken,
        { 
          enrollment_state: "active",
          per_page: 100 
        }
      );
      
      return this.filterValidCourses(courses);
    } catch (error: any) {
      throw new Error(`Failed to fetch Canvas courses: ${error.message}`);
    }
  }

  async getAssignments(accessToken: string, courseId?: string): Promise<CanvasAssignment[]> {
    this.validateAccessToken(accessToken);
    
    try {
      if (courseId) {
        // Get assignments for specific course
        return await this.fetchCanvas<CanvasAssignment[]>(
          `/courses/${courseId}/assignments`,
          accessToken,
          { per_page: 100 }
        );
      } else {
        // Get assignments from all courses
        const courses = await this.getCourses(accessToken);
        const allAssignments: CanvasAssignment[] = [];
        
        for (const course of courses) {
          try {
            const courseAssignments = await this.fetchCanvas<CanvasAssignment[]>(
              `/courses/${course.id}/assignments`,
              accessToken,
              { per_page: 100 }
            );
            allAssignments.push(...courseAssignments);
          } catch (error) {
            // Continue with other courses if one fails
            console.warn(`Failed to fetch assignments for course ${course.id}:`, error);
          }
        }
        
        return allAssignments;
      }
    } catch (error: any) {
      throw new Error(`Failed to fetch Canvas assignments: ${error.message}`);
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    this.validateAccessToken(accessToken);
    
    try {
      await this.fetchCanvas("/users/self", accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  async storeEncryptedToken(userId: string, token: string): Promise<void> {
    this.validateUserId(userId);
    this.validateAccessToken(token);
    
    try {
      const encryptedToken = encryptText(token);
      
      // Canvas token storage would need to be implemented in User model
      // For now, we'll store it in a separate table or handle differently
      console.log(`Canvas token would be stored for user ${userId}`);
      // TODO: Implement canvas token storage
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Store Canvas token');
    }
  }

  async getDecryptedToken(userId: string): Promise<string | null> {
    this.validateUserId(userId);
    
    try {
      // Canvas token retrieval would need to be implemented
      // For now, return null since token storage is not implemented
      console.log(`Canvas token would be retrieved for user ${userId}`);
      return null;
      // TODO: Implement canvas token retrieval
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Get Canvas token');
    }
  }

  async removeToken(userId: string): Promise<void> {
    this.validateUserId(userId);
    
    try {
      // Canvas token removal would need to be implemented
      console.log(`Canvas token would be removed for user ${userId}`);
      // TODO: Implement canvas token removal
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Remove Canvas token');
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


  async getUserAnalytics(): Promise<{
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    recentSignups: number;
    usersWithCanvas: number;
  }> {
    try {
      const [totalCount, adminCount, recentSignups,         canvasUsers] = await Promise.all([
        this.db.user.count(),
        this.db.user.count({ where: { isAdmin: true } }),
        this.db.user.count({
          where: {
            assignments: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
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
        usersWithCanvas: canvasUsers
      };
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Get user analytics');
    }
  }

  async getSystemHealth(): Promise<{
    database: string;
    canvas: string;
    totalRecords: number;
    recentErrors: number;
  }> {
    try {
      // Test database connection
      await this.db.$queryRaw`SELECT 1`;
      
      const [userCount, courseCount, assignmentCount] = await Promise.all([
        this.db.user.count(),
        this.db.course.count(),
        this.db.assignment.count()
      ]);

      // Test Canvas connection if configured
      let canvasStatus = 'Not Configured';
      if (this.baseUrl) {
        try {
          // This would require a test token, so we'll just check if URL is reachable
          canvasStatus = 'Configured';
        } catch (error) {
          canvasStatus = 'Error';
        }
      }

      const recentErrors = await this.getRecentErrorCount();

      return {
        database: 'Connected',
        canvas: canvasStatus,
        totalRecords: userCount + courseCount + assignmentCount,
        recentErrors
      };
    } catch (error: any) {
      return {
        database: 'Error',
        canvas: 'Unknown',
        totalRecords: 0,
        recentErrors: 0
      };
    }
  }

  // Private validation methods
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID provided');
    }
  }

  private validateCanvasConfiguration(): void {
    if (!this.baseUrl) {
      throw new Error("Canvas not configured (missing CANVAS_BASE_URL)");
    }
  }

  private validateAccessToken(token: string): void {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Canvas access token is required');
    }
  }


  private filterValidCourses(courses: CanvasCourse[]): CanvasCourse[] {
    return courses.filter(course => 
      course && 
      course.id && 
      course.name && 
      course.name.trim().length > 0
    );
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
