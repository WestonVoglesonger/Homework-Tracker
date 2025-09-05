export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
}

/**
 * Email Service Interface
 * Defines contract for email operations, templates, and validation
 */
export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<{ success: true; messageId?: string }>;
  sendVerificationEmail(userId: string, email: string, token: string): Promise<void>;
  sendPasswordResetEmail(userId: string, email: string, token: string): Promise<void>;
  sendWelcomeEmail(userId: string, email: string, name?: string): Promise<void>;
  validateEmailAddress(email: string): boolean;
  getEmailTemplate(templateName: string): EmailTemplate | null;
}
