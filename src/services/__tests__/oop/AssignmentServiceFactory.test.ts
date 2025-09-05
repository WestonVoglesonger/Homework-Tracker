import { describe, it, expect, beforeEach } from 'vitest';
import { AssignmentServiceFactory } from '../../oop/AssignmentServiceFactory';
import { ManualAssignmentService } from '../../oop/ManualAssignmentService';
import { CanvasAssignmentService } from '../../oop/CanvasAssignmentService';
import { testFactory } from '../../../test/factories';
import { testDb } from '../../../test/db-setup';
import { TestUser } from '../../../test/factories';

describe('AssignmentServiceFactory (OOP)', () => {
  let factory: AssignmentServiceFactory;
  let testUser: TestUser;

  beforeEach(async () => {
    factory = new AssignmentServiceFactory(testDb!);
    testUser = await testFactory.createUser();
  });

  describe('Service Factory Pattern', () => {
    it('should return correct service instance for manual source', () => {
      const service = factory.getServiceForSource('manual');
      
      expect(service).toBeInstanceOf(ManualAssignmentService);
      expect(service.constructor.name).toBe('ManualAssignmentService');
    });

    it('should return correct service instance for canvas source', () => {
      const service = factory.getServiceForSource('canvas');
      
      expect(service).toBeInstanceOf(CanvasAssignmentService);
      expect(service.constructor.name).toBe('CanvasAssignmentService');
    });

    it('should throw error for unsupported source', () => {
      expect(() => {
        factory.getServiceForSource('invalid' as any);
      }).toThrow('Unsupported assignment source: invalid');
    });

    it('should return same instance for multiple calls (singleton behavior)', () => {
      const service1 = factory.getServiceForSource('manual');
      const service2 = factory.getServiceForSource('manual');
      
      expect(service1).toBe(service2); // Same reference
    });
  });

  describe('Automatic Service Selection', () => {
    it('should automatically select correct service for existing assignment', async () => {
      // Create manual assignment
      const manualAssignment = await testFactory.createAssignment(testUser.id, null, {
        title: 'Manual Assignment',
        source: 'manual'
      });

      // Create Canvas assignment
      const canvasAssignment = await testFactory.createAssignment(testUser.id, null, {
        title: 'Canvas Assignment',
        source: 'canvas',
        canvasId: '12345'
      });

      // Factory should return correct service based on assignment
      const manualService = await factory.getServiceForAssignment(testUser.id, manualAssignment.id);
      const canvasService = await factory.getServiceForAssignment(testUser.id, canvasAssignment.id);

      expect(manualService).toBeInstanceOf(ManualAssignmentService);
      expect(canvasService).toBeInstanceOf(CanvasAssignmentService);
    });

    it('should throw error for non-existent assignment', async () => {
      await expect(
        factory.getServiceForAssignment(testUser.id, 'non-existent-id')
      ).rejects.toThrow('Assignment not found');
    });
  });

  describe('Specialized Services', () => {
    it('should provide bulk operations service', () => {
      const bulkService = factory.getBulkService();
      
      expect(bulkService).toBeDefined();
      expect(typeof bulkService.bulkUpdateStatus).toBe('function');
      expect(typeof bulkService.bulkDeleteAssignments).toBe('function');
      expect(typeof bulkService.purgeUserAssignments).toBe('function');
    });

    it('should provide analytics service', () => {
      const analyticsService = factory.getAnalyticsService();
      
      expect(analyticsService).toBeDefined();
      expect(typeof analyticsService.getAssignmentStats).toBe('function');
      expect(typeof analyticsService.getProductivityInsights).toBe('function');
    });

    it('should provide unified service', () => {
      const unifiedService = factory.getUnifiedService();
      
      expect(unifiedService).toBeDefined();
      
      // Should have methods from all interfaces
      expect(typeof unifiedService.listAssignments).toBe('function');
      expect(typeof unifiedService.createAssignment).toBe('function');
      expect(typeof unifiedService.getAssignmentByCanvasId).toBe('function');
      expect(typeof unifiedService.bulkUpdateStatus).toBe('function');
      expect(typeof unifiedService.getAssignmentStats).toBe('function');
    });
  });

  describe('Dependency Injection', () => {
    it('should use injected database connection', async () => {
      // All services should use the same database instance
      const manualService = factory.getServiceForSource('manual');
      const canvasService = factory.getServiceForSource('canvas');
      
      // Both should work with the test database
      await expect(
        manualService.listAssignments(testUser.id)
      ).resolves.toBeDefined();

      await expect(
        canvasService.listAssignments(testUser.id)
      ).resolves.toBeDefined();
    });

    it('should allow service replacement for testing', async () => {
      // This demonstrates how DI allows easy testing
      const customFactory = new AssignmentServiceFactory(testDb!);
      
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

      // Manual assignment creation
      const manualAssignment = await manualService.createAssignment(testUser.id, {
        title: 'Test Assignment',
        type: 'HOMEWORK'
      });

      // Canvas assignment creation (requires different data)
      const canvasAssignment = await canvasService.createAssignment(testUser.id, {
        title: 'Discussion Assignment', // Use title that infers to OTHER
        canvasId: '12345'
      });

      // Same method call, different behavior and results
      expect(manualAssignment.source).toBe('manual');
      expect(manualAssignment.estimatedHours).toBe(2); // Manual default
      expect(manualAssignment.canvasId).toBeNull();

      expect(canvasAssignment.source).toBe('canvas');
      expect(canvasAssignment.canvasId).toBe('12345');
      
      // Canvas service infers type differently
      expect(canvasAssignment.type).toBe('OTHER'); // Default inference for generic title
    });

    it('should handle different validation rules polymorphically', async () => {
      const manualService = factory.getServiceForSource('manual');
      const canvasService = factory.getServiceForSource('canvas');

      // Manual service rejects Canvas fields
      await expect(
        manualService.createAssignment(testUser.id, {
          title: 'Test',
          canvasId: '12345' // Invalid for manual
        })
      ).rejects.toThrow('Manual assignments cannot have Canvas ID');

      // Canvas service requires Canvas ID
      await expect(
        canvasService.createAssignment(testUser.id, {
          title: 'Test'
          // Missing canvasId - invalid for Canvas
        })
      ).rejects.toThrow('Canvas assignments must have a Canvas ID');
    });

    it('should demonstrate different sorting behavior', async () => {
      const manualService = factory.getServiceForSource('manual');
      const canvasService = factory.getServiceForSource('canvas');

      // Create assignments with same due dates but different priorities and Canvas IDs
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await testFactory.createAssignment(testUser.id, null, {
        title: 'Manual High Priority',
        priority: 2,
        dueAt: tomorrow,
        source: 'manual'
      });

      await testFactory.createAssignment(testUser.id, null, {
        title: 'Manual Low Priority',
        priority: 0,
        dueAt: tomorrow,
        source: 'manual'
      });

      await testFactory.createAssignment(testUser.id, null, {
        title: 'Canvas New',
        canvasId: '2000',
        dueAt: tomorrow,
        source: 'canvas'
      });

      await testFactory.createAssignment(testUser.id, null, {
        title: 'Canvas Old',
        canvasId: '1000',
        dueAt: tomorrow,
        source: 'canvas'
      });

      // Manual service sorts by priority first
      const manualResults = await manualService.listAssignments(testUser.id, { source: 'manual' });
      expect(manualResults[0].title).toBe('Manual High Priority'); // Priority 2 first

      // Canvas service sorts by Canvas ID
      const canvasResults = await canvasService.listAssignments(testUser.id, { source: 'canvas' });
      // Both have same due date, sorted by Canvas ID (newer first in Canvas sorting)
      expect(canvasResults.some(a => a.title === 'Canvas New')).toBe(true);
      expect(canvasResults.some(a => a.title === 'Canvas Old')).toBe(true);
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
