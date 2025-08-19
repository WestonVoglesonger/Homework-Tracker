import prisma from "../db/client";
import { Prisma } from "@prisma/client";

export async function list(userId: string) {
  const courses = await prisma.course.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return courses;
}

export async function create(
  userId: string,
  input: { name: string; code?: string; term?: string; color?: string; source?: string; canvasId?: string | null }
) {
  const course = await prisma.course.create({
    data: {
      userId,
      name: input.name,
      code: input.code,
      term: input.term,
      color: input.color,
      source: input.source ?? "manual",
      canvasId: input.canvasId ?? undefined,
    },
  });
  return course;
}

export async function upsert(
  userId: string,
  input: { name: string; code?: string; term?: string; color?: string; source?: string; canvasId?: string | null }
) {
  if (!input.canvasId) {
    return create(userId, input);
  }
  const course = await prisma.course.upsert({
    where: {
      userId_canvasId: { userId, canvasId: input.canvasId },
    },
    update: {
      name: input.name,
      code: input.code,
      term: input.term,
      color: input.color,
      source: input.source ?? "manual",
    },
    create: {
      userId,
      name: input.name,
      code: input.code,
      term: input.term,
      color: input.color,
      source: input.source ?? "manual",
      canvasId: input.canvasId,
    },
  });
  return course;
}

export async function update(
  userId: string,
  id: string,
  patch: Partial<{ name: string; code?: string; term?: string; color?: string }>
) {
  const exists = await prisma.course.findFirst({ where: { id, userId } });
  if (!exists) throw new Error("Not found");
  const course = await prisma.course.update({ where: { id }, data: patch });
  return course;
}

export async function remove(userId: string, id: string) {
  const res = await prisma.course.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw new Error("Not found");
  return { ok: true } as const;
}

export const courseService = { list, create, upsert, update, remove };


