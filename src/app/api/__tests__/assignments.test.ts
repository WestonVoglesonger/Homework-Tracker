import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testFactory } from '../../../test/factories';
import { createMockRequest, mockAuthenticatedSession, mockGetServerSession } from '../../../test/utils';
import { TestUser } from '../../../test/factories';
import { testDb } from '../../../test/db-setup';
import { getServiceContainer } from '../../../services/container/ServiceContainer';

// Test-specific route handlers that use test database
const createTestRouteHandlers = async () => {
  const testPrisma = testDb!;
  const assignmentService = getServiceContainer(testPrisma).getAssignmentService();

  // Re-implement the route logic with test database
  const GET = async (req: Request) => {
    const { getServerSession } = await import("next-auth");
    const { getAuth } = await import("../../../lib/auth");
    const { authOptions } = await getAuth();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const canvasId = searchParams.get("canvasId");

    if (canvasId) {
      const assignment = await assignmentService.getAssignmentByCanvasId(session.user.id, canvasId);
      if (assignment) {
        const dto = {
          id: assignment.id,
          courseId: assignment.courseId ?? undefined,
          title: assignment.title,
          description: assignment.description ?? undefined,
          type: assignment.type,
          dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : undefined,
          estimatedHours: assignment.estimatedHours ?? undefined,
          status: assignment.status,
          priority: assignment.priority,
          notes: assignment.notes ?? undefined,
          source: assignment.source ?? "manual",
          canvasId: assignment.canvasId ?? undefined,
          canvasUrl: assignment.canvasUrl ?? undefined,
          createdAt: assignment.createdAt.toISOString(),
          updatedAt: assignment.updatedAt.toISOString(),
        };
        return new Response(JSON.stringify([dto]), { status: 200 });
      } else {
        return new Response(JSON.stringify([]), { status: 200 });
      }
    }

    // Regular list query with filtering
    const filters: any = {};

    // Parse query parameters
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (status) {
      if (!['NOT_SUBMITTED', 'SUBMITTED', 'GRADED'].includes(status)) {
        return new Response(JSON.stringify({ error: "Invalid status parameter" }), { status: 400 });
      }
      filters.status = status as any;
    }

    if (from) {
      filters.from = new Date(from);
    }

    if (to) {
      filters.to = new Date(to);
    }

    const assignments = await assignmentService.listAssignments(session.user.id, filters);

    const dtos = assignments.map(a => ({
      id: a.id,
      courseId: a.courseId ?? undefined,
      title: a.title,
      description: a.description ?? undefined,
      type: a.type,
      dueAt: a.dueAt ? a.dueAt.toISOString() : undefined,
      estimatedHours: a.estimatedHours ?? undefined,
      status: a.status,
      priority: a.priority,
      notes: a.notes ?? undefined,
      source: a.source ?? "manual",
      canvasId: a.canvasId ?? undefined,
      canvasUrl: a.canvasUrl ?? undefined,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return new Response(JSON.stringify(dtos), { status: 200 });
  };

  const POST = async (req: Request) => {
    const { getServerSession } = await import("next-auth");
    const { getAuth } = await import("../../../lib/auth");
    const { createAssignmentSchema } = await import("../../../lib/validators");
    const { authOptions } = await getAuth();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    let json;
    try {
      json = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    // Validate input
    const parsed = createAssignmentSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400 });
    }

    try {
      const created = await assignmentService.createAssignment(session.user.id, {
        ...parsed.data,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
        source: (json as any)?.source === "canvas" ? "canvas" : "manual",
        canvasId: (json as any)?.canvasId ?? undefined,
        description: (json as any)?.description ?? undefined,
        canvasUrl: (json as any)?.canvasUrl ?? undefined,
      });

      const dto = {
        id: created.id,
        courseId: created.courseId ?? undefined,
        title: created.title,
        description: created.description ?? undefined,
        type: created.type,
        dueAt: created.dueAt ? created.dueAt.toISOString() : undefined,
        estimatedHours: created.estimatedHours ?? undefined,
        status: created.status,
        priority: created.priority,
        notes: created.notes ?? undefined,
        source: created.source ?? "manual",
        canvasId: created.canvasId ?? undefined,
        canvasUrl: created.canvasUrl ?? undefined,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };

      return new Response(JSON.stringify(dto), { status: 200 });
    } catch (error: any) {
      // Handle validation errors from the service
      if (error.message.includes('Missing required fields') ||
          error.message.includes('cannot be negative') ||
          error.message.includes('must be between')) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
      throw error;
    }
  };

  return { GET, POST };
};

// Mock the auth module
vi.mock('../../../lib/auth', () => ({
  getAuth: vi.fn(() => ({
    authOptions: {}
  }))
}));

// Mock next-auth getServerSession
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

describe('/api/assignments', () => {
  let testUser: TestUser;
  let testUser2: TestUser;
  let GET: any;
  let POST: any;

  beforeEach(async () => {
    testUser = await testFactory.createUser();
    testUser2 = await testFactory.createUser({ email: 'user2@example.com' });

    // Create test route handlers with test database
    const handlers = await createTestRouteHandlers();
    GET = handlers.GET;
    POST = handlers.POST;
  });

  describe('GET /api/assignments', () => {
    it('should require authentication', async () => {
      mockGetServerSession(null);
      const request = createMockRequest('GET', 'http://localhost:3000/api/assignments');

      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return user assignments', async () => {
      const course = await testFactory.createCourse(testUser.id);
      await testFactory.createAssignment(testUser.id, course.id, {
        title: 'Test Assignment 1'
      });
      await testFactory.createAssignment(testUser.id, course.id, {
        title: 'Test Assignment 2'
      });

      // Create assignment for different user (should not be returned)
      const otherCourse = await testFactory.createCourse(testUser2.id);
      await testFactory.createAssignment(testUser2.id, otherCourse.id, {
        title: 'Other User Assignment'
      });

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('GET', 'http://localhost:3000/api/assignments');

      const response = await GET(request);
      const assignments = await response.json();

      expect(response.status).toBe(200);
      expect(assignments).toHaveLength(2);
      expect(assignments.every((a: any) => a.title.startsWith('Test Assignment'))).toBe(true);
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

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('GET', 'http://localhost:3000/api/assignments?status=SUBMITTED');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const assignments = await response.json();
      expect(assignments).toHaveLength(1);
      expect(assignments[0].title).toBe('Submitted');
      expect(assignments[0].status).toBe('SUBMITTED');
    });

    it('should filter assignments by date range', async () => {
      const course = await testFactory.createCourse(testUser.id);
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      await testFactory.createAssignment(testUser.id, course.id, {
        title: 'Due Tomorrow',
        dueAt: tomorrow
      });
      await testFactory.createAssignment(testUser.id, course.id, {
        title: 'Due Next Week',
        dueAt: nextWeek
      });

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const fromDate = today.toISOString();
      const toDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest('GET', 
        `http://localhost:3000/api/assignments?from=${fromDate}&to=${toDate}`);

      const response = await GET(request);

      expect(response.status).toBe(200);
      const assignments = await response.json();
      expect(assignments).toHaveLength(1);
      expect(assignments[0].title).toBe('Due Tomorrow');
    });

    it('should find assignment by canvasId', async () => {
      const course = await testFactory.createCourse(testUser.id);
      await testFactory.createCanvasAssignment(testUser.id, course.id, '123');

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('GET',
        'http://localhost:3000/api/assignments?canvasId=123');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const assignments = await response.json();
      expect(assignments).toHaveLength(1);
      expect(assignments[0].canvasId).toBe('123');
    });

    it('should handle invalid query parameters', async () => {
      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('GET', 
        'http://localhost:3000/api/assignments?status=INVALID_STATUS');

      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid');
    });
  });

  describe('POST /api/assignments', () => {
    it('should require authentication', async () => {
      mockGetServerSession(null);
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', {
        title: 'Test Assignment'
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should create assignment successfully', async () => {
      const course = await testFactory.createCourse(testUser.id);
      const assignmentData = {
        courseId: course.id,
        title: 'New Test Assignment',
        type: 'HOMEWORK',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 2,
        priority: 1,
        notes: 'Test notes'
      };

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', 
        assignmentData);

      const response = await POST(request);

      expect(response.status).toBe(200);
      const assignment = await response.json();
      expect(assignment.title).toBe('New Test Assignment');
      expect(assignment.type).toBe('HOMEWORK');
      expect(assignment.courseId).toBe(course.id);
      expect(assignment.estimatedHours).toBe(2);
    });

    it('should validate required fields', async () => {
      const assignmentData = {
        // Missing required title field
        type: 'HOMEWORK'
      };

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', 
        assignmentData);

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Required'); // Zod validation message format
    });

    it('should handle Canvas assignments', async () => {
      const assignmentData = {
        title: 'Canvas Assignment',
        description: '<p>Canvas description</p>',
        source: 'canvas',
        canvasId: '456',
        canvasUrl: 'https://canvas.example.com/assignments/456'
      };

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', 
        assignmentData);

      const response = await POST(request);

      expect(response.status).toBe(200);
      const assignment = await response.json();
      expect(assignment.source).toBe('canvas');
      expect(assignment.canvasId).toBe('456'); // Canvas ID is stored as provided
      expect(assignment.canvasUrl).toBe('https://canvas.example.com/assignments/456');
    });

    it('should validate assignment type', async () => {
      const assignmentData = {
        title: 'Test Assignment',
        type: 'INVALID_TYPE'
      };

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', 
        assignmentData);

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid');
    });

    it('should handle assignments without course', async () => {
      const assignmentData = {
        title: 'General Task',
        type: 'OTHER'
      };

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', 
        assignmentData);

      const response = await POST(request);

      expect(response.status).toBe(200);
      const assignment = await response.json();
      expect(assignment.title).toBe('General Task');
      expect(assignment.courseId).toBeUndefined();
    });

    it('should handle invalid JSON', async () => {
      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = new Request('http://localhost:3000/api/assignments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid JSON');
    });

    it('should set default values', async () => {
      const assignmentData = {
        title: 'Minimal Assignment'
      };

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', 
        assignmentData);

      const response = await POST(request);

      expect(response.status).toBe(200);
      const assignment = await response.json();
      expect(assignment.type).toBe('HOMEWORK'); // Manual service defaults to HOMEWORK
      expect(assignment.priority).toBe(0);
      expect(assignment.source).toBe('manual');
    });

    it('should validate estimated hours are positive', async () => {
      const assignmentData = {
        title: 'Test Assignment',
        estimatedHours: -1
      };

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', 
        assignmentData);

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('greater than 0'); // Zod validation message format
    });

    it('should validate priority range', async () => {
      const assignmentData = {
        title: 'Test Assignment',
        priority: 5 // Should be 0-2
      };

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', 
        assignmentData);

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('max');
    });
  });
});
