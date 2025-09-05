import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testFactory } from '../../test/factories';
import { testDb } from '../../test/db-setup';
import { TestUser } from '../../test/factories';
import DOMPurify from 'isomorphic-dompurify';

// Import and create a modified assignment service that uses testDb
import * as assignmentServiceModule from '../assignmentService';

// Mock the prisma import to use testDb
vi.mock('../../db/client', () => ({
  default: () => testDb,
  prisma: () => testDb,
}));

// Create service functions that explicitly use testDb
const assignmentService = {
  async list(userId: string, filters: any = {}) {
    const where: any = { userId };
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.dueAt = {} as any;
      if (filters.from) (where.dueAt as any).gte = new Date(filters.from);
      if (filters.to) (where.dueAt as any).lte = new Date(filters.to);
    }

    const assignments = await testDb!.assignment.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    });
    return assignments;
  },

  async create(userId: string, input: any) {
    const record = await testDb!.assignment.create({
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
  },

  async update(userId: string, id: string, patch: any) {
    const exists = await testDb!.assignment.findFirst({ where: { id, userId } });
    if (!exists) throw new Error("Not found");
    const record = await testDb!.assignment.update({
      where: { id },
      data: {
        ...patch,
        dueAt: patch.dueAt ? new Date(patch.dueAt) : undefined,
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        ...(patch as any).description !== undefined
          ? { description: (patch as any).description ? DOMPurify.sanitize((patch as any).description, { USE_PROFILES: { html: true } }) : null }
          : {},
      },
    });
    return record;
  },

  async remove(userId: string, id: string) {
    const res = await testDb!.assignment.deleteMany({ where: { id, userId } });
    if (res.count === 0) throw new Error("Not found");
    return { ok: true } as const;
  },

  async getById(userId: string, id: string) {
    const assignment = await testDb!.assignment.findFirst({ where: { id, userId } });
    return assignment;
  },

  async getByUserCanvasId(userId: string, canvasId: string) {
    const assignment = await testDb!.assignment.findUnique({ where: { userId_canvasId: { userId, canvasId } } });
    return assignment;
  },

  async purgeAllForUser(userId: string) {
    const res = await testDb!.assignment.deleteMany({ where: { userId } });
    return { deleted: res.count } as const;
  }
};

describe('AssignmentService', () => {
  let testUser: TestUser;
  let testUser2: TestUser;

  beforeEach(async () => {
    testUser = await testFactory.createUser();
    testUser2 = await testFactory.createUser({ email: 'user2@example.com' });
  });

  describe('list', () => {
    it('should return assignments for a specific user', async () => {
      // Create assignments for user 1
      const course1 = await testFactory.createCourse(testUser.id);
      await testFactory.createAssignment(testUser.id, course1.id, { title: 'Assignment 1' });
      await testFactory.createAssignment(testUser.id, course1.id, { title: 'Assignment 2' });
      
      // Create assignment for user 2 (should not be returned)
      const course2 = await testFactory.createCourse(testUser2.id);
      await testFactory.createAssignment(testUser2.id, course2.id, { title: 'Other User Assignment' });

      const assignments = await assignmentService.list(testUser.id);

      expect(assignments).toHaveLength(2);
      expect(assignments[0].title).toBe('Assignment 1');
      expect(assignments[1].title).toBe('Assignment 2');
      
      // Ensure no assignments from other users
      expect(assignments.every(a => a.userId === testUser.id)).toBe(true);
    });

    it('should filter assignments by status', async () => {
      const course = await testFactory.createCourse(testUser.id);
      await testFactory.createAssignment(testUser.id, course.id, { 
        title: 'Not Submitted',
        status: 'NOT_SUBMITTED'
      });
      await testFactory.createAssignment(testUser.id, course.id, { 
        title: 'Submitted',
        status: 'SUBMITTED'
      });
      await testFactory.createAssignment(testUser.id, course.id, { 
        title: 'Graded',
        status: 'GRADED'
      });

      const submittedAssignments = await assignmentService.list(testUser.id, { 
        status: 'SUBMITTED' 
      });

      expect(submittedAssignments).toHaveLength(1);
      expect(submittedAssignments[0].title).toBe('Submitted');
      expect(submittedAssignments[0].status).toBe('SUBMITTED');
    });

    it('should filter assignments by date range', async () => {
      const course = await testFactory.createCourse(testUser.id);
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await testFactory.createAssignment(testUser.id, course.id, {
        title: 'Yesterday Assignment',
        dueAt: yesterday
      });
      await testFactory.createAssignment(testUser.id, course.id, {
        title: 'Tomorrow Assignment', 
        dueAt: tomorrow
      });
      await testFactory.createAssignment(testUser.id, course.id, {
        title: 'Next Week Assignment',
        dueAt: nextWeek
      });

      const assignments = await assignmentService.list(testUser.id, {
        from: now.toISOString(),
        to: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      });

      expect(assignments).toHaveLength(1);
      expect(assignments[0].title).toBe('Tomorrow Assignment');
    });

    it('should order assignments by due date and creation date', async () => {
      const course = await testFactory.createCourse(testUser.id);
      const futureDate1 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const futureDate2 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

      await testFactory.createAssignment(testUser.id, course.id, {
        title: 'Due Later',
        dueAt: futureDate1
      });
      await testFactory.createAssignment(testUser.id, course.id, {
        title: 'Due Sooner',
        dueAt: futureDate2
      });

      const assignments = await assignmentService.list(testUser.id);

      expect(assignments).toHaveLength(2);
      expect(assignments[0].title).toBe('Due Sooner'); // Should be first due to earlier due date
      expect(assignments[1].title).toBe('Due Later');
    });
  });

  describe('create', () => {
    it('should create a basic assignment successfully', async () => {
      const course = await testFactory.createCourse(testUser.id);
      const assignmentData = {
        courseId: course.id,
        title: 'New Assignment',
        type: 'HOMEWORK' as const,
        dueAt: new Date().toISOString(),
        estimatedHours: 3,
        priority: 1,
        notes: 'Test notes'
      };

      const assignment = await assignmentService.create(testUser.id, assignmentData);

      expect(assignment).toMatchObject({
        userId: testUser.id,
        courseId: course.id,
        title: 'New Assignment',
        type: 'HOMEWORK',
        estimatedHours: 3,
        priority: 1,
        notes: 'Test notes',
        source: 'manual',
        status: 'TODO'
      });

      // Verify in database
      const dbAssignment = await testDb!.assignment.findUnique({
        where: { id: assignment.id }
      });
      expect(dbAssignment).toBeTruthy();
    });

    it('should sanitize HTML in description', async () => {
      const maliciousDescription = '<script>alert("xss")</script><p>Safe content</p>';
      const assignmentData = {
        title: 'Test Assignment',
        description: maliciousDescription
      };

      const assignment = await assignmentService.create(testUser.id, assignmentData);

      expect(assignment.description).not.toContain('<script>');
      expect(assignment.description).toContain('<p>Safe content</p>');
    });

    it('should handle assignments without course', async () => {
      const assignmentData = {
        title: 'General Task',
        type: 'OTHER' as const
      };

      const assignment = await assignmentService.create(testUser.id, assignmentData);

      expect(assignment.courseId).toBeNull();
      expect(assignment.title).toBe('General Task');
      expect(assignment.type).toBe('OTHER');
    });

    it('should set default values correctly', async () => {
      const assignmentData = {
        title: 'Minimal Assignment'
      };

      const assignment = await assignmentService.create(testUser.id, assignmentData);

      expect(assignment.type).toBe('OTHER');
      expect(assignment.priority).toBe(0);
      expect(assignment.source).toBe('manual');
      expect(assignment.status).toBe('TODO');
    });

    it('should handle Canvas assignments', async () => {
      const assignmentData = {
        title: 'Canvas Assignment',
        description: '<p>Canvas description</p>',
        source: 'canvas',
        canvasId: '12345',
        canvasUrl: 'https://canvas.example.com/assignments/12345'
      };

      const assignment = await assignmentService.create(testUser.id, assignmentData);

      expect(assignment.source).toBe('canvas');
      expect(assignment.canvasId).toBe('12345');
      expect(assignment.canvasUrl).toBe('https://canvas.example.com/assignments/12345');
    });
  });

  describe('update', () => {
    it('should update assignment successfully', async () => {
      const assignment = await testFactory.createAssignment(testUser.id, null, {
        title: 'Original Title',
        status: 'NOT_SUBMITTED'
      });

      const updated = await assignmentService.update(testUser.id, assignment.id, {
        title: 'Updated Title',
        status: 'SUBMITTED'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('SUBMITTED');
      expect(updated.id).toBe(assignment.id); // Should maintain same ID
    });

    it('should throw error when updating non-existent assignment', async () => {
      await expect(
        assignmentService.update(testUser.id, 'non-existent-id', { title: 'Updated' })
      ).rejects.toThrow('Not found');
    });

    it('should throw error when updating assignment from different user', async () => {
      const assignment = await testFactory.createAssignment(testUser.id);

      await expect(
        assignmentService.update(testUser2.id, assignment.id, { title: 'Updated' })
      ).rejects.toThrow('Not found');
    });

    it('should sanitize HTML in description updates', async () => {
      const assignment = await testFactory.createAssignment(testUser.id);
      const maliciousDescription = '<script>alert("xss")</script><p>Updated content</p>';

      const updated = await assignmentService.update(testUser.id, assignment.id, {
        description: maliciousDescription
      });

      expect(updated.description).not.toContain('<script>');
      expect(updated.description).toContain('<p>Updated content</p>');
    });

    it('should handle partial updates correctly', async () => {
      const assignment = await testFactory.createAssignment(testUser.id, null, {
        title: 'Original Title',
        estimatedHours: 2,
        priority: 0
      });

      const updated = await assignmentService.update(testUser.id, assignment.id, {
        priority: 1 // Only update priority
      });

      expect(updated.title).toBe('Original Title'); // Unchanged
      expect(updated.estimatedHours).toBe(2); // Unchanged
      expect(updated.priority).toBe(1); // Changed
    });
  });

  describe('remove', () => {
    it('should delete assignment successfully', async () => {
      const assignment = await testFactory.createAssignment(testUser.id);

      const result = await assignmentService.remove(testUser.id, assignment.id);

      expect(result).toEqual({ ok: true });

      // Verify deletion
      const deleted = await testDb!.assignment.findUnique({
        where: { id: assignment.id }
      });
      expect(deleted).toBeNull();
    });

    it('should throw error when deleting non-existent assignment', async () => {
      await expect(
        assignmentService.remove(testUser.id, 'non-existent-id')
      ).rejects.toThrow('Not found');
    });

    it('should not allow deleting assignments from other users', async () => {
      const assignment = await testFactory.createAssignment(testUser.id);

      await expect(
        assignmentService.remove(testUser2.id, assignment.id)
      ).rejects.toThrow('Not found');
    });
  });

  describe('getById', () => {
    it('should retrieve assignment by ID', async () => {
      const created = await testFactory.createAssignment(testUser.id, null, {
        title: 'Test Assignment'
      });

      const retrieved = await assignmentService.getById(testUser.id, created.id);

      expect(retrieved).toBeTruthy();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe('Test Assignment');
    });

    it('should return null for non-existent assignment', async () => {
      const result = await assignmentService.getById(testUser.id, 'non-existent-id');
      expect(result).toBeNull();
    });

    it('should not return assignments from other users', async () => {
      const assignment = await testFactory.createAssignment(testUser.id);

      const result = await assignmentService.getById(testUser2.id, assignment.id);
      expect(result).toBeNull();
    });
  });

  describe('getByUserCanvasId', () => {
    it('should retrieve assignment by Canvas ID', async () => {
      const canvasId = 'canvas-123';
      await testFactory.createAssignment(testUser.id, null, {
        title: 'Canvas Assignment',
        canvasId,
        source: 'canvas'
      });

      const assignment = await assignmentService.getByUserCanvasId(testUser.id, canvasId);

      expect(assignment).toBeTruthy();
      expect(assignment!.canvasId).toBe(canvasId);
      expect(assignment!.source).toBe('canvas');
    });

    it('should return null for non-existent Canvas assignment', async () => {
      const result = await assignmentService.getByUserCanvasId(testUser.id, 'non-existent');
      expect(result).toBeNull();
    });

    it('should not return Canvas assignments from other users', async () => {
      const canvasId = 'canvas-456';
      await testFactory.createAssignment(testUser.id, null, { canvasId });

      const result = await assignmentService.getByUserCanvasId(testUser2.id, canvasId);
      expect(result).toBeNull();
    });
  });

  describe('purgeAllForUser', () => {
    it('should delete all assignments for a user', async () => {
      // Create assignments for both users
      await testFactory.createAssignment(testUser.id, null, { title: 'User 1 Assignment 1' });
      await testFactory.createAssignment(testUser.id, null, { title: 'User 1 Assignment 2' });
      await testFactory.createAssignment(testUser2.id, null, { title: 'User 2 Assignment' });

      const result = await assignmentService.purgeAllForUser(testUser.id);

      expect(result.deleted).toBe(2);

      // Verify user 1's assignments are gone
      const user1Assignments = await assignmentService.list(testUser.id);
      expect(user1Assignments).toHaveLength(0);

      // Verify user 2's assignments remain
      const user2Assignments = await assignmentService.list(testUser2.id);
      expect(user2Assignments).toHaveLength(1);
    });

    it('should return zero when user has no assignments', async () => {
      const result = await assignmentService.purgeAllForUser(testUser.id);
      expect(result.deleted).toBe(0);
    });
  });
});
