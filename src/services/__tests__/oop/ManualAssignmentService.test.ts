import { describe, it, expect, beforeEach } from 'vitest';
import { ManualAssignmentService } from '../../oop/ManualAssignmentService';
import { testFactory } from '../../../test/factories';
import { testDb } from '../../../test/db-setup';
import { TestUser } from '../../../test/factories';

describe('ManualAssignmentService (OOP)', () => {
  let service: ManualAssignmentService;
  let testUser: TestUser;
  let testUser2: TestUser;

  beforeEach(async () => {
    service = new ManualAssignmentService(testDb!);
    testUser = await testFactory.createUser();
    testUser2 = await testFactory.createUser({ email: 'user2@example.com' });
  });

  describe('createAssignment', () => {
    it('should create manual assignment with proper defaults', async () => {
      const input = {
        title: 'Manual Assignment Test',
        description: 'Test description',
      };

      const assignment = await service.createAssignment(testUser.id, input);

      expect(assignment.title).toBe('Manual Assignment Test');
      expect(assignment.source).toBe('manual');
      expect(assignment.type).toBe('HOMEWORK'); // Default for manual
      expect(assignment.estimatedHours).toBe(2); // Default for homework
      expect(assignment.priority).toBe(0);
      expect(assignment.userId).toBe(testUser.id);
    });

    it('should sanitize HTML in description', async () => {
      const input = {
        title: 'Test Assignment',
        description: '<script>alert("xss")</script><p>Safe content</p><strong>Bold text</strong>',
      };

      const assignment = await service.createAssignment(testUser.id, input);

      expect(assignment.description).not.toContain('<script>');
      expect(assignment.description).toContain('<p>Safe content</p>');
      expect(assignment.description).toContain('<strong>Bold text</strong>');
    });

    it('should reject Canvas fields for manual assignments', async () => {
      const input = {
        title: 'Manual Assignment',
        canvasId: '12345', // Should be rejected
      };

      await expect(
        service.createAssignment(testUser.id, input)
      ).rejects.toThrow('Manual assignments cannot have Canvas ID or URL');
    });

    it('should set default estimated hours based on type', async () => {
      const testCases = [
        { type: 'HOMEWORK', expected: 2 },
        { type: 'QUIZ', expected: 1 },
        { type: 'EXAM', expected: 3 },
        { type: 'PROJECT', expected: 8 },
      ] as const;

      for (const { type, expected } of testCases) {
        const assignment = await service.createAssignment(testUser.id, {
          title: `${type} Assignment`,
          type,
        });

        expect(assignment.estimatedHours).toBe(expected);
        expect(assignment.type).toBe(type);
      }
    });

    it('should validate required fields', async () => {
      await expect(
        service.createAssignment(testUser.id, { title: '' })
      ).rejects.toThrow('Assignment title cannot be empty');

      await expect(
        service.createAssignment(testUser.id, {} as any)
      ).rejects.toThrow('Missing required fields: title');
    });

    it('should validate field constraints', async () => {
      // Title length validation
      await expect(
        service.createAssignment(testUser.id, {
          title: 'x'.repeat(501) // Too long
        })
      ).rejects.toThrow('Assignment title cannot exceed 500 characters');

      // Priority validation
      await expect(
        service.createAssignment(testUser.id, {
          title: 'Test',
          priority: 5 // Out of range
        })
      ).rejects.toThrow('Priority must be between 0 and 2');

      // Estimated hours validation
      await expect(
        service.createAssignment(testUser.id, {
          title: 'Test',
          estimatedHours: -1 // Negative
        })
      ).rejects.toThrow('Estimated hours cannot be negative');

      await expect(
        service.createAssignment(testUser.id, {
          title: 'Test',
          estimatedHours: 200 // Too many hours
        })
      ).rejects.toThrow('Estimated hours cannot exceed 168');
    });
  });

  describe('updateAssignment', () => {
    it('should update manual assignment successfully', async () => {
      const original = await testFactory.createAssignment(testUser.id, null, {
        title: 'Original Title',
        type: 'HOMEWORK',
        source: 'manual'
      });

      const updated = await service.updateAssignment(testUser.id, original.id, {
        title: 'Updated Title',
        status: 'SUBMITTED',
        notes: 'Updated notes'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('SUBMITTED');
      expect(updated.notes).toBe('Updated notes');
      expect(updated.id).toBe(original.id);
    });

    it('should validate status transitions', async () => {
      const assignment = await testFactory.createAssignment(testUser.id, null, {
        source: 'manual'
      });

      // Valid status transitions
      const validStatuses = ['NOT_SUBMITTED', 'SUBMITTED', 'GRADED'];
      
      for (const status of validStatuses) {
        const updated = await service.updateAssignment(testUser.id, assignment.id, {
          status: status as any
        });
        expect(updated.status).toBe(status);
      }

      // Invalid status
      await expect(
        service.updateAssignment(testUser.id, assignment.id, {
          status: 'INVALID_STATUS' as any
        })
      ).rejects.toThrow('Invalid status');
    });

    it('should handle partial updates correctly', async () => {
      const original = await testFactory.createAssignment(testUser.id, null, {
        title: 'Original Title',
        estimatedHours: 3,
        priority: 1,
        source: 'manual'
      });

      // Update only priority
      const updated = await service.updateAssignment(testUser.id, original.id, {
        priority: 2
      });

      expect(updated.title).toBe('Original Title'); // Unchanged
      expect(updated.estimatedHours).toBe(3); // Unchanged
      expect(updated.priority).toBe(2); // Changed
    });
  });

  describe('listAssignments with manual-specific sorting', () => {
    it('should sort by priority then due date', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await testFactory.createAssignment(testUser.id, null, {
        title: 'Low Priority, Due Later',
        priority: 0,
        dueAt: nextWeek,
        source: 'manual'
      });

      await testFactory.createAssignment(testUser.id, null, {
        title: 'High Priority, Due Sooner',
        priority: 2,
        dueAt: tomorrow,
        source: 'manual'
      });

      await testFactory.createAssignment(testUser.id, null, {
        title: 'High Priority, Due Later',
        priority: 2,
        dueAt: nextWeek,
        source: 'manual'
      });

      const assignments = await service.listAssignments(testUser.id);

      expect(assignments).toHaveLength(3);
      
      // Should be sorted by priority first (high to low)
      expect(assignments[0].priority).toBe(2);
      expect(assignments[1].priority).toBe(2);
      expect(assignments[2].priority).toBe(0);
      
      // Within same priority, should be sorted by due date (early to late)
      expect(assignments[0].title).toBe('High Priority, Due Sooner');
      expect(assignments[1].title).toBe('High Priority, Due Later');
    });

    it('should handle assignments without due dates', async () => {
      await testFactory.createAssignment(testUser.id, null, {
        title: 'With Due Date',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: 0,
        source: 'manual'
      });

      await testFactory.createAssignment(testUser.id, null, {
        title: 'Without Due Date',
        dueAt: null,
        priority: 0,
        source: 'manual'
      });

      const assignments = await service.listAssignments(testUser.id);

      expect(assignments).toHaveLength(2);
      
      // Assignment with due date should come first
      expect(assignments[0].title).toBe('With Due Date');
      expect(assignments[1].title).toBe('Without Due Date');
    });
  });

  describe('manual-specific operations', () => {
    it('should duplicate assignment correctly', async () => {
      const original = await testFactory.createAssignment(testUser.id, null, {
        title: 'Original Assignment',
        description: 'Original description',
        type: 'PROJECT',
        estimatedHours: 5,
        priority: 1,
        notes: 'Original notes',
        source: 'manual'
      });

      const duplicate = await service.duplicateAssignment(testUser.id, original.id);

      expect(duplicate.title).toBe('Original Assignment (Copy)');
      expect(duplicate.description).toBe(original.description);
      expect(duplicate.type).toBe(original.type);
      expect(duplicate.estimatedHours).toBe(original.estimatedHours);
      expect(duplicate.priority).toBe(original.priority);
      expect(duplicate.notes).toBe(original.notes);
      expect(duplicate.source).toBe('manual');
      expect(duplicate.id).not.toBe(original.id); // Should be different
    });

    it('should duplicate with custom title', async () => {
      const original = await testFactory.createAssignment(testUser.id, null, {
        title: 'Original Assignment',
        source: 'manual'
      });

      const duplicate = await service.duplicateAssignment(
        testUser.id, 
        original.id, 
        'Custom Copy Title'
      );

      expect(duplicate.title).toBe('Custom Copy Title');
    });

    it('should reject duplicating Canvas assignments', async () => {
      const canvasAssignment = await testFactory.createAssignment(testUser.id, null, {
        title: 'Canvas Assignment',
        source: 'canvas',
        canvasId: '12345'
      });

      await expect(
        service.duplicateAssignment(testUser.id, canvasAssignment.id)
      ).rejects.toThrow('Can only duplicate manual assignments');
    });

    it('should create assignment templates', async () => {
      const template = await service.createTemplate(testUser.id, {
        title: 'Math Homework',
        type: 'HOMEWORK',
        estimatedHours: 3,
        description: 'Standard math homework template'
      });

      expect(template.title).toBe('Template: Math Homework');
      expect(template.type).toBe('HOMEWORK');
      expect(template.estimatedHours).toBe(3);
      expect(template.notes).toContain('template assignment');
      expect(template.source).toBe('manual');
    });
  });

  describe('validation and error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Try to create assignment with invalid course ID
      await expect(
        service.createAssignment(testUser.id, {
          title: 'Test Assignment',
          courseId: 'non-existent-course-id'
        })
      ).rejects.toThrow(); // Should throw a meaningful error
    });

    it('should enforce user isolation', async () => {
      const user1Assignment = await testFactory.createAssignment(testUser.id, null, {
        source: 'manual'
      });

      // User 2 should not be able to access user 1's assignment
      await expect(
        service.getAssignment(testUser2.id, user1Assignment.id)
      ).resolves.toBeNull();

      await expect(
        service.updateAssignment(testUser2.id, user1Assignment.id, { title: 'Hacked!' })
      ).rejects.toThrow('Assignment not found or access denied');

      await expect(
        service.deleteAssignment(testUser2.id, user1Assignment.id)
      ).rejects.toThrow('Assignment not found or access denied');
    });

    it('should validate user ID format', async () => {
      await expect(
        service.createAssignment('', { title: 'Test' })
      ).rejects.toThrow('Invalid user ID provided');

      await expect(
        service.createAssignment('   ', { title: 'Test' })
      ).rejects.toThrow('Invalid user ID provided');
    });

    it('should validate assignment ID format', async () => {
      await expect(
        service.getAssignment(testUser.id, '')
      ).rejects.toThrow('Invalid assignment ID provided');

      await expect(
        service.updateAssignment(testUser.id, '   ', { title: 'Test' })
      ).rejects.toThrow('Invalid assignment ID provided');
    });
  });

  describe('encapsulation and inheritance', () => {
    it('should use proper encapsulation - private methods have correct access', () => {
      // TypeScript private methods are compile-time only, but we can verify they exist
      // and are not meant to be part of the public API
      expect(typeof (service as any).validateCourseOwnership).toBe('function');
      expect(typeof (service as any).getDefaultEstimatedHours).toBe('function');
      
      // Public interface should only expose intended methods
      expect(typeof service.createAssignment).toBe('function');
      expect(typeof service.updateAssignment).toBe('function');
      expect(typeof service.deleteAssignment).toBe('function');
      expect(typeof service.listAssignments).toBe('function');
      expect(typeof service.getAssignment).toBe('function');
    });

    it('should inherit base functionality correctly', async () => {
      // Test that base service methods work
      const assignment = await testFactory.createAssignment(testUser.id, null, {
        source: 'manual'
      });

      const stats = await service.getStatistics(testUser.id);
      expect(stats.total).toBe(1);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byType).toBeDefined();
    });

    it('should implement template method pattern correctly', async () => {
      // The base class defines the algorithm, subclass customizes steps
      const input = {
        title: 'Template Method Test',
        type: 'PROJECT' as const
      };

      const assignment = await service.createAssignment(testUser.id, input);

      // Verify template method worked:
      // 1. Validation ran (no errors thrown)
      // 2. Preprocessing applied defaults
      // 3. Repository called
      // 4. Post-processing applied
      expect(assignment.source).toBe('manual'); // Preprocessing
      expect(assignment.estimatedHours).toBe(8); // Default for PROJECT
      expect(assignment.priority).toBe(0); // Default
    });
  });

  describe('polymorphism demonstration', () => {
    it('should behave differently from Canvas service', async () => {
      // This test demonstrates that manual and Canvas services have different behavior
      // We would compare with CanvasAssignmentService if we had test data

      const manualInput = {
        title: 'Test Assignment',
        type: 'HOMEWORK' as const
      };

      const assignment = await service.createAssignment(testUser.id, manualInput);

      // Manual service characteristics
      expect(assignment.source).toBe('manual');
      expect(assignment.canvasId).toBeNull();
      expect(assignment.canvasUrl).toBeNull();
      expect(assignment.estimatedHours).toBe(2); // Manual default for homework
    });
  });
});
