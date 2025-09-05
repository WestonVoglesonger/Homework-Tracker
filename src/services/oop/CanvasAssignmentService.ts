import { PrismaClient, Assignment } from "@prisma/client";
import { BaseAssignmentService } from "./BaseAssignmentService";
import { ICanvasAssignmentService, CreateAssignmentDTO, UpdateAssignmentDTO } from "../interfaces/IAssignmentService";

/**
 * Service for Canvas-imported assignments
 * Extends BaseAssignmentService with Canvas-specific logic and validation
 */
export class CanvasAssignmentService extends BaseAssignmentService implements ICanvasAssignmentService {
  
  constructor(database: PrismaClient) {
    super(database);
  }

  // Canvas-specific validation
  protected async validateCreateInput(input: CreateAssignmentDTO): Promise<void> {
    // Common validation
    this.validateCommonFields(input);
    this.validateRequiredFields(input, ['title']);

    // Canvas assignments must have Canvas ID
    if (!input.canvasId) {
      throw new Error('Canvas assignments must have a Canvas ID');
    }

    // Validate Canvas ID format
    if (!/^\d+$/.test(input.canvasId)) {
      throw new Error('Canvas ID must be numeric');
    }

    // Database constraint will handle duplicate Canvas ID prevention

    // Validate course ownership if courseId provided
    if (input.courseId) {
      await this.validateCanvasCourseOwnership(input.courseId);
    }
  }

  protected async validateUpdateInput(input: UpdateAssignmentDTO): Promise<void> {
    // Common validation
    this.validateCommonFields(input);

    // Canvas assignments have restricted update capabilities
    if (input.courseId) {
      await this.validateCanvasCourseOwnership(input.courseId);
    }

    // Validate status transitions for Canvas assignments
    if (input.status) {
      this.validateCanvasStatusTransition(input.status);
    }

    // Some fields should not be updatable for Canvas assignments
    const restrictedFields = ['type', 'source'];
    for (const field of restrictedFields) {
      if ((input as any)[field] !== undefined) {
        throw new Error(`Cannot update ${field} for Canvas assignments`);
      }
    }
  }

  protected async preprocessCreateInput(input: CreateAssignmentDTO): Promise<CreateAssignmentDTO> {
    const processed = { ...input };
    
    // Sanitize Canvas HTML description
    if (processed.description) {
      processed.description = this.sanitizeCanvasHtml(processed.description);
    }

    // Ensure Canvas source
    processed.source = 'canvas';
    
    // Parse Canvas assignment type from title/description if not provided
    if (!processed.type) {
      processed.type = this.inferAssignmentTypeFromCanvas(processed);
    }

    // Canvas assignments typically don't have estimated hours initially
    if (!processed.estimatedHours) {
      processed.estimatedHours = this.estimateHoursFromCanvas(processed);
    }

    // Validate Canvas URL format if provided
    if (processed.canvasUrl) {
      this.validateCanvasUrl(processed.canvasUrl);
    }

    return processed;
  }

  protected async preprocessUpdateInput(input: UpdateAssignmentDTO): Promise<UpdateAssignmentDTO> {
    const processed = { ...input };
    
    // Sanitize Canvas HTML description if being updated
    if (processed.description !== undefined) {
      processed.description = processed.description ? this.sanitizeCanvasHtml(processed.description) : undefined;
    }

    return processed;
  }

  // Canvas-specific interface implementation
  async getAssignmentByCanvasId(userId: string, canvasId: string): Promise<Assignment | null> {
    this.validateUserId(userId);
    
    if (!canvasId || !/^\d+$/.test(canvasId)) {
      throw new Error('Invalid Canvas ID format');
    }

    return await this.repository.findByCanvasId(userId, canvasId);
  }

  async syncFromCanvas(userId: string, canvasAssignments: any[]): Promise<{
    created: number;
    updated: number;
    errors: any[];
  }> {
    this.validateUserId(userId);

    if (!Array.isArray(canvasAssignments)) {
      throw new Error('Canvas assignments must be an array');
    }

    // Transform Canvas data to our DTO format
    const processedAssignments = canvasAssignments.map(ca => this.transformCanvasAssignment(ca));
    
    return await this.repository.bulkUpsertFromCanvas(userId, processedAssignments);
  }

  async importFromCanvas(userId: string, canvasAssignment: any): Promise<Assignment> {
    this.validateUserId(userId);
    
    if (!canvasAssignment) {
      throw new Error('Canvas assignment data is required');
    }

    const processedAssignment = this.transformCanvasAssignment(canvasAssignment);
    return await this.createAssignment(userId, processedAssignment);
  }

  // Canvas-specific helper methods
  private async validateCanvasCourseOwnership(courseId: string): Promise<void> {
    const course = await this.db.course.findFirst({
      where: { 
        id: courseId,
        source: 'canvas' // Ensure it's a Canvas course
      },
      select: { userId: true, source: true }
    });

    if (!course) {
      throw new Error('Canvas course not found');
    }
  }

