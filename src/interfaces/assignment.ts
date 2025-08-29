export type AssignmentStatus = "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
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

export const assignmentInterface = {
  async listForUser(userId: string, filters?: { status?: AssignmentStatus; from?: string; to?: string }): Promise<AssignmentDTO[]> {
    const { assignmentService } = await import("@/services/assignmentService");
    const items = await assignmentService.list(userId, filters as any);
    return items.map((a) => ({
      id: a.id,
      courseId: a.courseId ?? undefined,
      title: a.title,
      description: a.description ?? undefined,
      type: a.type as any,
      dueAt: a.dueAt ? a.dueAt.toISOString() : undefined,
      estimatedHours: a.estimatedHours ?? undefined,
      status: a.status as any,
      priority: a.priority,
      notes: a.notes ?? undefined,
      source: (a.source as any) ?? "manual",
      canvasId: a.canvasId ?? undefined,
      canvasUrl: a.canvasUrl ?? undefined,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  },
  async getById(userId: string, id: string): Promise<AssignmentDTO | null> {
    const { assignmentService } = await import("@/services/assignmentService");
    const a = await assignmentService.getById(userId, id);
    if (!a) return null;
    return {
      id: a.id,
      courseId: a.courseId ?? undefined,
      title: a.title,
      description: a.description ?? undefined,
      type: a.type as any,
      dueAt: a.dueAt ? a.dueAt.toISOString() : undefined,
      estimatedHours: a.estimatedHours ?? undefined,
      status: a.status as any,
      priority: a.priority,
      notes: a.notes ?? undefined,
      source: (a.source as any) ?? "manual",
      canvasId: a.canvasId ?? undefined,
      canvasUrl: a.canvasUrl ?? undefined,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  },
};


