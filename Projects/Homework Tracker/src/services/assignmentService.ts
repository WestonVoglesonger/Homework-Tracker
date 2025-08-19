import prisma from "../db/client";

interface ListFilters {
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  from?: string;
  to?: string;
}

export async function list(userId: string, filters: ListFilters = {}) {
  const where: any = { userId };
  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.dueAt = {} as any;
    if (filters.from) (where.dueAt as any).gte = new Date(filters.from);
    if (filters.to) (where.dueAt as any).lte = new Date(filters.to);
  }

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });
  return assignments;
}

export async function create(
  userId: string,
  input: {
    courseId?: string;
    title: string;
    description?: string;
    type?: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "OTHER";
    dueAt?: string;
    estimatedHours?: number;
    priority?: number;
    notes?: string;
    source?: string;
    canvasId?: string | null;
    canvasUrl?: string | null;
  }
) {
  const record = await prisma.assignment.create({
    data: {
      userId,
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      type: input.type ?? "OTHER",
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      estimatedHours: input.estimatedHours,
      priority: input.priority ?? 0,
      notes: input.notes,
      source: input.source ?? "manual",
      canvasId: input.canvasId ?? undefined,
      canvasUrl: input.canvasUrl ?? undefined,
    },
  });
  return record;
}

export async function update(
  userId: string,
  id: string,
  patch: Partial<{
    courseId?: string;
    title: string;
    type: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "OTHER";
    dueAt?: string;
    estimatedHours?: number;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    priority: number;
    notes?: string;
  }>
) {
  const exists = await prisma.assignment.findFirst({ where: { id, userId } });
  if (!exists) throw new Error("Not found");
  const record = await prisma.assignment.update({
    where: { id },
    data: {
      ...patch,
      dueAt: patch.dueAt ? new Date(patch.dueAt) : undefined,
    },
  });
  return record;
}

export async function remove(userId: string, id: string) {
  const res = await prisma.assignment.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw new Error("Not found");
  return { ok: true } as const;
}

export const assignmentService = { list, create, update, remove };


