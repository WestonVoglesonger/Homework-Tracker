import { PrismaClient, User, PasswordResetToken, VerificationToken } from "@prisma/client";
import { BaseService } from "../base/BaseService";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "crypto";

export interface IAuthenticationService {
  // Account management
  createAccount(email: string, password: string, name?: string): Promise<User>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
  updatePassword(userId: string, newPassword: string, currentPassword?: string): Promise<void>;
  deleteAccount(userId: string, password: string): Promise<void>;
  
  // Email verification
  createVerificationToken(userId: string): Promise<string>;
  verifyEmailToken(token: string): Promise<User>;
  resendVerificationEmail(email: string): Promise<void>;
  
  // Password reset
  createPasswordResetToken(email: string): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<{ userId: string; email: string }>;
  resetPassword(token: string, newPassword: string): Promise<User>;
  
  // Security
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] };
  hashPassword(password: string): Promise<string>;
  generateSecureToken(): string;
}

/**
 * Authentication Service using OOP architecture
 * Manages user authentication, password reset, and email verification
 */
export class AuthenticationService extends BaseService implements IAuthenticationService {
  
  constructor(database: PrismaClient) {
    super(database);
  }

  async createAccount(email: string, password: string, name?: string): Promise<User> {
    this.validateEmail(email);
    
    const passwordValidation = this.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    try {
      const hashedPassword = await this.hashPassword(password);
      
      const user = await this.db.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          name: name || null,
          emailVerified: null, // Will be set when email is verified
        }
      });

      return user;
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Create user account');
    }
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    this.validateUserId(userId);
    this.validatePassword(password);

    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true }
      });

      if (!user?.passwordHash) {
        return false;
      }

      return await compare(password, user.passwordHash);
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Verify password');
    }
  }

  async updatePassword(userId: string, newPassword: string, currentPassword?: string): Promise<void> {
    this.validateUserId(userId);
    
    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Verify current password if provided
    if (currentPassword) {
      const isCurrentValid = await this.verifyPassword(userId, currentPassword);
      if (!isCurrentValid) {
        throw new Error('Current password is incorrect');
      }
    }

    try {
      const hashedPassword = await this.hashPassword(newPassword);
      
      await this.db.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword }
      });
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Update password');
    }
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    this.validateUserId(userId);
    this.validatePassword(password);

    // Verify password before deletion
    const isPasswordValid = await this.verifyPassword(userId, password);
    if (!isPasswordValid) {
      throw new Error('Password verification failed');
    }

    try {
      // Delete user and all related data (cascading)
      await this.db.user.delete({
        where: { id: userId }
      });
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Delete user account');
    }
  }

  async createVerificationToken(userId: string): Promise<string> {
    this.validateUserId(userId);

    const token = this.generateSecureToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      // Delete any existing verification tokens for this user
      await this.db.verificationToken.deleteMany({
        where: { identifier: userId }
      });

      // Create new verification token
      await this.db.verificationToken.create({
        data: {
          identifier: userId,
          token,
          expires
        }
      });

      return token;
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Create verification token');
    }
  }

  async verifyEmailToken(token: string): Promise<User> {
    this.validateToken(token);

    try {
      const verificationToken = await this.db.verificationToken.findUnique({
        where: { token }
      });

      if (!verificationToken) {
        throw new Error('Invalid verification token');
      }

      if (verificationToken.expires < new Date()) {
        throw new Error('Verification token has expired');
      }

      // Update user as verified
      const user = await this.db.user.update({
        where: { id: verificationToken.identifier },
        data: { emailVerified: new Date() }
      });

      // Delete the used token
      await this.db.verificationToken.delete({
        where: { token }
      });

      return user;
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Verify email token');
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    this.validateEmail(email);

    const user = await this.db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Create new verification token and send email
    const token = await this.createVerificationToken(user.id);
    
    // Import email service to send verification email
    const { EmailService } = await import('./EmailService');
    const emailService = new EmailService(this.db);
    await emailService.sendVerificationEmail(user.id, user.email!, token);
  }

  async createPasswordResetToken(email: string): Promise<string> {
    this.validateEmail(email);

    const user = await this.db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      throw new Error('If a user with that email exists, a password reset link has been sent');
    }

    const token = this.generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    try {
      // Delete any existing reset tokens for this user
      await this.db.passwordResetToken.deleteMany({
        where: { email: user.email! }
      });

      // Create new reset token
      await this.db.passwordResetToken.create({
        data: {
          email: user.email!,
          tokenHash: token,
          expires
        }
      });

      return token;
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Create password reset token');
    }
  }

  async verifyPasswordResetToken(token: string): Promise<{ userId: string; email: string }> {
    this.validateToken(token);

    try {
      const resetToken = await this.db.passwordResetToken.findUnique({
        where: { tokenHash: token }
      });

      if (!resetToken) {
        throw new Error('Invalid password reset token');
      }

      if (resetToken.expires < new Date()) {
        throw new Error('Password reset token has expired');
      }

      // Find user by email
      const user = await this.db.user.findUnique({
        where: { email: resetToken.email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        userId: user.id,
        email: resetToken.email
      };
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Verify password reset token');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    this.validateToken(token);
    
    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    const { userId } = await this.verifyPasswordResetToken(token);

    try {
      const hashedPassword = await this.hashPassword(newPassword);
      
      // Update password
      const user = await this.db.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword }
      });

      // Delete the used token
      await this.db.passwordResetToken.delete({
        where: { tokenHash: token }
      });

      return user;
    } catch (error: any) {
      throw this.handleDatabaseError(error, 'Reset password');
    }
  }

  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { valid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password cannot exceed 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await hash(password, saltRounds);
  }

  generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Private validation methods
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

  private validatePassword(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required');
    }
  }

  private validateToken(token: string): void {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Invalid token provided');
    }
  }

  private validateEmailAddress(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async cleanup(): Promise<void> {
    await this.db.$disconnect();
  }
}
