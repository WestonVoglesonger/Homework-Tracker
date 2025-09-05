import { PrismaClient, Course } from "@prisma/client";
import { BaseCourseService } from "./BaseCourseService";
import { CreateCourseDTO, UpdateCourseDTO } from "../interfaces/ICourseService";

/**
 * Service for manually created courses
 * Extends BaseCourseService with manual-specific logic
 */
export class ManualCourseService extends BaseCourseService {
  
  constructor(database: PrismaClient) {
    super(database);
  }

  protected async validateCreateInput(input: CreateCourseDTO): Promise<void> {
    // Common validation
    this.validateCommonFields(input);
    
    // Manual course specific validation
    this.validateRequiredFields(input, ['name']);
    
    // Manual courses shouldn't have Canvas fields
    if (input.canvasId) {
      throw new Error('Manual courses cannot have Canvas ID');
    }

    // Validate course name uniqueness for user (pass userId for user-specific uniqueness)
    // For now, we'll allow duplicate names across users but not within same user
    // await this.validateCourseNameUniqueness(input.name, userId);
  }

  protected async validateUpdateInput(input: UpdateCourseDTO): Promise<void> {
    // Common validation
    this.validateCommonFields(input);
    
    // Validate course name uniqueness if being changed
    // For now, we'll skip uniqueness validation on update
    // if (input.name) {
    //   await this.validateCourseNameUniqueness(input.name, userId);
    // }
  }

  protected async preprocessCreateInput(input: CreateCourseDTO): Promise<CreateCourseDTO> {
    const processed = { ...input };
    
    // Ensure manual source
    processed.source = 'manual';
    
    // Set default color if not provided
    if (!processed.color) {
      processed.color = this.generateDefaultColor();
    }

    // Normalize course code to uppercase
    if (processed.code) {
      processed.code = processed.code.toUpperCase().trim();
    }

    // Set default term if not provided
    if (!processed.term) {
      processed.term = this.getCurrentTerm();
    }

    return processed;
  }

  protected async preprocessUpdateInput(input: UpdateCourseDTO): Promise<UpdateCourseDTO> {
    const processed = { ...input };
    
    // Normalize course code to uppercase if being updated
    if (processed.code !== undefined) {
      processed.code = processed.code ? processed.code.toUpperCase().trim() : undefined;
    }

    return processed;
  }

  // Manual course specific methods
  private async validateCourseNameUniqueness(name: string, userId?: string): Promise<void> {
    const where: any = { 
      name: name.trim(),
      source: 'manual'
    };
    
    // If userId provided, check uniqueness within that user's courses
    if (userId) {
      where.userId = userId;
    }

    const existing = await this.db.course.findFirst({
      where,
      select: { userId: true }
    });

    if (existing) {
      throw new Error(`A manual course with name "${name}" already exists`);
    }
  }

  private generateDefaultColor(): string {
    // Generate a pleasant default color for manual courses
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green  
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#84CC16', // Lime
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getCurrentTerm(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based
    
    // Determine semester based on month
    if (month >= 0 && month <= 4) {
      return `Spring ${year}`;
    } else if (month >= 5 && month <= 7) {
      return `Summer ${year}`;
    } else {
      return `Fall ${year}`;
    }
  }

  // Override post-processing for manual courses
  protected postProcessCourse(course: Course): Course {
    return {
      ...course,
      // Add any manual course specific processing
    };
  }

  protected postProcessCourses(courses: Course[]): Course[] {
    // Sort manual courses by term and name
    return courses.sort((a, b) => {
      // Sort by term first (most recent first) - need custom term sorting
      if (a.term && b.term && a.term !== b.term) {
        return this.compareTerms(b.term, a.term); // b.term - a.term for descending
      }
      
      // Then by name alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  private compareTerms(term1: string, term2: string): number {
    // Extract year and semester for proper sorting
    const parseterm = (term: string) => {
      const match = term.match(/(Spring|Summer|Fall) (\d{4})/);
      if (!match) return { year: 0, semester: 0 };
      
      const year = parseInt(match[2]);
      const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
      const semester = semesterOrder[match[1] as keyof typeof semesterOrder] || 0;
      
      return { year, semester };
    };
    
    const t1 = parseterm(term1);
    const t2 = parseterm(term2);
    
    // Compare by year first
    if (t1.year !== t2.year) {
      return t1.year - t2.year;
    }
    
    // Then by semester
    return t1.semester - t2.semester;
  }

  // Manual course specific operations
  async duplicateCourse(userId: string, courseId: string, newName?: string): Promise<Course> {
    const originalCourse = await this.getCourse(userId, courseId);
    if (!originalCourse) {
      throw new Error('Original course not found');
    }

    if (originalCourse.source !== 'manual') {
      throw new Error('Can only duplicate manual courses');
    }

    const duplicateInput: CreateCourseDTO = {
      name: newName || `${originalCourse.name} (Copy)`,
      code: originalCourse.code ? `${originalCourse.code}_COPY` : undefined,
      term: originalCourse.term || undefined,
      color: originalCourse.color || undefined,
      source: 'manual'
    };

    return await this.createCourse(userId, duplicateInput);
  }

  async createTemplate(userId: string, templateData: {
    name: string;
    code?: string;
    term?: string;
    color?: string;
  }): Promise<Course> {
    const input: CreateCourseDTO = {
      ...templateData,
      name: `Template: ${templateData.name}`,
      source: 'manual',
    };

    return await this.createCourse(userId, input);
  }

  async archiveCourse(userId: string, courseId: string): Promise<Course> {
    // For now, we'll use a naming convention to mark archived courses
    // In the future, you might add an archived field to the schema
    const existing = await this.getCourse(userId, courseId);
    if (!existing || existing.source !== 'manual') {
      throw new Error('Cannot archive non-manual course');
    }

    return await this.updateCourse(userId, courseId, {
      name: existing.name.includes('[ARCHIVED]') ? existing.name : `${existing.name} [ARCHIVED]`
    });
  }

  async unarchiveCourse(userId: string, courseId: string): Promise<Course> {
    const existing = await this.getCourse(userId, courseId);
    if (!existing || existing.source !== 'manual') {
      throw new Error('Cannot unarchive non-manual course');
    }

    return await this.updateCourse(userId, courseId, {
      name: existing.name.replace(' [ARCHIVED]', '')
    });
  }
}
