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
  source?: "manual" | "canvas";
  canvasId?: string;
  description?: string;
  canvasUrl?: string;
}

export interface UpdateAssignmentInput {
  courseId?: string;
  title?: string;
  type?: AssignmentType;
  dueAt?: string;
  estimatedHours?: number;
  status?: AssignmentStatus;
  priority?: number;
  notes?: string;
  description?: string;
  canvasUrl?: string;
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

  async create(userId: string, input: CreateAssignmentInput): Promise<AssignmentDTO> {
    const { assignmentService } = await import("@/services/assignmentService");
    const created = await assignmentService.create(userId, input as any);
    return {
      id: created.id,
      courseId: created.courseId ?? undefined,
      title: created.title,
      description: created.description ?? undefined,
      type: created.type as any,
      dueAt: created.dueAt ? created.dueAt.toISOString() : undefined,
      estimatedHours: created.estimatedHours ?? undefined,
      status: created.status as any,
      priority: created.priority,
      notes: created.notes ?? undefined,
      source: (created.source as any) ?? "manual",
      canvasId: created.canvasId ?? undefined,
      canvasUrl: created.canvasUrl ?? undefined,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  },

  async update(userId: string, id: string, patch: UpdateAssignmentInput): Promise<AssignmentDTO> {
    const { assignmentService } = await import("@/services/assignmentService");
    const updated = await assignmentService.update(userId, id, patch as any);
    return {
      id: updated.id,
      courseId: updated.courseId ?? undefined,
      title: updated.title,
      description: updated.description ?? undefined,
      type: updated.type as any,
      dueAt: updated.dueAt ? updated.dueAt.toISOString() : undefined,
      estimatedHours: updated.estimatedHours ?? undefined,
      status: updated.status as any,
      priority: updated.priority,
      notes: updated.notes ?? undefined,
      source: (updated.source as any) ?? "manual",
      canvasId: updated.canvasId ?? undefined,
      canvasUrl: updated.canvasUrl ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async delete(userId: string, id: string): Promise<{ ok: true }> {
    const { assignmentService } = await import("@/services/assignmentService");
    return assignmentService.remove(userId, id);
  },

  async findByUserCanvasId(userId: string, canvasId: string): Promise<AssignmentDTO | null> {
    const { assignmentService } = await import("@/services/assignmentService");
    const assignment = await assignmentService.getByUserCanvasId(userId, canvasId);
    if (!assignment) return null;
    return {
      id: assignment.id,
      courseId: assignment.courseId ?? undefined,
      title: assignment.title,
      description: assignment.description ?? undefined,
      type: assignment.type as any,
      dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : undefined,
      estimatedHours: assignment.estimatedHours ?? undefined,
      status: assignment.status as any,
      priority: assignment.priority,
      notes: assignment.notes ?? undefined,
      source: (assignment.source as any) ?? "manual",
      canvasId: assignment.canvasId ?? undefined,
      canvasUrl: assignment.canvasUrl ?? undefined,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    };
  },
};


