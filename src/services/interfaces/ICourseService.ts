import { Course } from "@prisma/client";

// Data Transfer Objects for better encapsulation
export interface CreateCourseDTO {
  name: string;
  code?: string;
  term?: string;
  color?: string;
  source?: string;
  canvasId?: string;
}

export interface UpdateCourseDTO {
  name?: string;
  code?: string;
  term?: string;
  color?: string;
}

export interface CourseFilters {
  term?: string;
  source?: string;
  active?: boolean;
}

/**
 * Core course service interface - basic CRUD operations
 */
export interface ICourseService {
  /**
   * List courses for a user with optional filtering
   */
  listCourses(userId: string, filters?: CourseFilters): Promise<Course[]>;

  /**
   * Get a single course by ID
   */
  getCourse(userId: string, courseId: string): Promise<Course | null>;

  /**
   * Create a new course
   */
  createCourse(userId: string, input: CreateCourseDTO): Promise<Course>;

  /**
   * Update an existing course
   */
  updateCourse(userId: string, courseId: string, input: UpdateCourseDTO): Promise<Course>;

  /**
   * Delete a course
   */
  deleteCourse(userId: string, courseId: string): Promise<{ success: true }>;
}

/**
 * Canvas-specific course operations
 */
export interface ICanvasCourseService {
  /**
   * Find course by Canvas ID
   */
  getCourseByCanvasId(userId: string, canvasId: string): Promise<Course | null>;

  /**
   * Sync courses from Canvas
   */
  syncFromCanvas(userId: string, canvasCourses: any[]): Promise<{
    created: number;
    updated: number;
    errors: any[];
  }>;

  /**
   * Import a single Canvas course
   */
  importFromCanvas(userId: string, canvasCourse: any): Promise<Course>;
}

/**
 * Bulk course operations
 */
export interface IBulkCourseService {
  /**
   * Bulk delete courses
   */
  bulkDeleteCourses(userId: string, courseIds: string[]): Promise<{ deleted: number }>;

  /**
   * Delete all courses for a user
   */
  purgeUserCourses(userId: string): Promise<{ deleted: number }>;

  /**
   * Archive multiple courses
   */
  bulkArchiveCourses(userId: string, courseIds: string[]): Promise<{ updated: number }>;
}

/**
 * Course analytics and reporting
 */
export interface ICourseAnalyticsService {
  /**
   * Get course statistics for a user
   */
  getCourseStats(userId: string): Promise<{
    total: number;
    active: number;
    archived: number;
    byTerm: Record<string, number>;
    bySource: Record<string, number>;
  }>;

  /**
   * Get course workload analysis
   */
  getWorkloadAnalysis(userId: string): Promise<{
    totalAssignments: number;
    avgAssignmentsPerCourse: number;
    heaviestCourse: string;
    lightestCourse: string;
  }>;
}

/**
 * Complete course service combining all interfaces
 */
export interface ICompleteCourseService 
  extends ICourseService, 
          ICanvasCourseService, 
          IBulkCourseService, 
          ICourseAnalyticsService {
}
