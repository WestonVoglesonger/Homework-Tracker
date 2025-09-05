/**
 * Frontend Data Transfer Objects for Courses
 * Used by React components and hooks
 */

export interface CourseDTO {
  id: string;
  name: string;
  code?: string;
  term?: string;
  color?: string;
  source?: string;
  canvasId?: string;
  createdAt: string;
  updatedAt: string;
}
