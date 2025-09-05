import { PrismaClient } from "@prisma/client";
import { BaseService } from "../base/BaseService";
import { EmailOptions, EmailTemplate, IEmailService } from "../interfaces/IEmailService";

/**
 * Email Service using OOP architecture
 * Manages email sending, templates, and validation
 */
export class EmailService extends BaseService implements IEmailService {
  private readonly fromAddress: string;
  private readonly appName: string;
  private readonly baseUrl: string;
  
  constructor(database: PrismaClient) {
    super(database);
    this.fromAddress = process.env.EMAIL_FROM || 'noreply@duenorth.app';
    this.appName = process.env.APP_NAME || 'DueNorth';
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  async sendEmail(options: EmailOptions): Promise<{ success: true; messageId?: string }> {
    this.validateEmailOptions(options);
    
    try {
      // In a real implementation, you'd use a service like SendGrid, SES, etc.
      // For now, we'll simulate email sending
      
      const emailContent = await this.prepareEmailContent(options);
      
      // Simulate email sending
      console.log(`📧 Sending email to ${options.to}:`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Content: ${emailContent.text || emailContent.html}`);
      
      // In production, replace with actual email service
      // const result = await emailProvider.send(emailContent);
      
      // Log email for debugging (optional)
      await this.logEmailSent(options);
      
      return { 
        success: true, 
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      };
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendVerificationEmail(userId: string, email: string, token: string): Promise<void> {
    this.validateUserId(userId);
    this.validateEmail(email);
    this.validateToken(token);
    
    const verifyUrl = `${this.baseUrl}/auth/verify/confirm?token=${token}`;
    
    await this.sendEmail({
      to: email,
      template: 'verification',
      templateData: {
        appName: this.appName,
        verifyUrl,
        token
      }
    });
  }

  async sendPasswordResetEmail(userId: string, email: string, token: string): Promise<void> {
    this.validateUserId(userId);
    this.validateEmail(email);
    this.validateToken(token);
    
    const resetUrl = `${this.baseUrl}/auth/reset-password?token=${token}`;
    
    await this.sendEmail({
      to: email,
      template: 'password-reset',
      templateData: {
        appName: this.appName,
        resetUrl,
        token
      }
    });
  }

  async sendWelcomeEmail(userId: string, email: string, name?: string): Promise<void> {
    this.validateUserId(userId);
    this.validateEmail(email);
    
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    
    await this.sendEmail({
      to: email,
      template: 'welcome',
      templateData: {
        appName: this.appName,
        name: name || 'Student',
        dashboardUrl
      }
    });
  }

  validateEmailAddress(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getEmailTemplate(templateName: string): EmailTemplate | null {
    const templates: Record<string, EmailTemplate> = {
      'verification': {
        subject: `Verify your ${this.appName} account`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify Your Email Address</h2>
            <p>Welcome to ${this.appName}! Please verify your email address by clicking the link below:</p>
            <a href="{{verifyUrl}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
        text: `Welcome to ${this.appName}! Please verify your email address by visiting: {{verifyUrl}}`
      },
      
      'password-reset': {
        subject: `Reset your ${this.appName} password`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password for ${this.appName}. Click the link below to set a new password:</p>
            <a href="{{resetUrl}}" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
        text: `Reset your ${this.appName} password by visiting: {{resetUrl}}`
      },
      
      'welcome': {
        subject: `Welcome to ${this.appName}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to ${this.appName}, {{name}}!</h2>
            <p>Your account has been created successfully. You can now start tracking your assignments and managing your coursework.</p>
            <a href="{{dashboardUrl}}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
            <p>Happy studying!</p>
          </div>
        `,
        text: `Welcome to ${this.appName}, {{name}}! Visit your dashboard: {{dashboardUrl}}`
      }
    };

    return templates[templateName] || null;
  }

  // Private helper methods
  private async prepareEmailContent(options: EmailOptions): Promise<EmailOptions> {
    if (options.template && options.templateData) {
      const template = this.getEmailTemplate(options.template);
      if (!template) {
        throw new Error(`Email template '${options.template}' not found`);
      }
      
      // Replace template variables
      let subject = template.subject;
      let html = template.html;
      let text = template.text;
      
      for (const [key, value] of Object.entries(options.templateData)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
        html = html.replace(new RegExp(placeholder, 'g'), String(value));
        text = text.replace(new RegExp(placeholder, 'g'), String(value));
      }
      
      return {
        ...options,
        subject,
        html,
        text
      };
    }
    
    return options;
  }

  private async logEmailSent(options: EmailOptions): Promise<void> {
    try {
      // Optional: Log email sends for debugging/analytics
      console.log(`Email logged: ${options.to} - ${options.subject}`);
    } catch (error) {
      // Don't fail email sending if logging fails
      console.warn('Failed to log email:', error);
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID provided');
    }
  }

  private validateEmail(email: string): void {
    if (!email || !this.validateEmailAddress(email)) {
      throw new Error('Invalid email address provided');
    }
  }

  private validateToken(token: string): void {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Invalid token provided');
    }
  }

  private validateEmailOptions(options: EmailOptions): void {
    if (!options.to || !this.validateEmailAddress(options.to)) {
      throw new Error('Valid recipient email address is required');
    }

    if (!options.subject && !options.template) {
      throw new Error('Email subject or template is required');
    }

    if (!options.html && !options.text && !options.template) {
      throw new Error('Email content (html, text, or template) is required');
    }

    if (options.template && !options.templateData) {
      throw new Error('Template data is required when using email template');
    }
  }

  async cleanup(): Promise<void> {
    await this.db.$disconnect();
  }
}
