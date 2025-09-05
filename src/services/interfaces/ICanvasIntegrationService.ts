import { CanvasAssignment, CanvasCourse } from "./ICanvasTypes";

/**
 * Canvas Integration Service Interface
 * Defines contract for Canvas API interactions and token management
 */
export interface ICanvasIntegrationService {
  fetchCanvas<T>(path: string, accessToken: string, query?: Record<string, string | number | boolean | undefined>): Promise<T>;
  getCourses(accessToken: string): Promise<CanvasCourse[]>;
  getAssignments(accessToken: string, courseId?: string): Promise<CanvasAssignment[]>;
  validateToken(accessToken: string): Promise<boolean>;
  storeEncryptedToken(userId: string, token: string): Promise<void>;
  getDecryptedToken(userId: string): Promise<string | null>;
  removeToken(userId: string): Promise<void>;
  // Additional methods for legacy compatibility
  listCanvasAssignments(userId: string, courseId: string): Promise<any[]>;
  getSubmissionForSelf(userId: string, courseId: string, assignmentId: string): Promise<any>;
  listCanvasCourses(userId: string): Promise<any[]>;
  upsertCanvasAccount(userId: string, data: { access_token: string }): Promise<void>;
  deleteCanvasAccount(userId: string): Promise<void>;
  syncUser(userId: string): Promise<any>;
  canvasAdminInterface: {
    syncAllUsers(): Promise<any>;
  };
}
