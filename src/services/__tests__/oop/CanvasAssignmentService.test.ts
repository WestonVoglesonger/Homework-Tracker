import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasAssignmentService } from '../../oop/CanvasAssignmentService';
import { testFactory } from '../../../test/factories';
import { testDb } from '../../../test/db-setup';
import { TestUser } from '../../../test/factories';

describe('CanvasAssignmentService (OOP)', () => {
  let service: CanvasAssignmentService;
  let testUser: TestUser;

  beforeEach(async () => {
    service = new CanvasAssignmentService(testDb!);
    testUser = await testFactory.createUser();
  });

  describe('createAssignment', () => {
    it('should create Canvas assignment with proper validation', async () => {
      const input = {
        title: 'Canvas Assignment Test',
        description: '<p>Canvas <em>HTML</em> description</p>',
        canvasId: '12345',
        canvasUrl: 'https://canvas.instructure.com/assignments/12345'
      };

      const assignment = await service.createAssignment(testUser.id, input);

      expect(assignment.title).toBe('Canvas Assignment Test');
      expect(assignment.source).toBe('canvas');
      expect(assignment.canvasId).toBe('12345');
      expect(assignment.canvasUrl).toBe('https://canvas.instructure.com/assignments/12345');
      expect(assignment.description).toContain('<p>Canvas <em>HTML</em> description</p>');
    });

    it('should require Canvas ID for Canvas assignments', async () => {
      const input = {
        title: 'Canvas Assignment',
        // Missing canvasId
      };

      await expect(
        service.createAssignment(testUser.id, input)
      ).rejects.toThrow('Canvas assignments must have a Canvas ID');
    });

    it('should validate Canvas ID format', async () => {
      await expect(
        service.createAssignment(testUser.id, {
          title: 'Test',
          canvasId: 'invalid-id' // Should be numeric
        })
      ).rejects.toThrow('Canvas ID must be numeric');

      await expect(
        service.createAssignment(testUser.id, {
          title: 'Test',
          canvasId: '12345abc' // Should be numeric
        })
      ).rejects.toThrow('Canvas ID must be numeric');
    });

    it('should prevent duplicate Canvas IDs', async () => {
      const canvasId = '12345';
      
      // Create first Canvas assignment
      await service.createAssignment(testUser.id, {
        title: 'First Canvas Assignment',
        canvasId
      });

      // Try to create duplicate - should fail due to database constraint
      await expect(
        service.createAssignment(testUser.id, {
          title: 'Second Canvas Assignment',
          canvasId // Same Canvas ID
        })
      ).rejects.toThrow(); // Unique constraint error from database
    });

    it('should infer assignment type from Canvas data', async () => {
      const testCases = [
        { title: 'Math Quiz 1', expectedType: 'QUIZ' },
        { title: 'Final Exam', expectedType: 'EXAM' },
        { title: 'Homework Assignment 3', expectedType: 'HOMEWORK' },
        { title: 'Project Proposal', expectedType: 'PROJECT' },
        { title: 'Discussion Post', expectedType: 'OTHER' },
      ];

      for (const { title, expectedType } of testCases) {
        const assignment = await service.createAssignment(testUser.id, {
          title,
          canvasId: `${Math.floor(Math.random() * 100000)}`
        });

        expect(assignment.type).toBe(expectedType);
      }
    });

    it('should estimate hours from Canvas content', async () => {
      const shortAssignment = await service.createAssignment(testUser.id, {
        title: 'Short Quiz',
        description: '<p>Quick quiz</p>',
        canvasId: '11111'
      });

      const longProject = await service.createAssignment(testUser.id, {
        title: 'Complex Research Project',
        description: '<p>This is a complex research project that requires extensive analysis and presentation of findings</p>'.repeat(5),
        canvasId: '22222'
      });

      expect(shortAssignment.estimatedHours).toBeLessThan(longProject.estimatedHours);
      expect(longProject.estimatedHours).toBeGreaterThan(2); // Should be higher due to length and keywords
    });

    it('should validate Canvas URL format', async () => {
      // Valid HTTPS Canvas URL
      await expect(
        service.createAssignment(testUser.id, {
          title: 'Test',
          canvasId: '12345',
          canvasUrl: 'https://canvas.instructure.com/assignments/12345'
        })
      ).resolves.toBeDefined();

      // Invalid HTTP URL 
      await expect(
        service.createAssignment(testUser.id, {
          title: 'Test',
          canvasId: '12346',
          canvasUrl: 'http://insecure-canvas.com/assignments/12346'
        })
      ).rejects.toThrow('Invalid Canvas URL format');

      // Invalid URL format
      await expect(
        service.createAssignment(testUser.id, {
          title: 'Test',
          canvasId: '12347',
          canvasUrl: 'not-a-url'
        })
      ).rejects.toThrow('Invalid Canvas URL format');
    });
  });

  describe('Canvas-specific operations', () => {
    it('should find assignment by Canvas ID', async () => {
      const canvasId = '67890';
      const created = await testFactory.createAssignment(testUser.id, null, {
        title: 'Canvas Assignment',
        canvasId,
        source: 'canvas'
      });

      const found = await service.getAssignmentByCanvasId(testUser.id, canvasId);

      expect(found).toBeTruthy();
      expect(found!.id).toBe(created.id);
      expect(found!.canvasId).toBe(canvasId);
    });

    it('should refresh assignment from Canvas data', async () => {
      const assignment = await testFactory.createAssignment(testUser.id, null, {
        title: 'Old Canvas Title',
        description: '<p>Old description</p>',
        canvasId: '99999',
        source: 'canvas'
      });

      const newCanvasData = {
        id: 99999,
        name: 'Updated Canvas Title',
        description: '<p>Updated Canvas description</p>',
        due_at: '2024-12-31T23:59:59Z',
        html_url: 'https://canvas.example.com/assignments/99999'
      };

      const refreshed = await service.refreshFromCanvas(testUser.id, assignment.id, newCanvasData);

      expect(refreshed.title).toBe('Updated Canvas Title');
      expect(refreshed.description).toContain('Updated Canvas description');
      expect(refreshed.canvasUrl).toBe('https://canvas.example.com/assignments/99999');
    });

    it('should reject refreshing manual assignments', async () => {
      const manualAssignment = await testFactory.createAssignment(testUser.id, null, {
        source: 'manual'
      });

      await expect(
        service.refreshFromCanvas(testUser.id, manualAssignment.id, {})
      ).rejects.toThrow('Cannot refresh non-Canvas assignment');
    });

    it('should unlink assignment from Canvas', async () => {
      const canvasAssignment = await testFactory.createAssignment(testUser.id, null, {
        title: 'Canvas Assignment',
        canvasId: '55555',
        canvasUrl: 'https://canvas.example.com/assignments/55555',
        source: 'canvas',
        notes: 'Original notes'
      });

      const unlinked = await service.unlinkFromCanvas(testUser.id, canvasAssignment.id);

      expect(unlinked.canvasUrl).toBeNull(); // Should be null, not undefined
      expect(unlinked.notes).toContain('[Unlinked from Canvas]');
      expect(unlinked.canvasId).toBe('55555'); // Should keep Canvas ID for reference
    });

    it('should reject unlinking non-Canvas assignments', async () => {
      const manualAssignment = await testFactory.createAssignment(testUser.id, null, {
        source: 'manual'
      });

      await expect(
        service.unlinkFromCanvas(testUser.id, manualAssignment.id)
      ).rejects.toThrow('Assignment is not linked to Canvas');
    });
  });

  describe('Canvas sync operations', () => {
    it('should sync multiple Canvas assignments', async () => {
      const canvasAssignments = [
        {
          id: 101,
          name: 'Canvas Assignment 1',
          description: '<p>First assignment</p>',
          due_at: '2024-12-25T23:59:59Z',
          html_url: 'https://canvas.example.com/assignments/101'
        },
        {
          id: 102,
          name: 'Canvas Assignment 2',
          description: '<p>Second assignment</p>',
          due_at: '2024-12-30T23:59:59Z',
          html_url: 'https://canvas.example.com/assignments/102'
        }
      ];

      const result = await service.syncFromCanvas(testUser.id, canvasAssignments);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify assignments were created
      const assignments = await service.listAssignments(testUser.id, { source: 'canvas' });
      expect(assignments).toHaveLength(2);
    });

    it('should handle sync errors gracefully', async () => {
      const canvasAssignments = [
        {
          id: 201,
          name: 'Valid Assignment',
          description: '<p>Valid</p>',
        },
        {
          id: 202,
          // Missing required name field
          description: '<p>Invalid</p>',
        }
      ];

      const result = await service.syncFromCanvas(testUser.id, canvasAssignments);

      expect(result.created).toBe(1); // Only valid one created
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].canvasId).toBe('202');
    });

    it('should update existing assignments during sync', async () => {
      // Create existing Canvas assignment
      const existing = await testFactory.createAssignment(testUser.id, null, {
        title: 'Old Title',
        canvasId: '33333',
        source: 'canvas'
      });

      const canvasData = [{
        id: 33333,
        name: 'Updated Title from Canvas',
        description: '<p>Updated from sync</p>',
        due_at: '2024-12-28T23:59:59Z',
      }];

      const result = await service.syncFromCanvas(testUser.id, canvasData);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);

      // Verify update
      const updated = await service.getAssignment(testUser.id, existing.id);
      expect(updated!.title).toBe('Updated Title from Canvas');
    });
  });

  describe('Canvas assignment sorting and processing', () => {
    it('should sort Canvas assignments by due date and Canvas ID', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await testFactory.createAssignment(testUser.id, null, {
        title: 'Assignment B',
        canvasId: '2000',
        dueAt: nextWeek,
        source: 'canvas'
      });

      await testFactory.createAssignment(testUser.id, null, {
        title: 'Assignment A',
        canvasId: '1000',
        dueAt: tomorrow,
        source: 'canvas'
      });

      await testFactory.createAssignment(testUser.id, null, {
        title: 'Assignment C',
        canvasId: '3000',
        dueAt: null, // No due date
        source: 'canvas'
      });

      const assignments = await service.listAssignments(testUser.id);

      // Should be sorted: due date first, then by Canvas ID
      expect(assignments[0].title).toBe('Assignment A'); // Tomorrow
      expect(assignments[1].title).toBe('Assignment B'); // Next week  
      expect(assignments[2].title).toBe('Assignment C'); // No due date
    });
  });
});
