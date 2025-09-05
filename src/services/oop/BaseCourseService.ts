import { Course, PrismaClient } from "@prisma/client";
import { BaseService } from "../base/BaseService";
import { CourseRepository } from "../repositories/CourseRepository";
import { ICourseService, CreateCourseDTO, UpdateCourseDTO, CourseFilters } from "../interfaces/ICourseService";

/**
 * Abstract base class for course services
 * Implements common course operations using Template Method pattern
 */
export abstract class BaseCourseService extends BaseService implements ICourseService {
  protected readonly repository: CourseRepository;

  constructor(database: PrismaClient) {
    super(database);
    this.repository = new CourseRepository(database);
  }

  // Template method - concrete implementation
  async listCourses(userId: string, filters?: CourseFilters): Promise<Course[]> {
    this.validateUserId(userId);
    
    const courses = await this.repository.findMany(userId, filters);
    
    // Apply any service-specific post-processing
    return this.postProcessCourses(courses);
  }

  async getCourse(userId: string, courseId: string): Promise<Course | null> {
    this.validateUserId(userId);
    this.validateCourseId(courseId);
    
    return await this.repository.findById(userId, courseId);
  }

  async createCourse(userId: string, input: CreateCourseDTO): Promise<Course> {
    this.validateUserId(userId);
    await this.validateCreateInput(input);
    
    const processedInput = await this.preprocessCreateInput(input);
    const course = await this.repository.create(userId, processedInput);
    
    return this.postProcessCourse(course);
  }

  async updateCourse(userId: string, courseId: string, input: UpdateCourseDTO): Promise<Course> {
    this.validateUserId(userId);
    this.validateCourseId(courseId);
    await this.validateUpdateInput(input);
    
    const processedInput = await this.preprocessUpdateInput(input);
    const course = await this.repository.update(userId, courseId, processedInput);
    
    return this.postProcessCourse(course);
  }

  async deleteCourse(userId: string, courseId: string): Promise<{ success: true }> {
    this.validateUserId(userId);
    this.validateCourseId(courseId);
    
    await this.beforeDelete(userId, courseId);
    const result = await this.repository.delete(userId, courseId);
    await this.afterDelete(userId, courseId);
    
    return result;
  }

  // Abstract methods for customization (Template Method pattern)
  protected abstract validateCreateInput(input: CreateCourseDTO): Promise<void>;
  protected abstract validateUpdateInput(input: UpdateCourseDTO): Promise<void>;
  protected abstract preprocessCreateInput(input: CreateCourseDTO): Promise<CreateCourseDTO>;
  protected abstract preprocessUpdateInput(input: UpdateCourseDTO): Promise<UpdateCourseDTO>;
  
  // Hook methods with default implementations (can be overridden)
  protected postProcessCourse(course: Course): Course {
    return course;
  }

  protected postProcessCourses(courses: Course[]): Course[] {
    return courses;
  }

  protected async beforeDelete(userId: string, courseId: string): Promise<void> {
    // Default: no action needed
  }

  protected async afterDelete(userId: string, courseId: string): Promise<void> {
    // Default: no action needed
  }

  // Common validation methods
  protected validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID provided');
    }
  }

  private validateCourseId(courseId: string): void {
    if (!courseId || typeof courseId !== 'string' || courseId.trim().length === 0) {
      throw new Error('Invalid course ID provided');
    }
  }

  // Common validation for all course types
  protected validateCommonFields(input: CreateCourseDTO | UpdateCourseDTO): void {
    if ('name' in input && input.name !== undefined) {
      if (!input.name || input.name.trim().length === 0) {
        throw new Error('Course name cannot be empty');
      }
      if (input.name.length > 200) {
        throw new Error('Course name cannot exceed 200 characters');
      }
    }

    if ('code' in input && input.code !== undefined) {
      if (input.code && input.code.length > 20) {
        throw new Error('Course code cannot exceed 20 characters');
      }
    }

    if ('term' in input && input.term !== undefined) {
      if (input.term && input.term.length > 50) {
        throw new Error('Term cannot exceed 50 characters');
      }
    }

    if ('color' in input && input.color !== undefined) {
      if (input.color && !/^#[0-9A-F]{6}$/i.test(input.color)) {
        throw new Error('Color must be a valid hex color (e.g., #FF5733)');
      }
    }
  }

  // Analytics methods available to all course service types
  async getStatistics(userId: string): Promise<{
    total: number;
    active: number;
    archived: number;
    byTerm: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const [
      allCourses,
      sourceCounts,
      termCounts
    ] = await Promise.all([
      this.repository.findMany(userId),
      this.repository.countBySource(userId),
      this.repository.countByTerm(userId)
    ]);

    return {
      total: allCourses.length,
      active: allCourses.length, // All courses are active for now
      archived: 0,
      byTerm: termCounts,
      bySource: sourceCounts,
    };
  }

  async cleanup(): Promise<void> {
    // Base cleanup - can be overridden by subclasses
    await this.db.$disconnect();
  }
}
