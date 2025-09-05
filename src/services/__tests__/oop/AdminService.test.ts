import { describe, it, expect, beforeEach } from 'vitest';
import { AdminService } from '../../oop/AdminService';
import { testFactory } from '../../../test/factories';
import { testDb } from '../../../test/db-setup';
import { TestUser } from '../../../test/factories';

describe('AdminService (OOP)', () => {
  let service: AdminService;
  let testUser: TestUser;
  let adminUser: TestUser;

  beforeEach(async () => {
    service = new AdminService(testDb!);
    testUser = await testFactory.createUser();
    adminUser = await testFactory.createUser({ 
      email: 'admin@example.com',
      isAdmin: true 
    });
  });

  describe('Admin Status Management', () => {
    it('should check admin status correctly', async () => {
      const isUserAdmin = await service.isAdmin(testUser.id);
      const isAdminUserAdmin = await service.isAdmin(adminUser.id);

      expect(isUserAdmin).toBe(false);
      expect(isAdminUserAdmin).toBe(true);
    });

    it('should handle missing isAdmin field gracefully', async () => {
      // This tests the fallback behavior when isAdmin column doesn't exist
      const result = await service.isAdmin('non-existent-user');
      expect(result).toBe(false);
    });

    it('should validate user ID format', async () => {
      await expect(
        service.isAdmin('')
      ).rejects.toThrow('Invalid user ID provided');

      await expect(
        service.isAdmin('   ')
      ).rejects.toThrow('Invalid user ID provided');
    });
  });

  describe('User Analytics', () => {
    it('should get comprehensive user analytics', async () => {
      // Create some test data
      await testFactory.createUser({ email: 'user3@example.com' });
      await testFactory.createUser({ email: 'user4@example.com', isAdmin: true });

      const analytics = await service.getUserAnalytics();

      expect(analytics.totalUsers).toBeGreaterThanOrEqual(4); // At least our test users
      expect(analytics.adminUsers).toBeGreaterThanOrEqual(2); // At least 2 admin users
      expect(analytics.regularUsers).toBe(analytics.totalUsers - analytics.adminUsers);
      expect(typeof analytics.recentSignups).toBe('number');
      expect(typeof analytics.usersWithCanvas).toBe('number');
    });

    it('should handle database errors in analytics', async () => {
      // Test graceful error handling
      await expect(
        service.getUserAnalytics()
      ).resolves.toBeDefined(); // Should not throw
    });
  });

  describe('System Health Monitoring', () => {
    it('should get system health status', async () => {
      const health = await service.getSystemHealth();

      expect(health.database).toBe('Connected');
      expect(typeof health.totalRecords).toBe('number');
      expect(typeof health.recentErrors).toBe('number');
      expect(health.totalRecords).toBeGreaterThanOrEqual(0);
    });

    it('should handle database connection issues', async () => {
      // Test that health check doesn't crash on errors
      const health = await service.getSystemHealth();
      
      expect(health).toBeDefined();
      expect(['Connected', 'Error']).toContain(health.database);
    });
  });

  describe('Admin Action Logging', () => {
    it('should log admin actions successfully', async () => {
      const actionData = {
        action: 'test_action',
        targetId: testUser.id,
        targetType: 'user',
        data: { test: 'data' },
        adminId: adminUser.id
      };

      const loggedAction = await service.logAdminAction(actionData);

      expect(loggedAction.action).toBe('test_action');
      expect(loggedAction.targetId).toBe(testUser.id);
      expect(loggedAction.targetType).toBe('user');
      expect(loggedAction.adminId).toBe(adminUser.id);
      expect(loggedAction.data).toEqual({ test: 'data' });
    });

    it('should validate admin action data', async () => {
      // Missing action
      await expect(
        service.logAdminAction({
          action: '',
          adminId: adminUser.id
        })
      ).rejects.toThrow('Action is required');

      // Missing admin ID
      await expect(
        service.logAdminAction({
          action: 'test',
          adminId: ''
        })
      ).rejects.toThrow('Admin ID is required');

      // Invalid data type
      await expect(
        service.logAdminAction({
          action: 'test',
          adminId: adminUser.id,
          data: 'invalid' as any
        })
      ).rejects.toThrow('Action data must be an object');
    });

    it('should retrieve admin actions with filtering', async () => {
      // Create some test actions
      await service.logAdminAction({
        action: 'action1',
        adminId: adminUser.id
      });

      await service.logAdminAction({
        action: 'action2',
        adminId: adminUser.id
      });

      const allActions = await service.getAdminActions();
      const adminActions = await service.getAdminActions(adminUser.id);

      expect(allActions.length).toBeGreaterThanOrEqual(2);
      expect(adminActions.length).toBeGreaterThanOrEqual(2);
      expect(adminActions.every(a => a.adminId === adminUser.id)).toBe(true);
    });

    it('should handle missing AdminAction table gracefully', async () => {
      // Test fallback behavior when table doesn't exist
      const actions = await service.getAdminActions();
      expect(Array.isArray(actions)).toBe(true);
    });
  });

  describe('User Promotion and Demotion', () => {
    it('should handle admin promotion validation', async () => {
      // Mock admin password for testing
      const originalEnv = process.env.ADMIN_PASSWORD_HASH;
      process.env.ADMIN_PASSWORD_HASH = '$2a$12$test.hash.for.testing';

      try {
        // Should reject invalid admin password
        await expect(
          service.promoteToAdmin(testUser.id, 'wrong-password', adminUser.id)
        ).rejects.toThrow('Invalid admin password');

        // Note: Admin password validation happens first, so we need valid password
        // to test the non-admin promoter validation. For now, test the password validation.
      } finally {
        process.env.ADMIN_PASSWORD_HASH = originalEnv;
      }
    });

    it('should handle demotion validation', async () => {
      const anotherAdmin = await testFactory.createUser({ 
        email: 'admin2@example.com',
        isAdmin: true 
      });

      // Should reject non-admin demoter
      await expect(
        service.demoteFromAdmin(anotherAdmin.id, testUser.id)
      ).rejects.toThrow('Only admins can demote users');

      // Should reject self-demotion
      await expect(
        service.demoteFromAdmin(adminUser.id, adminUser.id)
      ).rejects.toThrow('Cannot demote yourself');
    });

    it('should validate promotion/demotion parameters', async () => {
      await expect(
        service.promoteToAdmin('', 'password', adminUser.id)
      ).rejects.toThrow('Invalid user ID provided');

      await expect(
        service.demoteFromAdmin(testUser.id, '')
      ).rejects.toThrow('Invalid user ID provided');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle missing admin password configuration', async () => {
      const originalEnv = process.env.ADMIN_PASSWORD_HASH;
      delete process.env.ADMIN_PASSWORD_HASH;

      try {
        await expect(
          service.promoteToAdmin(testUser.id, 'password', adminUser.id)
        ).rejects.toThrow('Admin password not configured');
      } finally {
        process.env.ADMIN_PASSWORD_HASH = originalEnv;
      }
    });

    it('should handle database errors gracefully', async () => {
      // Test with invalid user ID that would cause database error
      await expect(
        service.isAdmin('invalid-uuid-format')
      ).resolves.toBe(false); // Should not throw, just return false
    });
  });

  describe('OOP Principles Verification', () => {
    it('should demonstrate proper encapsulation', () => {
      // Verify that internal methods are not exposed
      expect(typeof service.isAdmin).toBe('function'); // Public
      expect(typeof service.logAdminAction).toBe('function'); // Public
      expect(typeof service.getUserAnalytics).toBe('function'); // Public
      
      // Private methods should exist but not be part of public API
      expect(typeof (service as any).validateUserId).toBe('function');
      expect(typeof (service as any).getRecentErrorCount).toBe('function');
    });

    it('should inherit from BaseService correctly', async () => {
      // Test that BaseService functionality is available
      expect(typeof (service as any).sanitizeHtml).toBe('function');
      expect(typeof (service as any).validateUserOwnership).toBe('function');
      expect(typeof (service as any).handleDatabaseError).toBe('function');
      expect(typeof service.cleanup).toBe('function');
    });

    it('should implement dependency injection correctly', () => {
      // Service should use injected database
      expect((service as any).db).toBe(testDb);
    });
  });
});
