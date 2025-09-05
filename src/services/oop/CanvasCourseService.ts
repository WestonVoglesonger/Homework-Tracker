import { PrismaClient, Course } from "@prisma/client";
import { BaseCourseService } from "./BaseCourseService";
import { ICanvasCourseService, CreateCourseDTO, UpdateCourseDTO } from "../interfaces/ICourseService";

/**
 * Service for Canvas-imported courses
 * Extends BaseCourseService with Canvas-specific logic and validation
 */
export class CanvasCourseService extends BaseCourseService implements ICanvasCourseService {
  
  constructor(database: PrismaClient) {
    super(database);
  }

  // Canvas-specific validation
  protected async validateCreateInput(input: CreateCourseDTO): Promise<void> {
    // Common validation
    this.validateCommonFields(input);
    this.validateRequiredFields(input, ['name']);

    // Canvas courses must have Canvas ID
    if (!input.canvasId) {
      throw new Error('Canvas courses must have a Canvas ID');
    }

    // Validate Canvas ID format
    if (!/^\d+$/.test(input.canvasId)) {
      throw new Error('Canvas ID must be numeric');
    }

    // Check for duplicate Canvas courses
    const existing = await this.repository.findByCanvasId(input.canvasId, input.canvasId);
    if (existing) {
      throw new Error(`Course with Canvas ID ${input.canvasId} already exists`);
    }
  }

  protected async validateUpdateInput(input: UpdateCourseDTO): Promise<void> {
    // Common validation
    this.validateCommonFields(input);

    // Canvas courses have restricted update capabilities
    // Some fields should not be updatable for Canvas courses
    const restrictedFields = ['source'];
    for (const field of restrictedFields) {
      if ((input as any)[field] !== undefined) {
        throw new Error(`Cannot update ${field} for Canvas courses`);
      }
    }
  }

  protected async preprocessCreateInput(input: CreateCourseDTO): Promise<CreateCourseDTO> {
    const processed = { ...input };
    
    // Ensure Canvas source
    processed.source = 'canvas';
    
    // Set default color based on Canvas course if not provided
    if (!processed.color) {
      processed.color = this.generateCanvasColor(processed.name);
    }

    // Parse Canvas course code if not provided
    if (!processed.code) {
      processed.code = this.inferCourseCodeFromCanvas(processed);
    }

    // Parse Canvas term if not provided
    if (!processed.term) {
      processed.term = this.inferTermFromCanvas(processed);
    }

    return processed;
  }

  protected async preprocessUpdateInput(input: UpdateCourseDTO): Promise<UpdateCourseDTO> {
    const processed = { ...input };
    
    // Canvas courses can be updated but with restrictions
    return processed;
  }

  // Canvas-specific interface implementation
  async getCourseByCanvasId(userId: string, canvasId: string): Promise<Course | null> {
    this.validateUserId(userId);
    
    if (!canvasId || !/^\d+$/.test(canvasId)) {
      throw new Error('Invalid Canvas ID format');
    }

    return await this.repository.findByCanvasId(userId, canvasId);
  }

  async syncFromCanvas(userId: string, canvasCourses: any[]): Promise<{
    created: number;
    updated: number;
    errors: any[];
  }> {
    this.validateUserId(userId);

    if (!Array.isArray(canvasCourses)) {
      throw new Error('Canvas courses must be an array');
    }

    // Transform Canvas data to our DTO format
    const processedCourses = canvasCourses.map(cc => this.transformCanvasCourse(cc));
    
    return await this.repository.bulkUpsertFromCanvas(userId, processedCourses);
  }

  async importFromCanvas(userId: string, canvasCourse: any): Promise<Course> {
    this.validateUserId(userId);
    
    if (!canvasCourse) {
      throw new Error('Canvas course data is required');
    }

    const processedCourse = this.transformCanvasCourse(canvasCourse);
    return await this.createCourse(userId, processedCourse);
  }

