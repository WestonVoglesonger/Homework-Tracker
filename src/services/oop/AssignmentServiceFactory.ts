import { PrismaClient } from "@prisma/client";
import { BaseAssignmentService } from "./BaseAssignmentService";
import { ManualAssignmentService } from "./ManualAssignmentService";
import { CanvasAssignmentService } from "./CanvasAssignmentService";
import { ICompleteAssignmentService, IBulkAssignmentService, IAssignmentAnalyticsService } from "../interfaces/IAssignmentService";

/**
 * Factory class implementing Dependency Injection and Service Locator patterns
 * Provides polymorphic assignment service instances based on assignment type
 */
export class AssignmentServiceFactory {
  private readonly database: PrismaClient;
  private readonly manualService: ManualAssignmentService;
  private readonly canvasService: CanvasAssignmentService;
  private readonly bulkService: BulkAssignmentService;
  private readonly analyticsService: AssignmentAnalyticsService;

  constructor(database: PrismaClient) {
    this.database = database;
    this.manualService = new ManualAssignmentService(database);
    this.canvasService = new CanvasAssignmentService(database);
    this.bulkService = new BulkAssignmentService(database);
    this.analyticsService = new AssignmentAnalyticsService(database);
  }

  /**
   * Get appropriate service instance based on assignment source
   * Implements polymorphism - returns different service types
   */
  getServiceForSource(source: 'manual' | 'canvas'): BaseAssignmentService {
    switch (source) {
      case 'manual':
        return this.manualService;
      case 'canvas':
        return this.canvasService;
      default:
        throw new Error(`Unsupported assignment source: ${source}`);
    }
  }

