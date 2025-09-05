import { describe, it, expect, beforeEach } from 'vitest';
import { assignmentService } from '../../../services/assignmentService';
import { courseService } from '../../../services/courseService';
import { testFactory } from '../../factories';
import { testDb } from '../../db-setup';
import { TestUser } from '../../factories';

describe('Assignment Workflow Integration', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await testFactory.createUser();
  });

  it('should handle complete assignment lifecycle', async () => {
    // 1. Create a course
    const course = await courseService.create(testUser.id, {
      name: 'Integration Test Course',
      code: 'INTEG101',
      term: 'Fall 2024'
    });

    expect(course.name).toBe('Integration Test Course');

    // 2. Create an assignment in that course
    const assignment = await assignmentService.create(testUser.id, {
      courseId: course.id,
      title: 'Integration Test Assignment',
      type: 'HOMEWORK',
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      estimatedHours: 3,
      priority: 1,
      notes: 'This is an integration test'
    });

    expect(assignment.title).toBe('Integration Test Assignment');
    expect(assignment.courseId).toBe(course.id);
    expect(assignment.status).toBe('TODO');

    // 3. Update assignment status to submitted
    const updated = await assignmentService.update(testUser.id, assignment.id, {
      status: 'SUBMITTED',
      notes: 'Submitted on time!'
    });

    expect(updated.status).toBe('SUBMITTED');
    expect(updated.notes).toBe('Submitted on time!');

    // 4. Verify the assignment appears in filtered lists
    const submittedAssignments = await assignmentService.list(testUser.id, {
      status: 'SUBMITTED'
    });

    expect(submittedAssignments).toHaveLength(1);
    expect(submittedAssignments[0].id).toBe(assignment.id);

    // 5. Update to graded status
    const graded = await assignmentService.update(testUser.id, assignment.id, {
      status: 'GRADED'
    });

    expect(graded.status).toBe('GRADED');

    // 6. Verify submitted filter no longer returns this assignment
    const stillSubmitted = await assignmentService.list(testUser.id, {
      status: 'SUBMITTED'
    });
    expect(stillSubmitted).toHaveLength(0);

    // 7. Verify it appears in graded filter
    const gradedAssignments = await assignmentService.list(testUser.id, {
      status: 'GRADED'
    });
    expect(gradedAssignments).toHaveLength(1);
    expect(gradedAssignments[0].id).toBe(assignment.id);

    // 8. Clean up by deleting assignment
    await assignmentService.remove(testUser.id, assignment.id);

    // 9. Verify it's gone
    const deletedAssignment = await assignmentService.getById(testUser.id, assignment.id);
    expect(deletedAssignment).toBeNull();

    // 10. Course should still exist
    const courseStillExists = await courseService.getById(testUser.id, course.id);
    expect(courseStillExists).toBeTruthy();
  });

  it('should handle Canvas import workflow', async () => {
    // 1. Create a course from Canvas data
    const canvasCourse = await courseService.create(testUser.id, {
      name: 'Canvas Imported Course',
      code: 'CANVAS101',
      term: 'Fall 2024',
      source: 'canvas',
      canvasId: 'canvas-course-123'
    });

    // 2. Create Canvas assignment
    const canvasAssignment = await assignmentService.create(testUser.id, {
      courseId: canvasCourse.id,
      title: 'Canvas Assignment 1',
      description: '<p>This is a Canvas assignment with HTML</p>',
      type: 'HOMEWORK',
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'canvas',
      canvasId: 'canvas-assignment-456',
      canvasUrl: 'https://canvas.example.com/assignments/456'
    });

    expect(canvasAssignment.source).toBe('canvas');
    expect(canvasAssignment.canvasId).toBe('canvas-assignment-456');

    // 3. Try to find by Canvas ID
    const foundByCanvasId = await assignmentService.getByUserCanvasId(
      testUser.id, 
      'canvas-assignment-456'
    );

    expect(foundByCanvasId).toBeTruthy();
    expect(foundByCanvasId!.id).toBe(canvasAssignment.id);

    // 4. Simulate Canvas sync update
    const syncUpdated = await assignmentService.update(testUser.id, canvasAssignment.id, {
      description: '<p>Updated Canvas assignment description</p>',
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Extended deadline
    });

    expect(syncUpdated.description).toContain('Updated Canvas assignment');

    // 5. Verify original course/assignment relationship is maintained
    const allAssignments = await assignmentService.list(testUser.id);
    const courseAssignments = allAssignments.filter(a => a.courseId === canvasCourse.id);
    expect(courseAssignments).toHaveLength(1);
    expect(courseAssignments[0].id).toBe(canvasAssignment.id);
  });

  it('should enforce user isolation across operations', async () => {
    const user1 = await testFactory.createUser({ email: 'user1@example.com' });
    const user2 = await testFactory.createUser({ email: 'user2@example.com' });

    // 1. Create course and assignment for user1
    const user1Course = await courseService.create(user1.id, {
      name: 'User 1 Course'
    });

    const user1Assignment = await assignmentService.create(user1.id, {
      courseId: user1Course.id,
      title: 'User 1 Assignment'
    });

    // 2. Create course and assignment for user2
    const user2Course = await courseService.create(user2.id, {
      name: 'User 2 Course'
    });

    const user2Assignment = await assignmentService.create(user2.id, {
      courseId: user2Course.id,
      title: 'User 2 Assignment'
    });

    // 3. Verify user1 can't see user2's data
    const user1Assignments = await assignmentService.list(user1.id);
    expect(user1Assignments).toHaveLength(1);
    expect(user1Assignments[0].title).toBe('User 1 Assignment');

    const user1Courses = await courseService.list(user1.id);
    expect(user1Courses).toHaveLength(1);
    expect(user1Courses[0].name).toBe('User 1 Course');

    // 4. Verify user2 can't see user1's data
    const user2Assignments = await assignmentService.list(user2.id);
    expect(user2Assignments).toHaveLength(1);
    expect(user2Assignments[0].title).toBe('User 2 Assignment');

    const user2Courses = await courseService.list(user2.id);
    expect(user2Courses).toHaveLength(1);
    expect(user2Courses[0].name).toBe('User 2 Course');

    // 5. Verify cross-user operations fail
    await expect(
      assignmentService.update(user1.id, user2Assignment.id, { title: 'Hacked!' })
    ).rejects.toThrow('Not found');

    await expect(
      assignmentService.getById(user1.id, user2Assignment.id)
    ).resolves.toBeNull();

    await expect(
      courseService.update(user2.id, user1Course.id, { name: 'Hacked Course!' })
    ).rejects.toThrow('Not found');
  });

  it('should handle database constraints and cleanup', async () => {
    // Create course with assignments
    const course = await courseService.create(testUser.id, {
      name: 'Course to Delete',
      code: 'DELETE101'
    });

    const assignment1 = await assignmentService.create(testUser.id, {
      courseId: course.id,
      title: 'Assignment 1'
    });

    const assignment2 = await assignmentService.create(testUser.id, {
      courseId: course.id,
      title: 'Assignment 2'
    });

    // Verify assignments exist
    const courseAssignments = await assignmentService.list(testUser.id);
    expect(courseAssignments.filter(a => a.courseId === course.id)).toHaveLength(2);

    // Delete the course - should cascade delete assignments
    await courseService.remove(testUser.id, course.id);

    // Verify course is gone
    const deletedCourse = await courseService.getById(testUser.id, course.id);
    expect(deletedCourse).toBeNull();

    // Verify assignments were cascade deleted
    const remainingAssignments = await assignmentService.list(testUser.id);
    expect(remainingAssignments.filter(a => a.courseId === course.id)).toHaveLength(0);

    // Verify assignments don't exist individually either
    const assignment1Check = await assignmentService.getById(testUser.id, assignment1.id);
    const assignment2Check = await assignmentService.getById(testUser.id, assignment2.id);
    expect(assignment1Check).toBeNull();
    expect(assignment2Check).toBeNull();
  });

  it('should handle bulk operations efficiently', async () => {
    const course = await courseService.create(testUser.id, {
      name: 'Bulk Test Course'
    });

    // Create multiple assignments quickly
    const assignmentPromises = [];
    for (let i = 1; i <= 20; i++) {
      assignmentPromises.push(
        assignmentService.create(testUser.id, {
          courseId: course.id,
          title: `Bulk Assignment ${i}`,
          dueAt: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(), // Staggered due dates
          priority: i % 3, // Mix of priorities
        })
      );
    }

    const createdAssignments = await Promise.all(assignmentPromises);
    expect(createdAssignments).toHaveLength(20);

    // Test filtering and sorting
    const allAssignments = await assignmentService.list(testUser.id);
    const courseAssignments = allAssignments.filter(a => a.courseId === course.id);
    expect(courseAssignments).toHaveLength(20);

    // Should be sorted by due date ascending
    for (let i = 1; i < courseAssignments.length; i++) {
      const prevDue = new Date(courseAssignments[i - 1].dueAt!);
      const currDue = new Date(courseAssignments[i].dueAt!);
      expect(prevDue.getTime()).toBeLessThanOrEqual(currDue.getTime());
    }

    // Test bulk status updates
    const updatePromises = createdAssignments.slice(0, 10).map(assignment =>
      assignmentService.update(testUser.id, assignment.id, { status: 'SUBMITTED' })
    );

    await Promise.all(updatePromises);

    // Verify filtering works
    const submittedAssignments = await assignmentService.list(testUser.id, {
      status: 'SUBMITTED'
    });
    expect(submittedAssignments).toHaveLength(10);

    // Clean up with purge operation
    const purgeResult = await assignmentService.purgeAllForUser(testUser.id);
    expect(purgeResult.deleted).toBe(20);
  });
});
