import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../assignments/route';
import { testFactory } from '../../../test/factories';
import { createMockRequest, mockAuthenticatedSession, mockGetServerSession } from '../../../test/utils';
import { TestUser } from '../../../test/factories';

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

  beforeEach(async () => {
    testUser = await testFactory.createUser();
    testUser2 = await testFactory.createUser({ email: 'user2@example.com' });
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

      expect(response.status).toBe(200);
      const assignments = await response.json();
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
      await testFactory.createCanvasAssignment(testUser.id, course.id, 'canvas-123');

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('GET', 
        'http://localhost:3000/api/assignments?canvasId=canvas-123');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const assignments = await response.json();
      expect(assignments).toHaveLength(1);
      expect(assignments[0].canvasId).toBe('canvas-123');
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
      expect(data.error).toContain('Title is required');
    });

    it('should handle Canvas assignments', async () => {
      const assignmentData = {
        title: 'Canvas Assignment',
        description: '<p>Canvas description</p>',
        source: 'canvas',
        canvasId: 'canvas-456',
        canvasUrl: 'https://canvas.example.com/assignments/456'
      };

      mockGetServerSession(mockAuthenticatedSession(testUser));
      const request = createMockRequest('POST', 'http://localhost:3000/api/assignments', 
        assignmentData);

      const response = await POST(request);

      expect(response.status).toBe(200);
      const assignment = await response.json();
      expect(assignment.source).toBe('canvas');
      expect(assignment.canvasId).toBe('canvas-456');
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
      expect(assignment.type).toBe('OTHER');
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
      expect(data.error).toContain('positive');
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