  /**
   * Get service instance for existing assignment (determines type automatically)
   */
  async getServiceForAssignment(userId: string, assignmentId: string): Promise<BaseAssignmentService> {
    const assignment = await this.database.assignment.findFirst({
      where: { id: assignmentId, userId },
      select: { source: true }
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    return this.getServiceForSource(assignment.source as 'manual' | 'canvas');
  }

  /**
   * Get bulk operations service
   */
  getBulkService(): IBulkAssignmentService {
    return this.bulkService;
  }

  /**
   * Get analytics service
   */
  getAnalyticsService(): IAssignmentAnalyticsService {
    return this.analyticsService;
  }

  /**
   * Get unified service that delegates to appropriate specialized services
   */
  getUnifiedService(): ICompleteAssignmentService {
    return new UnifiedAssignmentService(this);
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
 * Bulk assignment operations service
 */
class BulkAssignmentService extends BaseAssignmentService implements IBulkAssignmentService {
  
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

  async bulkUpdateStatus(
    userId: string,
    assignmentIds: string[],
    status: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED"
  ): Promise<{ updated: number }> {
    this.validateUserId(userId);

    if (!assignmentIds.length) {
      return { updated: 0 };
    }

    const result = await this.db.assignment.updateMany({
      where: {
        id: { in: assignmentIds },
        userId
      },
      data: { status }
    });

    return { updated: result.count };
  }

  async bulkDeleteAssignments(userId: string, assignmentIds: string[]): Promise<{ deleted: number }> {
    this.validateUserId(userId);

    if (!assignmentIds.length) {
      return { deleted: 0 };
    }

    const result = await this.db.assignment.deleteMany({
      where: {
        id: { in: assignmentIds },
        userId
      }
    });

    return { deleted: result.count };
  }

  async purgeUserAssignments(userId: string): Promise<{ deleted: number }> {
    this.validateUserId(userId);

    const result = await this.db.assignment.deleteMany({
      where: { userId }
    });

    return { deleted: result.count };
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID provided');
    }
  }
}

/**
 * Assignment analytics and reporting service
 */
class AssignmentAnalyticsService extends BaseAssignmentService implements IAssignmentAnalyticsService {
  
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

  async getAssignmentStats(userId: string): Promise<{
    total: number;
    completed: number;
    overdue: number;
    upcoming: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    return await this.getStatistics(userId);
  }

  async getProductivityInsights(userId: string): Promise<{
    averageCompletionTime: number;
    onTimeSubmissionRate: number;
    mostProductiveDays: string[];
    recommendedStudyTime: number;
  }> {
    // This would integrate with analytics data in the future
    const assignments = await this.repository.findMany(userId);
    
    // Calculate basic metrics
    const completedAssignments = assignments.filter(a => a.status === 'GRADED');
    const submittedOnTime = completedAssignments.filter(a => 
      a.dueAt && a.updatedAt <= a.dueAt
    );

    return {
      averageCompletionTime: this.calculateAverageCompletionTime(completedAssignments),
      onTimeSubmissionRate: completedAssignments.length > 0 ? 
        submittedOnTime.length / completedAssignments.length : 0,
      mostProductiveDays: this.analyzeMostProductiveDays(completedAssignments),
      recommendedStudyTime: this.calculateRecommendedStudyTime(assignments)
    };
  }

  private calculateAverageCompletionTime(assignments: any[]): number {
    if (assignments.length === 0) return 0;
    
    const totalHours = assignments.reduce((sum, a) => sum + (a.estimatedHours || 2), 0);
    return totalHours / assignments.length;
  }

  private analyzeMostProductiveDays(assignments: any[]): string[] {
    const dayCount: Record<string, number> = {};
    
    assignments.forEach(a => {
      if (a.updatedAt) {
        const day = a.updatedAt.toLocaleDateString('en-US', { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
      }
    });

    return Object.entries(dayCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);
  }

  private calculateRecommendedStudyTime(assignments: any[]): number {
    const avgEstimated = assignments.reduce((sum, a) => sum + (a.estimatedHours || 2), 0) / Math.max(assignments.length, 1);
    return Math.round(avgEstimated * 1.2); // Add 20% buffer
  }
}

/**
 * Unified service that delegates to appropriate specialized services
 * Implements Facade pattern to provide simple interface to complex subsystem
 */
export class UnifiedAssignmentService implements ICompleteAssignmentService {
  private readonly factory: AssignmentServiceFactory;

  constructor(factory: AssignmentServiceFactory) {
    this.factory = factory;
  }

  // Delegate to appropriate service based on operation
  async listAssignments(userId: string, filters?: any) {
    // Use manual service as default for listing (includes all types)
    return await this.factory.getServiceForSource('manual').listAssignments(userId, filters);
  }

  async getAssignment(userId: string, assignmentId: string) {
    const service = await this.factory.getServiceForAssignment(userId, assignmentId);
    return await service.getAssignment(userId, assignmentId);
  }

  async createAssignment(userId: string, input: any) {
    const source = input.source || 'manual';
    const service = this.factory.getServiceForSource(source);
    return await service.createAssignment(userId, input);
  }

  async updateAssignment(userId: string, assignmentId: string, input: any) {
    const service = await this.factory.getServiceForAssignment(userId, assignmentId);
    return await service.updateAssignment(userId, assignmentId, input);
  }

  async deleteAssignment(userId: string, assignmentId: string) {
    const service = await this.factory.getServiceForAssignment(userId, assignmentId);
    return await service.deleteAssignment(userId, assignmentId);
  }

  // Canvas operations delegate to Canvas service
  async getAssignmentByCanvasId(userId: string, canvasId: string) {
    return await this.factory.getServiceForSource('canvas').getAssignmentByCanvasId(userId, canvasId);
  }

  async syncFromCanvas(userId: string, canvasAssignments: any[]) {
    return await this.factory.getServiceForSource('canvas').syncFromCanvas(userId, canvasAssignments);
  }

  async importFromCanvas(userId: string, canvasAssignment: any) {
    return await this.factory.getServiceForSource('canvas').importFromCanvas(userId, canvasAssignment);
  }

  // Bulk operations delegate to bulk service
  async bulkUpdateStatus(userId: string, assignmentIds: string[], status: any) {
    return await this.factory.getBulkService().bulkUpdateStatus(userId, assignmentIds, status);
  }

  async bulkDeleteAssignments(userId: string, assignmentIds: string[]) {
    return await this.factory.getBulkService().bulkDeleteAssignments(userId, assignmentIds);
  }

  async purgeUserAssignments(userId: string) {
    return await this.factory.getBulkService().purgeUserAssignments(userId);
  }

  // Analytics operations delegate to analytics service
  async getAssignmentStats(userId: string) {
    return await this.factory.getAnalyticsService().getAssignmentStats(userId);
  }

  async getProductivityInsights(userId: string) {
    return await this.factory.getAnalyticsService().getProductivityInsights(userId);
  }
}
