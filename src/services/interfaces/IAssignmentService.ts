import { Assignment } from "@prisma/client";

// Data Transfer Objects for better encapsulation
export interface CreateAssignmentDTO {
  courseId?: string;
  title: string;
  description?: string;
  type?: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "OTHER";
  dueAt?: Date;
  estimatedHours?: number;
  priority?: number;
  notes?: string;
  source?: string;
  canvasId?: string;
  canvasUrl?: string;
}

export interface UpdateAssignmentDTO {
  courseId?: string;
  title?: string;
  description?: string;
  type?: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "OTHER";
  dueAt?: Date;
  estimatedHours?: number;
  status?: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
  priority?: number;
  notes?: string;
  canvasUrl?: string;
}

export interface AssignmentFilters {
  status?: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
  type?: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "OTHER";
  courseId?: string;
  from?: Date;
  to?: Date;
  source?: string;
}

/**
 * Core assignment service interface - basic CRUD operations
 */
export interface IAssignmentService {
  /**
   * List assignments for a user with optional filtering
   */
  listAssignments(userId: string, filters?: AssignmentFilters): Promise<Assignment[]>;

  /**
   * Get a single assignment by ID
   */
  getAssignment(userId: string, assignmentId: string): Promise<Assignment | null>;

  /**
   * Create a new assignment
   */
  createAssignment(userId: string, input: CreateAssignmentDTO): Promise<Assignment>;

  /**
   * Update an existing assignment
   */
  updateAssignment(userId: string, assignmentId: string, input: UpdateAssignmentDTO): Promise<Assignment>;

  /**
   * Delete an assignment
   */
  deleteAssignment(userId: string, assignmentId: string): Promise<{ success: true }>;
}

/**
 * Canvas-specific assignment operations
 */
export interface ICanvasAssignmentService {
  /**
   * Find assignment by Canvas ID
   */
  getAssignmentByCanvasId(userId: string, canvasId: string): Promise<Assignment | null>;

  /**
   * Sync assignments from Canvas
   */
  syncFromCanvas(userId: string, canvasAssignments: any[]): Promise<{
    created: number;
    updated: number;
    errors: any[];
  }>;

  /**
   * Import a single Canvas assignment
   */
  importFromCanvas(userId: string, canvasAssignment: any): Promise<Assignment>;
}

/**
 * Bulk assignment operations
 */
export interface IBulkAssignmentService {
  /**
   * Bulk update assignment statuses
   */
  bulkUpdateStatus(
    userId: string, 
    assignmentIds: string[], 
    status: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED"
  ): Promise<{ updated: number }>;

  /**
   * Bulk delete assignments
   */
  bulkDeleteAssignments(userId: string, assignmentIds: string[]): Promise<{ deleted: number }>;

  /**
   * Delete all assignments for a user
   */
  purgeUserAssignments(userId: string): Promise<{ deleted: number }>;
}

/**
 * Assignment analytics and reporting
 */
export interface IAssignmentAnalyticsService {
  /**
   * Get assignment statistics for a user
   */
  getAssignmentStats(userId: string): Promise<{
    total: number;
    completed: number;
    overdue: number;
    upcoming: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }>;

  /**
   * Get productivity insights
   */
  getProductivityInsights(userId: string): Promise<{
    averageCompletionTime: number;
    onTimeSubmissionRate: number;
    mostProductiveDays: string[];
    recommendedStudyTime: number;
  }>;
}

/**
 * Complete assignment service combining all interfaces
 */
export interface ICompleteAssignmentService 
  extends IAssignmentService, 
          ICanvasAssignmentService, 
          IBulkAssignmentService, 
          IAssignmentAnalyticsService {
}
