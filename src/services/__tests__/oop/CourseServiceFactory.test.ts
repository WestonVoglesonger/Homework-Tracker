import { describe, it, expect, beforeEach } from 'vitest';
import { CourseServiceFactory } from '../../oop/CourseServiceFactory';
import { ManualCourseService } from '../../oop/ManualCourseService';
import { CanvasCourseService } from '../../oop/CanvasCourseService';
import { testFactory } from '../../../test/factories';
import { testDb } from '../../../test/db-setup';
import { TestUser } from '../../../test/factories';

describe('CourseServiceFactory (OOP)', () => {
  let factory: CourseServiceFactory;
  let testUser: TestUser;

  beforeEach(async () => {
    factory = new CourseServiceFactory(testDb!);
    testUser = await testFactory.createUser();
  });

  describe('Service Factory Pattern', () => {
    it('should return correct service instance for manual source', () => {
      const service = factory.getServiceForSource('manual');
      
      expect(service).toBeInstanceOf(ManualCourseService);
      expect(service.constructor.name).toBe('ManualCourseService');
    });

    it('should return correct service instance for canvas source', () => {
      const service = factory.getServiceForSource('canvas');
      
      expect(service).toBeInstanceOf(CanvasCourseService);
      expect(service.constructor.name).toBe('CanvasCourseService');
    });

    it('should throw error for unsupported source', () => {
      expect(() => {
        factory.getServiceForSource('invalid' as any);
      }).toThrow('Unsupported course source: invalid');
    });

    it('should return same instance for multiple calls (singleton behavior)', () => {
      const service1 = factory.getServiceForSource('manual');
      const service2 = factory.getServiceForSource('manual');
      
      expect(service1).toBe(service2); // Same reference
    });
  });

  describe('Automatic Service Selection', () => {
    it('should automatically select correct service for existing course', async () => {
      // Create manual course
      const manualCourse = await testFactory.createCourse(testUser.id, {
        name: 'Manual Course',
        source: 'manual'
      });

      // Create Canvas course
      const canvasCourse = await testFactory.createCourse(testUser.id, {
        name: 'Canvas Course',
        source: 'canvas',
        canvasId: '12345'
      });

      // Factory should return correct service based on course
      const manualService = await factory.getServiceForCourse(testUser.id, manualCourse.id);
      const canvasService = await factory.getServiceForCourse(testUser.id, canvasCourse.id);

      expect(manualService).toBeInstanceOf(ManualCourseService);
      expect(canvasService).toBeInstanceOf(CanvasCourseService);
    });

    it('should throw error for non-existent course', async () => {
      await expect(
        factory.getServiceForCourse(testUser.id, 'non-existent-id')
      ).rejects.toThrow('Course not found');
    });
  });

  describe('Specialized Services', () => {
    it('should provide bulk operations service', () => {
      const bulkService = factory.getBulkService();
      
      expect(bulkService).toBeDefined();
      expect(typeof bulkService.bulkDeleteCourses).toBe('function');
      expect(typeof bulkService.purgeUserCourses).toBe('function');
      expect(typeof bulkService.bulkArchiveCourses).toBe('function');
    });

    it('should provide analytics service', () => {
      const analyticsService = factory.getAnalyticsService();
      
      expect(analyticsService).toBeDefined();
      expect(typeof analyticsService.getCourseStats).toBe('function');
      expect(typeof analyticsService.getWorkloadAnalysis).toBe('function');
    });

    it('should provide unified service', () => {
      const unifiedService = factory.getUnifiedService();
      
      expect(unifiedService).toBeDefined();
      
      // Should have methods from all interfaces
      expect(typeof unifiedService.listCourses).toBe('function');
      expect(typeof unifiedService.createCourse).toBe('function');
      expect(typeof unifiedService.getCourseByCanvasId).toBe('function');
      expect(typeof unifiedService.bulkDeleteCourses).toBe('function');
      expect(typeof unifiedService.getCourseStats).toBe('function');
    });
  });

  describe('Dependency Injection', () => {
    it('should use injected database connection', async () => {
      // All services should use the same database instance
      const manualService = factory.getServiceForSource('manual');
      const canvasService = factory.getServiceForSource('canvas');
      
      // Both should work with the test database
      await expect(
        manualService.listCourses(testUser.id)
      ).resolves.toBeDefined();

      await expect(
        canvasService.listCourses(testUser.id)
      ).resolves.toBeDefined();
    });

    it('should allow service replacement for testing', async () => {
      // This demonstrates how DI allows easy testing
      const customFactory = new CourseServiceFactory(testDb!);
      
      const service1 = customFactory.getServiceForSource('manual');
      const service2 = factory.getServiceForSource('manual');
      
      // Different factory instances can have different service instances
      expect(service1).not.toBe(service2);
    });
  });

  describe('Polymorphism Demonstration', () => {
    it('should demonstrate polymorphic behavior', async () => {
      // Both services implement the same interface but behave differently
      const manualService = factory.getServiceForSource('manual');
      const canvasService = factory.getServiceForSource('canvas');

      // Manual course creation
      const manualCourse = await manualService.createCourse(testUser.id, {
        name: 'Test Course'
      });

      // Canvas course creation (requires different data)
      const canvasCourse = await canvasService.createCourse(testUser.id, {
        name: 'Test Course',
        canvasId: '12345'
      });

      // Same method call, different behavior and results
      expect(manualCourse.source).toBe('manual');
      expect(manualCourse.canvasId).toBeNull();
      expect(manualCourse.color).toBeTruthy(); // Manual generates color

      expect(canvasCourse.source).toBe('canvas');
      expect(canvasCourse.canvasId).toBe('12345');
    });

    it('should handle different validation rules polymorphically', async () => {
      const manualService = factory.getServiceForSource('manual');
      const canvasService = factory.getServiceForSource('canvas');

      // Manual service rejects Canvas fields
      await expect(
        manualService.createCourse(testUser.id, {
          name: 'Test',
          canvasId: '12345' // Invalid for manual
        })
      ).rejects.toThrow('Manual courses cannot have Canvas ID');

      // Canvas service requires Canvas ID
      await expect(
        canvasService.createCourse(testUser.id, {
          name: 'Test'
          // Missing canvasId - invalid for Canvas
        })
      ).rejects.toThrow('Canvas courses must have a Canvas ID');
    });

    it('should demonstrate different sorting behavior', async () => {
      const manualService = factory.getServiceForSource('manual');
      const canvasService = factory.getServiceForSource('canvas');

      // Create courses with different characteristics
      await testFactory.createCourse(testUser.id, {
        name: 'ZZZ Manual Course',
        term: 'Spring 2024',
        source: 'manual'
      });

      await testFactory.createCourse(testUser.id, {
        name: 'AAA Manual Course', 
        term: 'Fall 2024',
        source: 'manual'
      });

      await testFactory.createCourse(testUser.id, {
        name: 'Canvas Course New',
        canvasId: '2000',
        source: 'canvas'
      });

      await testFactory.createCourse(testUser.id, {
        name: 'Canvas Course Old',
        canvasId: '1000',
        source: 'canvas'
      });

      // Manual service sorts by term then name
      const manualResults = await manualService.listCourses(testUser.id, { source: 'manual' });
      expect(manualResults[0].term).toBe('Fall 2024'); // Most recent term first

      // Canvas service sorts by Canvas ID
      const canvasResults = await canvasService.listCourses(testUser.id, { source: 'canvas' });
      expect(canvasResults[0].canvasId).toBe('2000'); // Newer Canvas ID first
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup all services', async () => {
      // Get services to initialize them
      factory.getServiceForSource('manual');
      factory.getServiceForSource('canvas');
      factory.getBulkService();
      factory.getAnalyticsService();

      // Should cleanup without errors
      await expect(factory.cleanup()).resolves.not.toThrow();
    });
  });
});
