export interface CourseDTO {
  id: string;
  name: string;
  code?: string;
  term?: string;
  color?: string;
  source: "manual" | "canvas";
  canvasId?: string;
  isImported?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  name: string;
  code?: string;
  term?: string;
  color?: string;
}

export interface UpdateCourseInput {
  name?: string;
  code?: string;
  term?: string;
  color?: string;
}

export const courseInterface = {
  async listForUser(userId: string): Promise<CourseDTO[]> {
    const { courseService } = await import("@/services/courseService");
    const courses = await courseService.list(userId);
    return courses.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code ?? undefined,
      term: c.term ?? undefined,
      color: c.color ?? undefined,
      source: (c.source as "manual" | "canvas") ?? "manual",
      canvasId: c.canvasId ?? undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  },

  async getById(userId: string, id: string): Promise<CourseDTO | null> {
    const { courseService } = await import("@/services/courseService");
    const course = await courseService.getById(userId, id);
    if (!course) return null;
    return {
      id: course.id,
      name: course.name,
      code: course.code ?? undefined,
      term: course.term ?? undefined,
      color: course.color ?? undefined,
      source: (course.source as "manual" | "canvas") ?? "manual",
      canvasId: course.canvasId ?? undefined,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  },

  async create(userId: string, input: CreateCourseInput & { source?: "manual" | "canvas"; canvasId?: string }): Promise<CourseDTO> {
    const { courseService } = await import("@/services/courseService");
    const course = await courseService.upsert(userId, {
      name: input.name,
      code: input.code,
      term: input.term,
      color: input.color,
      source: input.source ?? "manual",
      canvasId: input.canvasId ?? null,
    });
    return {
      id: course.id,
      name: course.name,
      code: course.code ?? undefined,
      term: course.term ?? undefined,
      color: course.color ?? undefined,
      source: (course.source as "manual" | "canvas") ?? "manual",
      canvasId: course.canvasId ?? undefined,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  },

  async update(userId: string, id: string, patch: UpdateCourseInput): Promise<CourseDTO> {
    const { courseService } = await import("@/services/courseService");
    const course = await courseService.update(userId, id, patch);
    return {
      id: course.id,
      name: course.name,
      code: course.code ?? undefined,
      term: course.term ?? undefined,
      color: course.color ?? undefined,
      source: (course.source as "manual" | "canvas") ?? "manual",
      canvasId: course.canvasId ?? undefined,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  },

  async delete(userId: string, id: string): Promise<{ ok: true }> {
    const { courseService } = await import("@/services/courseService");
    return courseService.remove(userId, id);
  },

  async findByUserCanvasId(userId: string, canvasId: string): Promise<CourseDTO | null> {
    const { courseService } = await import("@/services/courseService");
    const course = await courseService.findByUserCanvasId(userId, canvasId);
    if (!course) return null;
    return {
      id: course.id,
      name: course.name,
      code: course.code ?? undefined,
      term: course.term ?? undefined,
      color: course.color ?? undefined,
      source: (course.source as "manual" | "canvas") ?? "manual",
      canvasId: course.canvasId ?? undefined,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  },
};


