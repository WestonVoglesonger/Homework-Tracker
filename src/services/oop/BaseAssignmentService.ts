import { Assignment, PrismaClient } from "@prisma/client";
import { BaseService } from "../base/BaseService";
import { AssignmentRepository } from "../repositories/AssignmentRepository";
import { IAssignmentService, CreateAssignmentDTO, UpdateAssignmentDTO, AssignmentFilters } from "../interfaces/IAssignmentService";

/**
 * Abstract base class for assignment services
 * Implements common assignment operations using Template Method pattern
 */
export abstract class BaseAssignmentService extends BaseService implements IAssignmentService {
  protected readonly repository: AssignmentRepository;

  constructor(database: PrismaClient) {
    super(database);
    this.repository = new AssignmentRepository(database);
  }

  // Template method - concrete implementation
  async listAssignments(userId: string, filters?: AssignmentFilters): Promise<Assignment[]> {
    this.validateUserId(userId);
    
    const assignments = await this.repository.findMany(userId, filters);
    
    // Apply any service-specific post-processing
    return this.postProcessAssignments(assignments);
  }

  async getAssignment(userId: string, assignmentId: string): Promise<Assignment | null> {
    this.validateUserId(userId);
    this.validateAssignmentId(assignmentId);
    
    return await this.repository.findById(userId, assignmentId);
  }

  async createAssignment(userId: string, input: CreateAssignmentDTO): Promise<Assignment> {
    this.validateUserId(userId);
    await this.validateCreateInput(input);
    
    const processedInput = await this.preprocessCreateInput(input);
    const assignment = await this.repository.create(userId, processedInput);
    
    return this.postProcessAssignment(assignment);
  }

  async updateAssignment(userId: string, assignmentId: string, input: UpdateAssignmentDTO): Promise<Assignment> {
    this.validateUserId(userId);
    this.validateAssignmentId(assignmentId);
    await this.validateUpdateInput(input);
    
    const processedInput = await this.preprocessUpdateInput(input);
    const assignment = await this.repository.update(userId, assignmentId, processedInput);
    
    return this.postProcessAssignment(assignment);
  }

  async deleteAssignment(userId: string, assignmentId: string): Promise<{ success: true }> {
    this.validateUserId(userId);
    this.validateAssignmentId(assignmentId);
    
    await this.beforeDelete(userId, assignmentId);
    const result = await this.repository.delete(userId, assignmentId);
    await this.afterDelete(userId, assignmentId);
    
    return result;
  }

  // Abstract methods for customization (Template Method pattern)
  protected abstract validateCreateInput(input: CreateAssignmentDTO): Promise<void>;
  protected abstract validateUpdateInput(input: UpdateAssignmentDTO): Promise<void>;
  protected abstract preprocessCreateInput(input: CreateAssignmentDTO): Promise<CreateAssignmentDTO>;
  protected abstract preprocessUpdateInput(input: UpdateAssignmentDTO): Promise<UpdateAssignmentDTO>;
  
  // Hook methods with default implementations (can be overridden)
  protected postProcessAssignment(assignment: Assignment): Assignment {
    return assignment;
  }

  protected postProcessAssignments(assignments: Assignment[]): Assignment[] {
    return assignments;
  }

  protected async beforeDelete(userId: string, assignmentId: string): Promise<void> {
    // Default: no action needed
  }

  protected async afterDelete(userId: string, assignmentId: string): Promise<void> {
    // Default: no action needed
  }

  // Common validation methods
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID provided');
    }
  }

  private validateAssignmentId(assignmentId: string): void {
    if (!assignmentId || typeof assignmentId !== 'string' || assignmentId.trim().length === 0) {
      throw new Error('Invalid assignment ID provided');
    }
  }

  // Common validation for all assignment types
  protected validateCommonFields(input: CreateAssignmentDTO | UpdateAssignmentDTO): void {
    if ('title' in input && input.title !== undefined) {
      if (!input.title || input.title.trim().length === 0) {
        throw new Error('Assignment title cannot be empty');
      }
      if (input.title.length > 500) {
        throw new Error('Assignment title cannot exceed 500 characters');
      }
    }

    if ('priority' in input && input.priority !== undefined) {
      if (input.priority < 0 || input.priority > 2) {
        throw new Error('Priority must be between 0 and 2');
      }
    }

    if ('estimatedHours' in input && input.estimatedHours !== undefined) {
      if (input.estimatedHours < 0) {
        throw new Error('Estimated hours cannot be negative');
      }
      if (input.estimatedHours > 168) { // 1 week max
        throw new Error('Estimated hours cannot exceed 168 (1 week)');
      }
    }
  }

  // Analytics methods available to all assignment service types
  async getStatistics(userId: string): Promise<{
    total: number;
    completed: number;
    overdue: number;
    upcoming: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const [
      overdue,
      upcoming,
      statusCounts,
      typeCounts,
      total
    ] = await Promise.all([
      this.repository.findOverdue(userId),
      this.repository.findUpcoming(userId),
      this.repository.countByStatus(userId),
      this.repository.countByType(userId),
      this.repository.findMany(userId)
    ]);

    return {
      total: total.length,
      completed: statusCounts['GRADED'] || 0,
      overdue: overdue.length,
      upcoming: upcoming.length,
      byStatus: statusCounts,
      byType: typeCounts,
    };
  }

  async cleanup(): Promise<void> {
    // Base cleanup - can be overridden by subclasses
    await this.db.$disconnect();
  }
}