  // Canvas-specific helper methods
  private generateCanvasColor(courseName: string): string {
    // Generate consistent colors based on course name hash
    const hash = courseName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      '#1E40AF', // Blue
      '#059669', // Green
      '#D97706', // Orange
      '#DC2626', // Red
      '#7C3AED', // Purple
      '#0891B2', // Cyan
    ];
    
    return colors[Math.abs(hash) % colors.length];
  }

  private inferCourseCodeFromCanvas(input: CreateCourseDTO): string {
    // Try to extract course code from Canvas course name
    const name = input.name;
    
    // Look for patterns like "CS 101", "MATH-201", "ENG101"
    const codeMatch = name.match(/([A-Z]{2,4})\s*[-\s]?\s*(\d{3,4})/i);
    if (codeMatch) {
      return `${codeMatch[1].toUpperCase()}${codeMatch[2]}`;
    }
    
    // Fallback: use first few letters + random number
    const prefix = name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const suffix = Math.floor(Math.random() * 900) + 100;
    return `${prefix}${suffix}`;
  }

  private inferTermFromCanvas(input: CreateCourseDTO): string {
    // Canvas might have term information in the course name or we can infer from current date
    const name = input.name.toLowerCase();
    
    if (name.includes('spring')) return name.match(/spring \d{4}/i)?.[0] || this.getCurrentTerm();
    if (name.includes('summer')) return name.match(/summer \d{4}/i)?.[0] || this.getCurrentTerm();
    if (name.includes('fall')) return name.match(/fall \d{4}/i)?.[0] || this.getCurrentTerm();
    if (name.includes('winter')) return name.match(/winter \d{4}/i)?.[0] || this.getCurrentTerm();
    
    // Default to current term
    return this.getCurrentTerm();
  }

  private getCurrentTerm(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    if (month >= 0 && month <= 4) {
      return `Spring ${year}`;
    } else if (month >= 5 && month <= 7) {
      return `Summer ${year}`;
    } else {
      return `Fall ${year}`;
    }
  }

  private transformCanvasCourse(canvasCourse: any): CreateCourseDTO {
    return {
      name: canvasCourse.name,
      code: canvasCourse.course_code || undefined,
      term: canvasCourse.term?.name || undefined,
      canvasId: String(canvasCourse.id),
      source: 'canvas'
    };
  }

  // Override post-processing for Canvas courses
  protected postProcessCourse(course: Course): Course {
    return {
      ...course,
      // Add Canvas-specific computed properties if needed
    };
  }

  protected postProcessCourses(courses: Course[]): Course[] {
    // Canvas courses sorted by Canvas ID (newer first)
    return courses.sort((a, b) => {
      if (a.canvasId && b.canvasId) {
        return parseInt(b.canvasId) - parseInt(a.canvasId);
      }
      
      // Fallback to creation date
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  // Canvas-specific operations
  async refreshFromCanvas(userId: string, courseId: string, canvasData: any): Promise<Course> {
    const existing = await this.getCourse(userId, courseId);
    if (!existing || existing.source !== 'canvas') {
      throw new Error('Cannot refresh non-Canvas course');
    }

    const transformedData = this.transformCanvasCourse(canvasData);
    
    return await this.updateCourse(userId, courseId, {
      name: transformedData.name,
      code: transformedData.code,
      term: transformedData.term
    });
  }

  async unlinkFromCanvas(userId: string, courseId: string): Promise<Course> {
    const existing = await this.getCourse(userId, courseId);
    if (!existing || existing.source !== 'canvas') {
      throw new Error('Course is not linked to Canvas');
    }

    // Use direct database update to convert to manual course
    const updated = await this.db.course.update({
      where: { id: courseId },
      data: {
        source: 'manual',
        canvasId: null,
        name: `${existing.name} [Unlinked from Canvas]`
      }
    });

    return updated;
  }

  async cleanup(): Promise<void> {
    // Canvas-specific cleanup
    await super.cleanup();
  }
}
