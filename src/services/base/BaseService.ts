import { PrismaClient } from "@prisma/client";
import DOMPurify from "isomorphic-dompurify";

/**
 * Abstract base class for all services implementing common functionality
 * Follows OOP principles: encapsulation, inheritance support
 */
export abstract class BaseService {
  protected readonly db: PrismaClient;
  
  constructor(database: PrismaClient) {
    this.db = database;
  }

  /**
   * Sanitizes HTML content for safe storage
   * @param input - Raw HTML content
   * @returns Sanitized HTML string
   */
  protected sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, { 
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });
  }

  /**
   * Validates user ownership of a resource
   * @param userId - ID of the user attempting access
   * @param resourceUserId - ID of the user who owns the resource
   * @throws Error if user doesn't own the resource
   */
  protected validateUserOwnership(userId: string, resourceUserId: string): void {
    if (userId !== resourceUserId) {
      throw new Error("Access denied: User does not own this resource");
    }
  }

  /**
   * Validates required fields are present
   * @param data - Object to validate
   * @param requiredFields - Array of required field names
   * @throws Error if any required field is missing
   */
  protected validateRequiredFields(data: any, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Handles common database errors and provides meaningful messages
   * @param error - The database error
   * @param context - Additional context for the error
   * @throws Error with user-friendly message
   */
  protected handleDatabaseError(error: any, context: string = 'Database operation'): never {
    if (error.code === 'P2002') {
      throw new Error(`${context} failed: Duplicate entry`);
    }
    
    if (error.code === 'P2025') {
      throw new Error(`${context} failed: Record not found`);
    }

    if (error.code === 'P2003') {
      throw new Error(`${context} failed: Foreign key constraint violation`);
    }

    // Log the original error for debugging
    console.error(`Database error in ${context}:`, error);
    throw new Error(`${context} failed: ${error.message || 'Unknown database error'}`);
  }

  /**
   * Creates a standardized success response
   * @param data - The response data
   * @param message - Optional success message
   */
  protected createSuccessResponse<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creates a standardized error response
   * @param error - The error message or Error object
   * @param code - Optional error code
   */
  protected createErrorResponse(error: string | Error, code?: string) {
    const message = error instanceof Error ? error.message : error;
    
    return {
      success: false,
      error: {
        message,
        code,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Abstract method that must be implemented by all services
   * for cleanup operations
   */
  abstract cleanup?(): Promise<void>;
}
