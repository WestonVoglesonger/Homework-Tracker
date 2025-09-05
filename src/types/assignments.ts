/**
 * Frontend Data Transfer Objects for Assignments
 * Used by React components and hooks
 */

export type AssignmentStatus = "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";

export interface AssignmentDTO {
  id: string;
  courseId?: string;
  title: string;
  description?: string;
  type: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "OTHER";
  dueAt?: string;
  estimatedHours?: number;
  status: AssignmentStatus;
  priority: number;
  notes?: string;
  source?: string;
  canvasId?: string;
  canvasUrl?: string;
  createdAt: string;
  updatedAt: string;
}