  private validateCanvasStatusTransition(newStatus: string): void {
    // Canvas assignments have specific status transition rules
    const validStatuses = ['NOT_SUBMITTED', 'SUBMITTED', 'GRADED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid Canvas assignment status: ${newStatus}`);
    }
  }

  private sanitizeCanvasHtml(html: string): string {
    // Canvas HTML may contain more complex structures
    return this.sanitizeHtml(html);
  }

  private inferAssignmentTypeFromCanvas(input: CreateAssignmentDTO): "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "OTHER" {
    const title = input.title.toLowerCase();
    const description = (input.description || '').toLowerCase();
    
    if (title.includes('quiz') || title.includes('test')) return 'QUIZ';
    if (title.includes('exam') || title.includes('final')) return 'EXAM';
    if (title.includes('project') || title.includes('assignment') && description.includes('project')) return 'PROJECT';
    if (title.includes('homework') || title.includes('hw')) return 'HOMEWORK';
    
    return 'OTHER';
  }

  private estimateHoursFromCanvas(input: CreateAssignmentDTO): number {
    // Use AI/ML in the future, for now use simple heuristics
    const type = input.type || 'OTHER';
    const description = input.description || '';
    
    let baseHours = this.getBaseHoursForType(type);
    
    // Adjust based on description length and complexity indicators
    if (description.length > 1000) baseHours *= 1.5;
    if (description.includes('research') || description.includes('analysis')) baseHours *= 1.3;
    if (description.includes('presentation') || description.includes('report')) baseHours *= 1.4;
    
    return Math.round(Math.max(0.5, Math.min(20, baseHours))); // Clamp between 0.5 and 20 hours
  }

  private getBaseHoursForType(type: string): number {
    switch (type) {
      case 'HOMEWORK': return 2;
      case 'QUIZ': return 1;
      case 'EXAM': return 3;
      case 'PROJECT': return 8;
      default: return 2;
    }
  }

  private validateCanvasUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      
      // Should be HTTPS for security
      if (parsedUrl.protocol !== 'https:') {
        throw new Error('Canvas URL must use HTTPS');
      }
      
      // Should contain common Canvas URL patterns
      if (!url.includes('instructure.com') && !url.includes('canvas')) {
        console.warn('Canvas URL does not match expected patterns:', url);
      }
      
    } catch (error) {
      throw new Error(`Invalid Canvas URL format: ${url}`);
    }
  }

  private transformCanvasAssignment(canvasAssignment: any): CreateAssignmentDTO {
    return {
      title: canvasAssignment.name || canvasAssignment.title,
      description: canvasAssignment.description,
      dueAt: canvasAssignment.due_at ? new Date(canvasAssignment.due_at) : undefined,
      canvasId: String(canvasAssignment.id),
      canvasUrl: canvasAssignment.html_url,
      source: 'canvas',
      type: this.inferAssignmentTypeFromCanvas({
        title: canvasAssignment.name || '',
        description: canvasAssignment.description || ''
      } as CreateAssignmentDTO)
    };
  }

  // Override post-processing for Canvas assignments
  protected postProcessAssignment(assignment: Assignment): Assignment {
    return {
      ...assignment,
      // Add Canvas-specific computed properties if needed
    };
  }

  protected postProcessAssignments(assignments: Assignment[]): Assignment[] {
    // Canvas assignments sorted by Canvas due date priority
    return assignments.sort((a, b) => {
      // Due date priority for Canvas assignments
      if (a.dueAt && b.dueAt) {
        return a.dueAt.getTime() - b.dueAt.getTime();
      }
      if (a.dueAt && !b.dueAt) return -1;
      if (!a.dueAt && b.dueAt) return 1;
      
      // Then by Canvas ID (newer first)
      if (a.canvasId && b.canvasId) {
        return parseInt(b.canvasId) - parseInt(a.canvasId);
      }
      
      return 0;
    });
  }

  // Canvas-specific operations
  async refreshFromCanvas(userId: string, assignmentId: string, canvasData: any): Promise<Assignment> {
    const existing = await this.getAssignment(userId, assignmentId);
    if (!existing || existing.source !== 'canvas') {
      throw new Error('Cannot refresh non-Canvas assignment');
    }

    const transformedData = this.transformCanvasAssignment(canvasData);
    
    return await this.updateAssignment(userId, assignmentId, {
      title: transformedData.title,
      description: transformedData.description,
      dueAt: transformedData.dueAt,
      canvasUrl: transformedData.canvasUrl
    });
  }

  async unlinkFromCanvas(userId: string, assignmentId: string): Promise<Assignment> {
    const existing = await this.getAssignment(userId, assignmentId);
    if (!existing || existing.source !== 'canvas') {
      throw new Error('Assignment is not linked to Canvas');
    }

    // Use direct database update to set canvasUrl to null
    const updated = await this.db.assignment.update({
      where: { id: assignmentId },
      data: {
        canvasUrl: null,
        notes: (existing.notes || '') + '\n\n[Unlinked from Canvas]'
      }
    });

    return updated;
  }

  async cleanup(): Promise<void> {
    // Canvas-specific cleanup
    await super.cleanup();
  }
}
