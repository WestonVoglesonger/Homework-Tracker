import { User, PasswordResetToken, VerificationToken } from "@prisma/client";

/**
 * Authentication Service Interface
 * Defines contract for user authentication, password management, and email verification
 */
export interface IAuthenticationService {
  // Account management
  createAccount(email: string, password: string, name?: string): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
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
