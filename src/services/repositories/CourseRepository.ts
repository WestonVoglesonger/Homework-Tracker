import { PrismaClient, Course } from "@prisma/client";
import { ICanvasRepository } from "../interfaces/IRepository";
import { CreateCourseDTO, UpdateCourseDTO, CourseFilters } from "../interfaces/ICourseService";

/**
 * Repository class for Course data access
 * Implements Repository Pattern for data access abstraction
 */
export class CourseRepository implements ICanvasRepository<Course, CreateCourseDTO, UpdateCourseDTO> {
  private readonly db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  async findById(userId: string, id: string): Promise<Course | null> {
    return await this.db.course.findFirst({
      where: { id, userId }
    });
  }

  async findMany(userId: string, filters: CourseFilters = {}): Promise<Course[]> {
    const where: any = { userId };

    // Apply filters
    if (filters.term) where.term = filters.term;
    if (filters.source) where.source = filters.source;
    if (filters.active !== undefined) {
      // Assuming active means not archived - you might need to add an archived field
      // For now, we'll just filter by source or other criteria
    }

    return await this.db.course.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
  }

  async create(userId: string, input: CreateCourseDTO): Promise<Course> {
    return await this.db.course.create({
      data: {
        userId,
        name: input.name,
        code: input.code || null,
        term: input.term || null,
        color: input.color || null,
        source: input.source || "manual",
        canvasId: input.canvasId || null,
      }
    });
  }

  async update(userId: string, id: string, input: UpdateCourseDTO): Promise<Course> {
    // Verify ownership first
    const existing = await this.findById(userId, id);
    if (!existing) {
      throw new Error("Course not found or access denied");
    }

    return await this.db.course.update({
      where: { id },
      data: {
        ...input,
        // Handle optional fields properly
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.term !== undefined ? { term: input.term } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      }
    });
  }

  async delete(userId: string, id: string): Promise<{ success: true }> {
    const result = await this.db.course.deleteMany({
      where: { id, userId }
    });

    if (result.count === 0) {
      throw new Error("Course not found or access denied");
    }

    return { success: true };
  }

  // Canvas-specific methods
  async findByCanvasId(userId: string, canvasId: string): Promise<Course | null> {
    return await this.db.course.findUnique({
      where: {
        userId_canvasId: {
          userId,
          canvasId
        }
      }
    });
  }

  async bulkUpsertFromCanvas(userId: string, canvasData: any[]): Promise<{
    created: number;
    updated: number;
    errors: any[];
  }> {
    let created = 0;
    let updated = 0;
    const errors: any[] = [];

    for (const canvasCourse of canvasData) {
      try {
        const existing = await this.findByCanvasId(userId, canvasCourse.canvasId);
        
        if (existing) {
          await this.update(userId, existing.id, {
            name: canvasCourse.name,
            code: canvasCourse.code,
            term: canvasCourse.term,
            color: canvasCourse.color,
          });
          updated++;
        } else {
          await this.create(userId, {
            ...canvasCourse,
            source: 'canvas'
          });
          created++;
        }
      } catch (error) {
        errors.push({
          canvasId: canvasCourse.canvasId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { created, updated, errors };
  }

  // Additional course-specific queries
  async findByTerm(userId: string, term: string): Promise<Course[]> {
    return await this.db.course.findMany({
      where: {
        userId,
        term
      },
      orderBy: { name: "asc" }
    });
  }

  async findActive(userId: string): Promise<Course[]> {
    // For now, all courses are considered active
    // In the future, you might add an archived field
    return await this.db.course.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async countBySource(userId: string): Promise<Record<string, number>> {
    const results = await this.db.course.groupBy({
      by: ['source'],
      where: { userId },
      _count: { source: true }
    });

    return results.reduce((acc, result) => {
      acc[result.source] = result._count.source;
      return acc;
    }, {} as Record<string, number>);
  }

  async countByTerm(userId: string): Promise<Record<string, number>> {
    const results = await this.db.course.groupBy({
      by: ['term'],
      where: { 
        userId,
        term: { not: null }
      },
      _count: { term: true }
    });

    return results.reduce((acc, result) => {
      if (result.term) {
        acc[result.term] = result._count.term;
      }
      return acc;
    }, {} as Record<string, number>);
  }

  async purgeAll(userId: string): Promise<{ deleted: number }> {
    const result = await this.db.course.deleteMany({
      where: { userId }
    });

    return { deleted: result.count };
  }

  async getWithAssignmentCount(userId: string): Promise<Array<Course & { _count: { assignments: number } }>> {
    return await this.db.course.findMany({
      where: { userId },
      include: {
        _count: {
          select: { assignments: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }) as any;
  }
}
