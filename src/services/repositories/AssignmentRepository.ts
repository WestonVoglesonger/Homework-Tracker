import { PrismaClient, Assignment } from "@prisma/client";
import { ICanvasRepository } from "../interfaces/IRepository";
import { CreateAssignmentDTO, UpdateAssignmentDTO, AssignmentFilters } from "../interfaces/IAssignmentService";

/**
 * Repository class for Assignment data access
 * Implements Repository Pattern for data access abstraction
 */
export class AssignmentRepository implements ICanvasRepository<Assignment, CreateAssignmentDTO, UpdateAssignmentDTO> {
  private readonly db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  async findById(userId: string, id: string): Promise<Assignment | null> {
    return await this.db.assignment.findFirst({
      where: { id, userId }
    });
  }

  async findMany(userId: string, filters: AssignmentFilters = {}): Promise<Assignment[]> {
    return this.findManyInternal(userId, filters, false);
  }

  async findManyWithCourse(userId: string, filters: AssignmentFilters = {}): Promise<Assignment[]> {
    return this.findManyInternal(userId, filters, true);
  }

  private async findManyInternal(userId: string, filters: AssignmentFilters = {}, includeCourse: boolean = false): Promise<Assignment[]> {
    const where: any = { userId };

    // Apply filters
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.source) where.source = filters.source;

    // Date range filtering
    if (filters.from || filters.to) {
      where.dueAt = {};
      if (filters.from) where.dueAt.gte = filters.from;
      if (filters.to) where.dueAt.lte = filters.to;
    }

    return await this.db.assignment.findMany({
      where,
      orderBy: [
        { dueAt: "asc" },
        { createdAt: "desc" }
      ],
      ...(includeCourse && {
        include: {
          course: {
            select: { id: true, name: true, code: true, color: true }
          }
        }
      })
    });
  }

  async create(userId: string, input: CreateAssignmentDTO): Promise<Assignment> {
    return await this.db.assignment.create({
      data: {
        userId,
        courseId: input.courseId || null,
        title: input.title,
        description: input.description || null,
        type: input.type || "OTHER",
        dueAt: input.dueAt || null,
        estimatedHours: input.estimatedHours || null,
        priority: input.priority || 0,
        notes: input.notes || null,
        source: input.source || "manual",
        canvasId: input.canvasId || null,
        canvasUrl: input.canvasUrl || null,
      }
    });
  }

  async update(userId: string, id: string, input: UpdateAssignmentDTO): Promise<Assignment> {
    // Verify ownership first
    const existing = await this.findById(userId, id);
    if (!existing) {
      throw new Error("Assignment not found or access denied");
    }

    return await this.db.assignment.update({
      where: { id },
      data: {
        ...input,
        // Handle optional fields properly
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      }
    });
  }

  async delete(userId: string, id: string): Promise<{ success: true }> {
    const result = await this.db.assignment.deleteMany({
      where: { id, userId }
    });

    if (result.count === 0) {
      throw new Error("Assignment not found or access denied");
    }

    return { success: true };
  }

  // Canvas-specific methods
  async findByCanvasId(userId: string, canvasId: string): Promise<Assignment | null> {
    return await this.db.assignment.findUnique({
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

    for (const canvasAssignment of canvasData) {
      try {
        const existing = await this.findByCanvasId(userId, canvasAssignment.canvasId);
        
        if (existing) {
          await this.update(userId, existing.id, {
            title: canvasAssignment.title,
            description: canvasAssignment.description,
            dueAt: canvasAssignment.dueAt ? new Date(canvasAssignment.dueAt) : undefined,
            canvasUrl: canvasAssignment.canvasUrl,
          });
          updated++;
        } else {
          await this.create(userId, {
            ...canvasAssignment,
            dueAt: canvasAssignment.dueAt ? new Date(canvasAssignment.dueAt) : undefined,
            source: 'canvas'
          });
          created++;
        }
      } catch (error) {
        errors.push({
          canvasId: canvasAssignment.canvasId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { created, updated, errors };
  }

  // Additional assignment-specific queries
  async findOverdue(userId: string): Promise<Assignment[]> {
    const now = new Date();
    
    return await this.db.assignment.findMany({
      where: {
        userId,
        dueAt: { lt: now },
        status: "NOT_SUBMITTED"
      },
      orderBy: { dueAt: "desc" }
    });
  }

  async findUpcoming(userId: string, days: number = 14): Promise<Assignment[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return await this.db.assignment.findMany({
      where: {
        userId,
        dueAt: {
          gte: now,
          lte: futureDate
        },
        status: "NOT_SUBMITTED"
      },
      orderBy: { dueAt: "asc" }
    });
  }

  async countByStatus(userId: string): Promise<Record<string, number>> {
    const results = await this.db.assignment.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true }
    });

    return results.reduce((acc, result) => {
      acc[result.status] = result._count.status;
      return acc;
    }, {} as Record<string, number>);
  }

  async countByType(userId: string): Promise<Record<string, number>> {
    const results = await this.db.assignment.groupBy({
      by: ['type'],
      where: { userId },
      _count: { type: true }
    });

    return results.reduce((acc, result) => {
      acc[result.type] = result._count.type;
      return acc;
    }, {} as Record<string, number>);
  }

  async purgeAll(userId: string): Promise<{ deleted: number }> {
    const result = await this.db.assignment.deleteMany({
      where: { userId }
    });

    return { deleted: result.count };
  }
}
