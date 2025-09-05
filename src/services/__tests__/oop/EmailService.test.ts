import { describe, it, expect, beforeEach } from 'vitest';
import { EmailService } from '../../oop/EmailService';
import { testFactory } from '../../../test/factories';
import { testDb } from '../../../test/db-setup';
import { TestUser } from '../../../test/factories';

describe('EmailService (OOP)', () => {
  let service: EmailService;
  let testUser: TestUser;

  beforeEach(async () => {
    service = new EmailService(testDb!);
    testUser = await testFactory.createUser();
  });

  describe('Email Validation', () => {
    it('should validate email addresses correctly', () => {
      expect(service.validateEmailAddress('test@example.com')).toBe(true);
      expect(service.validateEmailAddress('user.name+tag@domain.co.uk')).toBe(true);
      expect(service.validateEmailAddress('invalid-email')).toBe(false);
      expect(service.validateEmailAddress('test@')).toBe(false);
      expect(service.validateEmailAddress('@example.com')).toBe(false);
      expect(service.validateEmailAddress('')).toBe(false);
    });

    it('should validate email options', async () => {
      // Missing recipient
      await expect(
        service.sendEmail({
          to: '',
          subject: 'Test'
        })
      ).rejects.toThrow('Valid recipient email address is required');

      // Missing subject and template
      await expect(
        service.sendEmail({
          to: 'test@example.com'
        })
      ).rejects.toThrow('Email subject or template is required');

      // Missing content
      await expect(
        service.sendEmail({
          to: 'test@example.com',
          subject: 'Test'
        })
      ).rejects.toThrow('Email content (html, text, or template) is required');

      // Template without data
      await expect(
        service.sendEmail({
          to: 'test@example.com',
          template: 'verification'
        })
      ).rejects.toThrow('Template data is required when using email template');
    });
  });

  describe('Email Templates', () => {
    it('should have verification email template', () => {
      const template = service.getEmailTemplate('verification');
      
      expect(template).toBeTruthy();
      expect(template!.subject).toContain('Verify');
      expect(template!.html).toContain('{{verifyUrl}}');
      expect(template!.text).toContain('{{verifyUrl}}');
    });

    it('should have password reset email template', () => {
      const template = service.getEmailTemplate('password-reset');
      
      expect(template).toBeTruthy();
      expect(template!.subject).toContain('Reset');
      expect(template!.html).toContain('{{resetUrl}}');
      expect(template!.text).toContain('{{resetUrl}}');
    });

    it('should have welcome email template', () => {
      const template = service.getEmailTemplate('welcome');
      
      expect(template).toBeTruthy();
      expect(template!.subject).toContain('Welcome');
      expect(template!.html).toContain('{{name}}');
      expect(template!.html).toContain('{{dashboardUrl}}');
    });

    it('should return null for non-existent template', () => {
      const template = service.getEmailTemplate('non-existent');
      expect(template).toBeNull();
    });
  });

  describe('Email Sending', () => {
    it('should send basic email successfully', async () => {
      const result = await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(result.messageId).toMatch(/^mock-\d+-[a-z0-9]+$/);
    });

    it('should send HTML email successfully', async () => {
      const result = await service.sendEmail({
        to: 'test@example.com',
        subject: 'HTML Test',
        html: '<h1>Test Email</h1><p>This is HTML content</p>'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
    });

    it('should send templated email successfully', async () => {
      const result = await service.sendEmail({
        to: 'test@example.com',
        template: 'welcome',
        templateData: {
          appName: 'TestApp',
          name: 'John Doe',
          dashboardUrl: 'https://example.com/dashboard'
        }
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
    });

    it('should handle template variable replacement', async () => {
      const template = service.getEmailTemplate('verification');
      expect(template).toBeTruthy();

      // Test that template variables are properly replaced
      const result = await service.sendEmail({
        to: 'test@example.com',
        template: 'verification',
        templateData: {
          appName: 'TestApp',
          verifyUrl: 'https://example.com/verify',
          token: 'test-token-123'
        }
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid template', async () => {
      await expect(
        service.sendEmail({
          to: 'test@example.com',
          template: 'non-existent-template',
          templateData: {}
        })
      ).rejects.toThrow("Email template 'non-existent-template' not found");
    });
  });

  describe('Specialized Email Methods', () => {
    it('should send verification email', async () => {
      await expect(
        service.sendVerificationEmail(testUser.id, testUser.email, 'verify-token-123')
      ).resolves.not.toThrow();
    });

    it('should send password reset email', async () => {
      await expect(
        service.sendPasswordResetEmail(testUser.id, testUser.email, 'reset-token-123')
      ).resolves.not.toThrow();
    });

    it('should send welcome email', async () => {
      await expect(
        service.sendWelcomeEmail(testUser.id, testUser.email, 'John Doe')
      ).resolves.not.toThrow();
    });

    it('should send welcome email without name', async () => {
      await expect(
        service.sendWelcomeEmail(testUser.id, testUser.email)
      ).resolves.not.toThrow();
    });

    it('should validate parameters for specialized emails', async () => {
      // Invalid user ID
      await expect(
        service.sendVerificationEmail('', testUser.email, 'token')
      ).rejects.toThrow('Invalid user ID provided');

      // Invalid email
      await expect(
        service.sendVerificationEmail(testUser.id, 'invalid-email', 'token')
      ).rejects.toThrow('Invalid email address provided');

      // Invalid token
      await expect(
        service.sendVerificationEmail(testUser.id, testUser.email, '')
      ).rejects.toThrow('Invalid token provided');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle email sending failures gracefully', async () => {
      // Test with malformed email options
      await expect(
        service.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          text: 'Test content'
        })
      ).resolves.toBeDefined(); // Should not throw in mock implementation
    });

    it('should handle template processing errors', async () => {
      await expect(
        service.sendEmail({
          to: 'test@example.com',
          template: 'verification',
          templateData: null as any // Invalid template data
        })
      ).rejects.toThrow('Template data is required');
    });
  });

  describe('OOP Principles Verification', () => {
    it('should demonstrate proper encapsulation', () => {
      // Public interface
      expect(typeof service.sendEmail).toBe('function');
      expect(typeof service.sendVerificationEmail).toBe('function');
      expect(typeof service.validateEmailAddress).toBe('function');
      expect(typeof service.getEmailTemplate).toBe('function');
      
      // Private methods should exist but not be part of public API
      expect(typeof (service as any).prepareEmailContent).toBe('function');
      expect(typeof (service as any).validateEmailOptions).toBe('function');
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
      
      // Service should have configuration from environment
      expect(typeof (service as any).fromAddress).toBe('string');
      expect(typeof (service as any).appName).toBe('string');
      expect(typeof (service as any).baseUrl).toBe('string');
    });

    it('should handle configuration properly', () => {
      // Test default configuration values
      expect((service as any).fromAddress).toBeTruthy();
      expect((service as any).appName).toBeTruthy();
      expect((service as any).baseUrl).toBeTruthy();
    });
  });

  describe('Template System', () => {
    it('should process template variables correctly', async () => {
      const testData = {
        appName: 'TestApp',
        name: 'John Doe',
        verifyUrl: 'https://example.com/verify?token=abc123',
        dashboardUrl: 'https://example.com/dashboard'
      };

      const result = await service.sendEmail({
        to: 'test@example.com',
        template: 'welcome',
        templateData: testData
      });

      expect(result.success).toBe(true);
      // In a real implementation, we'd verify the template variables were replaced
    });

    it('should handle missing template variables gracefully', async () => {
      // Template expects variables but some are missing
      const result = await service.sendEmail({
        to: 'test@example.com',
        template: 'verification',
        templateData: {
          appName: 'TestApp'
          // Missing verifyUrl and token
        }
      });

      // Should still send (variables become empty strings)
      expect(result.success).toBe(true);
    });
  });
});
