import { PrismaClient } from "@prisma/client";
import { BaseCourseService } from "./BaseCourseService";
import { ManualCourseService } from "./ManualCourseService";
import { CanvasCourseService } from "./CanvasCourseService";
import { ICompleteCourseService, IBulkCourseService, ICourseAnalyticsService } from "../interfaces/ICourseService";

/**
 * Factory class implementing Dependency Injection and Service Locator patterns
 * Provides polymorphic course service instances based on course type
 */
export class CourseServiceFactory {
  private readonly database: PrismaClient;
  private readonly manualService: ManualCourseService;
  private readonly canvasService: CanvasCourseService;
  private readonly bulkService: BulkCourseService;
  private readonly analyticsService: CourseAnalyticsService;

  constructor(database: PrismaClient) {
    this.database = database;
    this.manualService = new ManualCourseService(database);
    this.canvasService = new CanvasCourseService(database);
    this.bulkService = new BulkCourseService(database);
    this.analyticsService = new CourseAnalyticsService(database);
  }

  /**
   * Get appropriate service instance based on course source
   * Implements polymorphism - returns different service types
   */
  getServiceForSource(source: 'manual' | 'canvas'): BaseCourseService {
    switch (source) {
      case 'manual':
        return this.manualService;
      case 'canvas':
        return this.canvasService;
      default:
        throw new Error(`Unsupported course source: ${source}`);
    }
  }

