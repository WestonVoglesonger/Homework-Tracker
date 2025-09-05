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
    const { getAssignmentService } = await import("@/services/container/ServiceContainer");
    const { testDb } = await import("@/test/db-setup");
    const { default: prisma } = await import("@/db/client");
    const database = testDb || prisma;
    const assignmentService = getAssignmentService(database);
    
    const items = await assignmentService.listAssignments(userId, {
      status: filters?.status,
      from: filters?.from ? new Date(filters.from) : undefined,
      to: filters?.to ? new Date(filters.to) : undefined,
    });
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
    const { getAssignmentService } = await import("@/services/container/ServiceContainer");
    const { testDb } = await import("@/test/db-setup");
    const { default: prisma } = await import("@/db/client");
    const database = testDb || prisma;
    const assignmentService = getAssignmentService(database);
    
    const a = await assignmentService.getAssignment(userId, id);
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
    const { getAssignmentService } = await import("@/services/container/ServiceContainer");
    const { testDb } = await import("@/test/db-setup");
    const { default: prisma } = await import("@/db/client");
    const database = testDb || prisma;
    const assignmentService = getAssignmentService(database);
    
    const created = await assignmentService.createAssignment(userId, {
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      type: input.type,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      estimatedHours: input.estimatedHours,
      priority: input.priority,
      notes: input.notes,
      source: input.source,
      canvasId: input.canvasId,
      canvasUrl: input.canvasUrl,
    });
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
    const { getAssignmentService } = await import("@/services/container/ServiceContainer");
    const { testDb } = await import("@/test/db-setup");
    const { default: prisma } = await import("@/db/client");
    const database = testDb || prisma;
    const assignmentService = getAssignmentService(database);
    
    const updated = await assignmentService.updateAssignment(userId, id, {
      courseId: patch.courseId,
      title: patch.title,
      description: patch.description,
      type: patch.type,
      dueAt: patch.dueAt ? new Date(patch.dueAt) : undefined,
      estimatedHours: patch.estimatedHours,
      status: patch.status,
      priority: patch.priority,
      notes: patch.notes,
      canvasUrl: patch.canvasUrl,
    });
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
    const { getAssignmentService } = await import("@/services/container/ServiceContainer");
    const { testDb } = await import("@/test/db-setup");
    const { default: prisma } = await import("@/db/client");
    const database = testDb || prisma;
    const assignmentService = getAssignmentService(database);
    
    await assignmentService.deleteAssignment(userId, id);
    return { ok: true };
  },

  async findByUserCanvasId(userId: string, canvasId: string): Promise<AssignmentDTO | null> {
    const { getAssignmentService } = await import("@/services/container/ServiceContainer");
    const { testDb } = await import("@/test/db-setup");
    const { default: prisma } = await import("@/db/client");
    const database = testDb || prisma;
    const assignmentService = getAssignmentService(database);
    
    const assignment = await assignmentService.getAssignmentByCanvasId(userId, canvasId);
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


