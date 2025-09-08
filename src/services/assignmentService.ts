import prisma from "../db/client";
import DOMPurify from "isomorphic-dompurify";
import { streakService } from "./streakService";

interface ListFilters {
  status?: "NOT_SUBMITTED" | "PLANNED" | "SUBMITTED" | "GRADED";
  from?: string;
  to?: string;
}

export async function list(userId: string, filters: ListFilters = {}) {
  const where: {
    userId: string;
    status?: string;
    dueAt?: {
      gte?: Date;
      lte?: Date;
    };
  } = { userId };
  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.dueAt = {};
    if (filters.from) where.dueAt.gte = new Date(filters.from);
    if (filters.to) where.dueAt.lte = new Date(filters.to);
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
    status?: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
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
      description: input.description ? DOMPurify.sanitize(input.description, { USE_PROFILES: { html: true } }) : undefined,
      type: input.type ?? "OTHER",
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      estimatedHours: input.estimatedHours,
      priority: input.priority ?? 0,
      notes: input.notes,
      status: input.status ?? undefined,
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
    status: "NOT_SUBMITTED" | "PLANNED" | "SUBMITTED" | "GRADED";
    priority: number;
    notes?: string;
    description?: string;
  }>
) {
  const exists = await prisma.assignment.findFirst({ where: { id, userId } });
  if (!exists) throw new Error("Not found");

  const record = await prisma.assignment.update({
    where: { id },
    data: {
      ...patch,
      dueAt: patch.dueAt ? new Date(patch.dueAt) : undefined,
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description ? DOMPurify.sanitize(patch.description, { USE_PROFILES: { html: true } }) : null }
        : {}),
    },
  });

  // Record meaningful action for streak if status changed to PLANNED or GRADED
  if (patch.status && (patch.status === "PLANNED" || patch.status === "GRADED")) {
    try {
      await streakService.recordMeaningfulAction(userId);
    } catch (error) {
      console.error('Failed to record streak action:', error);
      // Don't fail the assignment update if streak recording fails
    }
  }

  return record;
}

export async function remove(userId: string, id: string) {
  const res = await prisma.assignment.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw new Error("Not found");
  return { ok: true } as const;
}

export async function getById(userId: string, id: string) {
  const assignment = await prisma.assignment.findFirst({ where: { id, userId } });
  return assignment;
}

export async function getByUserCanvasId(userId: string, canvasId: string) {
  const assignment = await prisma.assignment.findUnique({ where: { userId_canvasId: { userId, canvasId } } });
  return assignment;
}

export async function purgeAllForUser(userId: string) {
  const res = await prisma.assignment.deleteMany({ where: { userId } });
  return { deleted: res.count } as const;
}

export const assignmentService = { list, create, update, remove, getById, getByUserCanvasId, purgeAllForUser };


