import { describe, it, expect, beforeEach } from 'vitest';
import { UserPreferenceService } from '../../oop/UserPreferenceService';
import { testFactory } from '../../../test/factories';
import { testDb } from '../../../test/db-setup';
import { TestUser } from '../../../test/factories';

describe('UserPreferenceService (OOP)', () => {
  let service: UserPreferenceService;
  let testUser: TestUser;
  let testUser2: TestUser;

  beforeEach(async () => {
    service = new UserPreferenceService(testDb!);
    testUser = await testFactory.createUser();
    testUser2 = await testFactory.createUser({ email: 'user2@example.com' });
  });

  describe('Get User Preferences', () => {
    it('should get default preferences for new user', async () => {
      const preferences = await service.get(testUser.id);

      expect(preferences.canvasSetupDismissed).toBe(false);
    });

    it('should handle missing user gracefully', async () => {
      await expect(
        service.get('non-existent-user-id')
      ).rejects.toThrow('User not found');
    });

    it('should handle missing canvasSetupDismissed field gracefully', async () => {
      // Test fallback behavior when field doesn't exist in schema
      const preferences = await service.get(testUser.id);
      expect(preferences).toBeDefined();
      expect(typeof preferences.canvasSetupDismissed).toBe('boolean');
    });

    it('should validate user ID format', async () => {
      await expect(
        service.get('')
      ).rejects.toThrow('Invalid user ID provided');

      await expect(
        service.get('   ')
      ).rejects.toThrow('Invalid user ID provided');
    });
  });

  describe('Update User Preferences', () => {
    it('should update canvasSetupDismissed successfully', async () => {
      // Initially false
      let preferences = await service.get(testUser.id);
      expect(preferences.canvasSetupDismissed).toBe(false);

      // Update to true
      const updated = await service.update(testUser.id, {
        canvasSetupDismissed: true
      });

      expect(updated.canvasSetupDismissed).toBe(true);

      // Verify persistence
      preferences = await service.get(testUser.id);
      expect(preferences.canvasSetupDismissed).toBe(true);
    });

    it('should handle partial updates', async () => {
      // Update with empty object should not change anything
      const original = await service.get(testUser.id);
      const updated = await service.update(testUser.id, {});
      
      expect(updated.canvasSetupDismissed).toBe(original.canvasSetupDismissed);
    });

    it('should validate preference values', async () => {
      // Invalid preference object
      await expect(
        service.update(testUser.id, null as any)
      ).rejects.toThrow('Preferences must be an object');

      await expect(
        service.update(testUser.id, 'invalid' as any)
      ).rejects.toThrow('Preferences must be an object');

      // Invalid boolean value
      await expect(
        service.update(testUser.id, {
          canvasSetupDismissed: 'not-boolean' as any
        })
      ).rejects.toThrow('canvasSetupDismissed must be a boolean');
    });

    it('should validate user ID format', async () => {
      await expect(
        service.update('', { canvasSetupDismissed: true })
      ).rejects.toThrow('Invalid user ID provided');
    });
  });

  describe('Reset Preferences', () => {
    it('should reset preferences to defaults', async () => {
      // Set some non-default values
      await service.update(testUser.id, {
        canvasSetupDismissed: true
      });

      // Reset to defaults
      const reset = await service.reset(testUser.id);

      expect(reset.canvasSetupDismissed).toBe(false);

      // Verify persistence
      const preferences = await service.get(testUser.id);
      expect(preferences.canvasSetupDismissed).toBe(false);
    });

    it('should validate user ID for reset', async () => {
      await expect(
        service.reset('')
      ).rejects.toThrow('Invalid user ID provided');
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk reset preferences for multiple users', async () => {
      const user3 = await testFactory.createUser({ email: 'user3@example.com' });
      
      // Set non-default preferences for all users
      await service.update(testUser.id, { canvasSetupDismissed: true });
      await service.update(testUser2.id, { canvasSetupDismissed: true });
      await service.update(user3.id, { canvasSetupDismissed: true });

      // Bulk reset
      const result = await service.bulkResetPreferences([
        testUser.id, 
        testUser2.id, 
        user3.id
      ]);

      expect(result.updated).toBe(3);

      // Verify all were reset
      const prefs1 = await service.get(testUser.id);
      const prefs2 = await service.get(testUser2.id);
      const prefs3 = await service.get(user3.id);

      expect(prefs1.canvasSetupDismissed).toBe(false);
      expect(prefs2.canvasSetupDismissed).toBe(false);
      expect(prefs3.canvasSetupDismissed).toBe(false);
    });

    it('should handle empty bulk reset', async () => {
      const result = await service.bulkResetPreferences([]);
      expect(result.updated).toBe(0);
    });

    it('should validate bulk reset parameters', async () => {
      const result = await service.bulkResetPreferences(null as any);
      expect(result.updated).toBe(0);
    });
  });

  describe('Analytics', () => {
    it('should get preferences analytics', async () => {
      // Create users with different preferences
      await service.update(testUser.id, { canvasSetupDismissed: true });
      await service.update(testUser2.id, { canvasSetupDismissed: false });
      
      const analytics = await service.getPreferencesAnalytics();

      expect(analytics.totalUsers).toBeGreaterThanOrEqual(2);
      expect(analytics.canvasSetupDismissed).toBeGreaterThanOrEqual(1);
      expect(analytics.canvasSetupActive).toBeGreaterThanOrEqual(1);
      expect(analytics.canvasSetupDismissed + analytics.canvasSetupActive).toBe(analytics.totalUsers);
    });

    it('should handle analytics with no users', async () => {
      // Test with fresh database (no users yet in this test)
      const analytics = await service.getPreferencesAnalytics();
      
      expect(typeof analytics.totalUsers).toBe('number');
      expect(typeof analytics.canvasSetupDismissed).toBe('number');
      expect(typeof analytics.canvasSetupActive).toBe('number');
    });
  });

  describe('User Isolation', () => {
    it('should enforce user isolation', async () => {
      // Set preferences for user1
      await service.update(testUser.id, { canvasSetupDismissed: true });

      // User2's preferences should be independent
      const user2Prefs = await service.get(testUser2.id);
      expect(user2Prefs.canvasSetupDismissed).toBe(false); // Default, not affected by user1

      // Update user2's preferences
      await service.update(testUser2.id, { canvasSetupDismissed: true });

      // User1's preferences should be unchanged
      const user1Prefs = await service.get(testUser.id);
      expect(user1Prefs.canvasSetupDismissed).toBe(true); // Still true
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Test with invalid user ID format
      await expect(
        service.get('invalid-uuid-format')
      ).rejects.toThrow(); // Should provide meaningful error
    });

    it('should handle update errors gracefully', async () => {
      // Test with non-existent user
      await expect(
        service.update('non-existent-user', { canvasSetupDismissed: true })
      ).rejects.toThrow(); // Should provide meaningful error
    });
  });

  describe('OOP Principles Verification', () => {
    it('should demonstrate proper encapsulation', () => {
      // Public interface
      expect(typeof service.get).toBe('function');
      expect(typeof service.update).toBe('function');
      expect(typeof service.reset).toBe('function');
      expect(typeof service.bulkResetPreferences).toBe('function');
      expect(typeof service.getPreferencesAnalytics).toBe('function');
      
      // Private methods should exist but not be part of public API
      expect(typeof (service as any).validateUserId).toBe('function');
      expect(typeof (service as any).validatePreferences).toBe('function');
    });

    it('should inherit from BaseService correctly', () => {
      // Test that BaseService functionality is available
      expect(typeof (service as any).sanitizeHtml).toBe('function');
      expect(typeof (service as any).handleDatabaseError).toBe('function');
      expect(typeof service.cleanup).toBe('function');
    });

    it('should implement dependency injection correctly', () => {
      // Service should use injected database
      expect((service as any).db).toBe(testDb);
    });

    it('should provide clean interface without exposing internals', () => {
      // Should not expose database directly
      expect((service as any).database).toBeUndefined();
      expect((service as any).prisma).toBeUndefined();
      
      // Should expose only intended functionality
      const publicMethods = [
        'get', 'update', 'reset', 'bulkResetPreferences', 
        'getPreferencesAnalytics', 'cleanup'
      ];
      
      publicMethods.forEach(method => {
        expect(typeof (service as any)[method]).toBe('function');
      });
    });
  });

  describe('Type Safety and Validation', () => {
    it('should enforce type safety for preferences', async () => {
      // TypeScript should catch these at compile time, but test runtime validation
      const validPrefs = { canvasSetupDismissed: true };
      await expect(
        service.update(testUser.id, validPrefs)
      ).resolves.toBeDefined();

      // Invalid types should be caught by validation
      await expect(
        service.update(testUser.id, { canvasSetupDismissed: 'yes' as any })
      ).rejects.toThrow('canvasSetupDismissed must be a boolean');
    });

    it('should return consistent type structure', async () => {
      const preferences = await service.get(testUser.id);
      
      expect(typeof preferences).toBe('object');
      expect(typeof preferences.canvasSetupDismissed).toBe('boolean');
      
      // Should have all expected properties
      expect('canvasSetupDismissed' in preferences).toBe(true);
    });
  });
});
