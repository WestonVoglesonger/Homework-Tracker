export type AssignmentStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type AssignmentType = "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "OTHER";

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
  source: "manual" | "canvas";
  canvasId?: string;
  canvasUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentInput {
  courseId?: string;
  title: string;
  type?: AssignmentType;
  dueAt?: string;
  estimatedHours?: number;
  priority?: number;
  notes?: string;
}