  /**
   * Get service instance for existing course (determines type automatically)
   */
  async getServiceForCourse(userId: string, courseId: string): Promise<BaseCourseService> {
    const course = await this.database.course.findFirst({
      where: { id: courseId, userId },
      select: { source: true }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return this.getServiceForSource(course.source as 'manual' | 'canvas');
  }

  /**
   * Get bulk operations service
   */
  getBulkService(): IBulkCourseService {
    return this.bulkService;
  }

  /**
   * Get analytics service
   */
  getAnalyticsService(): ICourseAnalyticsService {
    return this.analyticsService;
  }

  /**
   * Get unified service that delegates to appropriate specialized services
   */
  getUnifiedService(): ICompleteCourseService {
    return new UnifiedCourseService(this);
  }

  /**
   * Cleanup all service instances
   */
  async cleanup(): Promise<void> {
    await Promise.all([
      this.manualService.cleanup(),
      this.canvasService.cleanup(),
      this.bulkService.cleanup(),
      this.analyticsService.cleanup(),
    ]);
  }
}

/**
 * Bulk course operations service
 */
class BulkCourseService extends BaseCourseService implements IBulkCourseService {
  
  protected async validateCreateInput(): Promise<void> {
    throw new Error("Bulk service doesn't support individual creates");
  }

  protected async validateUpdateInput(): Promise<void> {
    // Bulk updates have different validation
  }

  protected async preprocessCreateInput(input: any): Promise<any> {
    return input;
  }

  protected async preprocessUpdateInput(input: any): Promise<any> {
    return input;
  }

  async bulkDeleteCourses(userId: string, courseIds: string[]): Promise<{ deleted: number }> {
    this.validateUserId(userId);

    if (!courseIds.length) {
      return { deleted: 0 };
    }

    const result = await this.db.course.deleteMany({
      where: {
        id: { in: courseIds },
        userId
      }
    });

    return { deleted: result.count };
  }

  async purgeUserCourses(userId: string): Promise<{ deleted: number }> {
    this.validateUserId(userId);

    const result = await this.db.course.deleteMany({
      where: { userId }
    });

    return { deleted: result.count };
  }

  async bulkArchiveCourses(userId: string, courseIds: string[]): Promise<{ updated: number }> {
    this.validateUserId(userId);

    if (!courseIds.length) {
      return { updated: 0 };
    }

    // For now, we'll append [ARCHIVED] to the name
    // In the future, you might add an archived field
    const courses = await this.db.course.findMany({
      where: {
        id: { in: courseIds },
        userId
      }
    });

    let updated = 0;
    for (const course of courses) {
      if (!course.name.includes('[ARCHIVED]')) {
        await this.db.course.update({
          where: { id: course.id },
          data: { name: `${course.name} [ARCHIVED]` }
        });
        updated++;
      }
    }

    return { updated };
  }
}

/**
 * Course analytics and reporting service
 */
class CourseAnalyticsService extends BaseCourseService implements ICourseAnalyticsService {
  
  protected async validateCreateInput(): Promise<void> {
    throw new Error("Analytics service doesn't support creates");
  }

  protected async validateUpdateInput(): Promise<void> {
    throw new Error("Analytics service doesn't support updates");
  }

  protected async preprocessCreateInput(input: any): Promise<any> {
    return input;
  }

  protected async preprocessUpdateInput(input: any): Promise<any> {
    return input;
  }

  async getCourseStats(userId: string): Promise<{
    total: number;
    active: number;
    archived: number;
    byTerm: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    return await this.getStatistics(userId);
  }

  async getWorkloadAnalysis(userId: string): Promise<{
    totalAssignments: number;
    avgAssignmentsPerCourse: number;
    heaviestCourse: string;
    lightestCourse: string;
  }> {
    const coursesWithAssignments = await this.repository.getWithAssignmentCount(userId);
    
    const totalAssignments = coursesWithAssignments.reduce((sum, c) => sum + c._count.assignments, 0);
    const avgAssignmentsPerCourse = coursesWithAssignments.length > 0 ? 
      totalAssignments / coursesWithAssignments.length : 0;

    // Find heaviest and lightest courses
    const sortedByAssignments = coursesWithAssignments.sort((a, b) => 
      b._count.assignments - a._count.assignments
    );

    return {
      totalAssignments,
      avgAssignmentsPerCourse: Math.round(avgAssignmentsPerCourse * 100) / 100,
      heaviestCourse: sortedByAssignments[0]?.name || 'None',
      lightestCourse: sortedByAssignments[sortedByAssignments.length - 1]?.name || 'None'
    };
  }
}

/**
 * Unified service that delegates to appropriate specialized services
 * Implements Facade pattern to provide simple interface to complex subsystem
 */
export class UnifiedCourseService implements ICompleteCourseService {
  private readonly factory: CourseServiceFactory;

  constructor(factory: CourseServiceFactory) {
    this.factory = factory;
  }

  // Delegate to appropriate service based on operation
  async listCourses(userId: string, filters?: any) {
    // Use manual service as default for listing (includes all types)
    return await this.factory.getServiceForSource('manual').listCourses(userId, filters);
  }

  async getCourse(userId: string, courseId: string) {
    const service = await this.factory.getServiceForCourse(userId, courseId);
    return await service.getCourse(userId, courseId);
  }

  async createCourse(userId: string, input: any) {
    const source = input.source || 'manual';
    const service = this.factory.getServiceForSource(source);
    return await service.createCourse(userId, input);
  }

  async updateCourse(userId: string, courseId: string, input: any) {
    const service = await this.factory.getServiceForCourse(userId, courseId);
    return await service.updateCourse(userId, courseId, input);
  }

  async deleteCourse(userId: string, courseId: string) {
    const service = await this.factory.getServiceForCourse(userId, courseId);
    return await service.deleteCourse(userId, courseId);
  }

  // Canvas operations delegate to Canvas service
  async getCourseByCanvasId(userId: string, canvasId: string) {
    return await (this.factory.getServiceForSource('canvas') as any).getCourseByCanvasId(userId, canvasId);
  }

  async syncFromCanvas(userId: string, canvasCourses: any[]) {
    return await (this.factory.getServiceForSource('canvas') as any).syncFromCanvas(userId, canvasCourses);
  }

  async importFromCanvas(userId: string, canvasCourse: any) {
    return await (this.factory.getServiceForSource('canvas') as any).importFromCanvas(userId, canvasCourse);
  }

  // Bulk operations delegate to bulk service
  async bulkDeleteCourses(userId: string, courseIds: string[]) {
    return await this.factory.getBulkService().bulkDeleteCourses(userId, courseIds);
  }

  async purgeUserCourses(userId: string) {
    return await this.factory.getBulkService().purgeUserCourses(userId);
  }

  async bulkArchiveCourses(userId: string, courseIds: string[]) {
    return await this.factory.getBulkService().bulkArchiveCourses(userId, courseIds);
  }

  // Analytics operations delegate to analytics service
  async getCourseStats(userId: string) {
    return await this.factory.getAnalyticsService().getCourseStats(userId);
  }

  async getWorkloadAnalysis(userId: string) {
    return await this.factory.getAnalyticsService().getWorkloadAnalysis(userId);
  }
}
