import { describe, it, expect, beforeEach } from 'vitest';
import { ManualCourseService } from '../../oop/ManualCourseService';
import { testFactory } from '../../../test/factories';
import { testDb } from '../../../test/db-setup';
import { TestUser } from '../../../test/factories';

describe('ManualCourseService (OOP)', () => {
  let service: ManualCourseService;
  let testUser: TestUser;
  let testUser2: TestUser;

  beforeEach(async () => {
    service = new ManualCourseService(testDb!);
    testUser = await testFactory.createUser();
    testUser2 = await testFactory.createUser({ email: 'user2@example.com' });
  });

  describe('createCourse', () => {
    it('should create manual course with proper defaults', async () => {
      const input = {
        name: 'Manual Course Test',
        code: 'man101',
      };

      const course = await service.createCourse(testUser.id, input);

      expect(course.name).toBe('Manual Course Test');
      expect(course.source).toBe('manual');
      expect(course.code).toBe('MAN101'); // Normalized to uppercase
      expect(course.color).toBeTruthy(); // Should have default color
      expect(course.term).toBeTruthy(); // Should have current term
      expect(course.userId).toBe(testUser.id);
    });

    it('should reject Canvas fields for manual courses', async () => {
      const input = {
        name: 'Manual Course',
        canvasId: '12345', // Should be rejected
      };

      await expect(
        service.createCourse(testUser.id, input)
      ).rejects.toThrow('Manual courses cannot have Canvas ID');
    });

    it('should generate current term automatically', async () => {
      const course = await service.createCourse(testUser.id, {
        name: 'Term Test Course',
      });

      // Should have current term (Spring/Summer/Fall YYYY format)
      expect(course.term).toMatch(/^(Spring|Summer|Fall) \d{4}$/);
    });

    it('should generate default color', async () => {
      const course1 = await service.createCourse(testUser.id, {
        name: 'Color Test 1',
      });

      const course2 = await service.createCourse(testUser.id, {
        name: 'Color Test 2',
      });

      expect(course1.color).toMatch(/^#[0-9A-F]{6}$/i); // Valid hex color
      expect(course2.color).toMatch(/^#[0-9A-F]{6}$/i); // Valid hex color
    });

    it('should validate required fields', async () => {
      await expect(
        service.createCourse(testUser.id, { name: '' })
      ).rejects.toThrow('Course name cannot be empty');

      await expect(
        service.createCourse(testUser.id, {} as any)
      ).rejects.toThrow('Missing required fields: name');
    });

    it('should validate field constraints', async () => {
      // Name length validation
      await expect(
        service.createCourse(testUser.id, {
          name: 'x'.repeat(201) // Too long
        })
      ).rejects.toThrow('Course name cannot exceed 200 characters');

      // Code length validation
      await expect(
        service.createCourse(testUser.id, {
          name: 'Test',
          code: 'x'.repeat(21) // Too long
        })
      ).rejects.toThrow('Course code cannot exceed 20 characters');

      // Term length validation
      await expect(
        service.createCourse(testUser.id, {
          name: 'Test',
          term: 'x'.repeat(51) // Too long
        })
      ).rejects.toThrow('Term cannot exceed 50 characters');

      // Color validation
      await expect(
        service.createCourse(testUser.id, {
          name: 'Test',
          color: 'invalid-color' // Invalid format
        })
      ).rejects.toThrow('Color must be a valid hex color');
    });

    it('should allow duplicate course names (uniqueness disabled for now)', async () => {
      const courseName = 'Duplicate Course';
      
      // Create first course
      const course1 = await service.createCourse(testUser.id, {
        name: courseName
      });

      // Create second course with same name (should succeed)
      const course2 = await service.createCourse(testUser.id, {
        name: courseName
      });

      expect(course1.name).toBe(courseName);
      expect(course2.name).toBe(courseName);
      expect(course1.id).not.toBe(course2.id);
    });
  });

  describe('updateCourse', () => {
    it('should update manual course successfully', async () => {
      const original = await testFactory.createCourse(testUser.id, {
        name: 'Original Course',
        code: 'ORIG101',
        source: 'manual'
      });

      const updated = await service.updateCourse(testUser.id, original.id, {
        name: 'Updated Course',
        code: 'upd101',
        term: 'Spring 2025'
      });

      expect(updated.name).toBe('Updated Course');
      expect(updated.code).toBe('UPD101'); // Normalized to uppercase
      expect(updated.term).toBe('Spring 2025');
      expect(updated.id).toBe(original.id);
    });

    it('should handle partial updates correctly', async () => {
      const original = await testFactory.createCourse(testUser.id, {
        name: 'Original Course',
        code: 'ORIG101',
        term: 'Fall 2024',
        source: 'manual'
      });

      // Update only name
      const updated = await service.updateCourse(testUser.id, original.id, {
        name: 'Updated Name Only'
      });

      expect(updated.name).toBe('Updated Name Only'); // Changed
      expect(updated.code).toBe('ORIG101'); // Unchanged
      expect(updated.term).toBe('Fall 2024'); // Unchanged
    });

    it('should allow name updates (uniqueness validation disabled)', async () => {
      const course1 = await testFactory.createCourse(testUser.id, {
        name: 'Course One',
        source: 'manual'
      });

      const course2 = await testFactory.createCourse(testUser.id, {
        name: 'Course Two',
        source: 'manual'
      });

      // Update course2 to have same name as course1 (should succeed)
      const updated = await service.updateCourse(testUser.id, course2.id, {
        name: 'Course One' // Same name - allowed for now
      });

      expect(updated.name).toBe('Course One');
    });
  });

  describe('listCourses with manual-specific sorting', () => {
    it('should sort by term then name', async () => {
      await testFactory.createCourse(testUser.id, {
        name: 'ZZZ Course',
        term: 'Spring 2024',
        source: 'manual'
      });

      await testFactory.createCourse(testUser.id, {
        name: 'AAA Course',
        term: 'Fall 2024',
        source: 'manual'
      });

      await testFactory.createCourse(testUser.id, {
        name: 'BBB Course',
        term: 'Fall 2024',
        source: 'manual'
      });

      const courses = await service.listCourses(testUser.id);

      expect(courses).toHaveLength(3);
      
      // Should be sorted by term first (most recent first)
      expect(courses[0].term).toBe('Fall 2024');
      expect(courses[1].term).toBe('Fall 2024');
      expect(courses[2].term).toBe('Spring 2024');
      
      // Within same term, should be sorted by name (alphabetical)
      expect(courses[0].name).toBe('AAA Course');
      expect(courses[1].name).toBe('BBB Course');
    });
  });

  describe('manual-specific operations', () => {
    it('should duplicate course correctly', async () => {
      const original = await testFactory.createCourse(testUser.id, {
        name: 'Original Course',
        code: 'ORIG101',
        term: 'Fall 2024',
        color: '#FF5733',
        source: 'manual'
      });

      const duplicate = await service.duplicateCourse(testUser.id, original.id);

      expect(duplicate.name).toBe('Original Course (Copy)');
      expect(duplicate.code).toBe('ORIG101_COPY');
      expect(duplicate.term).toBe(original.term);
      expect(duplicate.color).toBe(original.color);
      expect(duplicate.source).toBe('manual');
      expect(duplicate.id).not.toBe(original.id); // Should be different
    });

    it('should duplicate with custom name', async () => {
      const original = await testFactory.createCourse(testUser.id, {
        name: 'Original Course',
        source: 'manual'
      });

      const duplicate = await service.duplicateCourse(
        testUser.id, 
        original.id, 
        'Custom Copy Name'
      );

      expect(duplicate.name).toBe('Custom Copy Name');
    });

    it('should reject duplicating Canvas courses', async () => {
      const canvasCourse = await testFactory.createCourse(testUser.id, {
        name: 'Canvas Course',
        source: 'canvas',
        canvasId: '12345'
      });

      await expect(
        service.duplicateCourse(testUser.id, canvasCourse.id)
      ).rejects.toThrow('Can only duplicate manual courses');
    });

    it('should create course templates', async () => {
      const template = await service.createTemplate(testUser.id, {
        name: 'Math Course',
        code: 'MATH101',
        term: 'Spring 2025',
        color: '#FF5733'
      });

      expect(template.name).toBe('Template: Math Course');
      expect(template.code).toBe('MATH101');
      expect(template.term).toBe('Spring 2025');
      expect(template.color).toBe('#FF5733');
      expect(template.source).toBe('manual');
    });

    it('should archive and unarchive courses', async () => {
      const course = await testFactory.createCourse(testUser.id, {
        name: 'Course to Archive',
        source: 'manual'
      });

      // Archive course
      const archived = await service.archiveCourse(testUser.id, course.id);
      expect(archived.name).toBe('Course to Archive [ARCHIVED]');

      // Unarchive course
      const unarchived = await service.unarchiveCourse(testUser.id, archived.id);
      expect(unarchived.name).toBe('Course to Archive');
    });

    it('should reject archiving Canvas courses', async () => {
      const canvasCourse = await testFactory.createCourse(testUser.id, {
        name: 'Canvas Course',
        source: 'canvas',
        canvasId: '12345'
      });

      await expect(
        service.archiveCourse(testUser.id, canvasCourse.id)
      ).rejects.toThrow('Cannot archive non-manual course');

      await expect(
        service.unarchiveCourse(testUser.id, canvasCourse.id)
      ).rejects.toThrow('Cannot unarchive non-manual course');
    });
  });

  describe('validation and error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Try to create course with extremely long name to trigger DB error
      await expect(
        service.createCourse(testUser.id, {
          name: 'x'.repeat(1000) // Way too long
        })
      ).rejects.toThrow(); // Should throw a meaningful error
    });

    it('should enforce user isolation', async () => {
      const user1Course = await testFactory.createCourse(testUser.id, {
        name: 'User 1 Course',
        source: 'manual'
      });

      // User 2 should not be able to access user 1's course
      await expect(
        service.getCourse(testUser2.id, user1Course.id)
      ).resolves.toBeNull();

      await expect(
        service.updateCourse(testUser2.id, user1Course.id, { name: 'Hacked!' })
      ).rejects.toThrow('Course not found or access denied');

      await expect(
        service.deleteCourse(testUser2.id, user1Course.id)
      ).rejects.toThrow('Course not found or access denied');
    });

    it('should validate user ID format', async () => {
      await expect(
        service.createCourse('', { name: 'Test' })
      ).rejects.toThrow('Invalid user ID provided');

      await expect(
        service.createCourse('   ', { name: 'Test' })
      ).rejects.toThrow('Invalid user ID provided');
    });

    it('should validate course ID format', async () => {
      await expect(
        service.getCourse(testUser.id, '')
      ).rejects.toThrow('Invalid course ID provided');

      await expect(
        service.updateCourse(testUser.id, '   ', { name: 'Test' })
      ).rejects.toThrow('Invalid course ID provided');
    });
  });

  describe('encapsulation and inheritance', () => {
    it('should use proper encapsulation - private methods have correct access', () => {
      // TypeScript private methods are compile-time only, but we can verify they exist
      // and are not meant to be part of the public API
      expect(typeof (service as any).validateCourseNameUniqueness).toBe('function');
      expect(typeof (service as any).generateDefaultColor).toBe('function');
      
      // Public interface should only expose intended methods
      expect(typeof service.createCourse).toBe('function');
      expect(typeof service.updateCourse).toBe('function');
      expect(typeof service.deleteCourse).toBe('function');
      expect(typeof service.listCourses).toBe('function');
      expect(typeof service.getCourse).toBe('function');
    });

    it('should inherit base functionality correctly', async () => {
      // Test that base service methods work
      const course = await testFactory.createCourse(testUser.id, {
        name: 'Base Test Course',
        source: 'manual'
      });

      const stats = await service.getStatistics(testUser.id);
      expect(stats.total).toBe(1);
      expect(stats.bySource).toBeDefined();
      expect(stats.byTerm).toBeDefined();
    });

    it('should implement template method pattern correctly', async () => {
      // The base class defines the algorithm, subclass customizes steps
      const input = {
        name: 'Template Method Test',
        code: 'tmp101'
      };

      const course = await service.createCourse(testUser.id, input);

      // Verify template method worked:
      // 1. Validation ran (no errors thrown)
      // 2. Preprocessing applied defaults
      // 3. Repository called
      // 4. Post-processing applied
      expect(course.source).toBe('manual'); // Preprocessing
      expect(course.code).toBe('TMP101'); // Preprocessing (uppercase)
      expect(course.color).toBeTruthy(); // Default generated
      expect(course.term).toBeTruthy(); // Default generated
    });
  });

  describe('polymorphism demonstration', () => {
    it('should behave differently from Canvas service', async () => {
      // This test demonstrates that manual and Canvas services have different behavior
      const manualInput = {
        name: 'Test Course'
      };

      const course = await service.createCourse(testUser.id, manualInput);

      // Manual service characteristics
      expect(course.source).toBe('manual');
      expect(course.canvasId).toBeNull();
      expect(course.color).toBeTruthy(); // Manual generates color
      expect(course.term).toBeTruthy(); // Manual generates term
    });
  });

  describe('course name uniqueness validation', () => {
    it('should allow duplicate names within manual courses (validation disabled)', async () => {
      const course1 = await service.createCourse(testUser.id, {
        name: 'Unique Course Name'
      });

      const course2 = await service.createCourse(testUser.id, {
        name: 'Unique Course Name' // Same name - allowed for now
      });

      expect(course1.name).toBe('Unique Course Name');
      expect(course2.name).toBe('Unique Course Name');
      expect(course1.id).not.toBe(course2.id);
    });

    it('should allow same name for different users', async () => {
      const courseName = 'Shared Course Name';
      
      // User 1 creates course
      const user1Course = await service.createCourse(testUser.id, {
        name: courseName
      });

      // User 2 should be able to create course with same name
      const user2Course = await service.createCourse(testUser2.id, {
        name: courseName
      });

      expect(user1Course.name).toBe(courseName);
      expect(user2Course.name).toBe(courseName);
      expect(user1Course.id).not.toBe(user2Course.id);
      expect(user1Course.userId).toBe(testUser.id);
      expect(user2Course.userId).toBe(testUser2.id);
    });

    it('should allow same name between manual and Canvas courses', async () => {
      const courseName = 'Cross-Source Course';
      
      // Create manual course
      await service.createCourse(testUser.id, {
        name: courseName
      });

      // Should be able to create Canvas course with same name
      // (This would be tested in CanvasCourseService, but demonstrates the concept)
      const canvasCourse = await testFactory.createCourse(testUser.id, {
        name: courseName,
        source: 'canvas',
        canvasId: '12345'
      });

      expect(canvasCourse.name).toBe(courseName);
    });
  });
});
