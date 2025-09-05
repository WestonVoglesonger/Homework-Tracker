import { PrismaClient, Assignment } from "@prisma/client";
import { BaseAssignmentService } from "./BaseAssignmentService";
import { CreateAssignmentDTO, UpdateAssignmentDTO } from "../interfaces/IAssignmentService";

/**
 * Service for manually created assignments
 * Extends BaseAssignmentService with manual-specific logic
 */
export class ManualAssignmentService extends BaseAssignmentService {
  
  constructor(database: PrismaClient) {
    super(database);
  }

  protected async validateCreateInput(input: CreateAssignmentDTO): Promise<void> {
    // Common validation
    this.validateCommonFields(input);
    
    // Manual assignment specific validation
    this.validateRequiredFields(input, ['title']);
    
    // Manual assignments shouldn't have Canvas fields
    if (input.canvasId || input.canvasUrl) {
      throw new Error('Manual assignments cannot have Canvas ID or URL');
    }

    // Validate course ownership if courseId provided
    if (input.courseId) {
      await this.validateCourseOwnership(input.courseId);
    }
  }

  protected async validateUpdateInput(input: UpdateAssignmentDTO): Promise<void> {
    // Common validation
    this.validateCommonFields(input);
    
    // Validate course ownership if courseId being changed
    if (input.courseId) {
      await this.validateCourseOwnership(input.courseId);
    }

    // Validate status transitions for manual assignments
    if (input.status) {
      this.validateStatusTransition(input.status);
    }
  }

  protected async preprocessCreateInput(input: CreateAssignmentDTO): Promise<CreateAssignmentDTO> {
    const processed = { ...input };
    
    // Sanitize HTML description if provided
    if (processed.description) {
      processed.description = this.sanitizeHtml(processed.description);
    }

    // Ensure manual source
    processed.source = 'manual';
    
    // Set default type if not provided
    if (!processed.type) {
      processed.type = 'HOMEWORK';
    }

    // Auto-generate estimated hours based on type if not provided
    if (!processed.estimatedHours) {
      processed.estimatedHours = this.getDefaultEstimatedHours(processed.type);
    }

    return processed;
  }

  protected async preprocessUpdateInput(input: UpdateAssignmentDTO): Promise<UpdateAssignmentDTO> {
    const processed = { ...input };
    
    // Sanitize HTML description if being updated
    if (processed.description !== undefined) {
      processed.description = processed.description ? this.sanitizeHtml(processed.description) : null;
    }

    return processed;
  }

  // Manual assignment specific methods
  private async validateCourseOwnership(courseId: string): Promise<void> {
    const course = await this.db.course.findFirst({
      where: { id: courseId },
      select: { userId: true }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Note: We can't validate userId here since it's not passed to this method
    // This validation should be done at the service level
  }

  private validateStatusTransition(newStatus: string): void {
    // Manual assignments can transition freely between statuses
    const validStatuses = ['NOT_SUBMITTED', 'SUBMITTED', 'GRADED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  private getDefaultEstimatedHours(type: string): number {
    // Provide realistic defaults based on assignment type
    switch (type) {
      case 'HOMEWORK': return 2;
      case 'QUIZ': return 1;
      case 'EXAM': return 3;
      case 'PROJECT': return 8;
      default: return 2;
    }
  }

  // Override post-processing for manual assignments
  protected postProcessAssignment(assignment: Assignment): Assignment {
    // Add any manual assignment specific processing
    return {
      ...assignment,
      // Could add computed fields here
    };
  }

  protected postProcessAssignments(assignments: Assignment[]): Assignment[] {
    // Sort manual assignments by priority and due date
    return assignments.sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Then by due date (earliest first)
      if (a.dueAt && b.dueAt) {
        return a.dueAt.getTime() - b.dueAt.getTime();
      }
      
      // Assignments with due dates come before those without
      if (a.dueAt && !b.dueAt) return -1;
      if (!a.dueAt && b.dueAt) return 1;
      
      // Finally by creation date
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  // Manual assignment specific operations
  async duplicateAssignment(userId: string, assignmentId: string, newTitle?: string): Promise<Assignment> {
    const originalAssignment = await this.getAssignment(userId, assignmentId);
    if (!originalAssignment) {
      throw new Error('Original assignment not found');
    }

    if (originalAssignment.source !== 'manual') {
      throw new Error('Can only duplicate manual assignments');
    }

    const duplicateInput: CreateAssignmentDTO = {
      courseId: originalAssignment.courseId || undefined,
      title: newTitle || `${originalAssignment.title} (Copy)`,
      description: originalAssignment.description || undefined,
      type: originalAssignment.type as any,
      estimatedHours: originalAssignment.estimatedHours || undefined,
      priority: originalAssignment.priority,
      notes: originalAssignment.notes || undefined,
      source: 'manual'
    };

    return await this.createAssignment(userId, duplicateInput);
  }

  async createTemplate(userId: string, templateData: {
    title: string;
    type: CreateAssignmentDTO['type'];
    estimatedHours?: number;
    description?: string;
  }): Promise<Assignment> {
    const input: CreateAssignmentDTO = {
      ...templateData,
      title: `Template: ${templateData.title}`,
      source: 'manual',
      priority: 0,
      notes: 'This is a template assignment that can be duplicated'
    };

    return await this.createAssignment(userId, input);
  }
}
