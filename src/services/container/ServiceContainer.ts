import { PrismaClient } from "@prisma/client";
import { AssignmentServiceFactory, UnifiedAssignmentService } from "../oop/AssignmentServiceFactory";
import { ManualAssignmentService } from "../oop/ManualAssignmentService";
import { CanvasAssignmentService } from "../oop/CanvasAssignmentService";
import { ICompleteAssignmentService } from "../interfaces/IAssignmentService";
import { CourseServiceFactory } from "../oop/CourseServiceFactory";
import { ICompleteCourseService } from "../interfaces/ICourseService";
import { UserPreferenceService } from "../oop/UserPreferenceService";
import { AdminService } from "../oop/AdminService";
import { CanvasIntegrationService } from "../oop/CanvasIntegrationService";
import { EmailService } from "../oop/EmailService";
import { AnalyticsService } from "../oop/AnalyticsService";
import { ErrorLogService } from "../oop/ErrorLogService";
import { AuthenticationService } from "../oop/AuthenticationService";

/**
 * Dependency Injection Container for managing service instances
 * Implements Singleton and Factory patterns
 */
export class ServiceContainer {
  private static instance: ServiceContainer | null = null;
  private database: PrismaClient;
  
  // Service instances (lazy-loaded)
  private assignmentServiceFactory?: AssignmentServiceFactory;
  private unifiedAssignmentService?: ICompleteAssignmentService;
  private courseServiceFactory?: CourseServiceFactory;
  private unifiedCourseService?: ICompleteCourseService;
  private userPreferenceService?: UserPreferenceService;
  private adminService?: AdminService;
  private canvasIntegrationService?: CanvasIntegrationService;
  private emailService?: EmailService;
  private analyticsService?: AnalyticsService;
  private errorLogService?: ErrorLogService;
  private authenticationService?: AuthenticationService;
  private services: Map<string, any> = new Map();

  private constructor(database: PrismaClient) {
    this.database = database;
  }

  /**
   * Get singleton instance of the service container
   */
  static getInstance(database?: PrismaClient): ServiceContainer {
    if (!ServiceContainer.instance) {
      if (!database) {
        throw new Error('Database instance required for first initialization');
      }
      ServiceContainer.instance = new ServiceContainer(database);
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service instance
   */
  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * Get a registered service by name
   */
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not registered`);
    }
    return service;
  }

  /**
   * Get assignment service factory (lazy-loaded)
   */
  getAssignmentServiceFactory(): AssignmentServiceFactory {
    if (!this.assignmentServiceFactory) {
      this.assignmentServiceFactory = new AssignmentServiceFactory(this.database);
    }
    return this.assignmentServiceFactory;
  }

  /**
   * Get unified assignment service (lazy-loaded)
   * This is the main service most code should use
   */
  getAssignmentService(): ICompleteAssignmentService {
    if (!this.unifiedAssignmentService) {
      const factory = this.getAssignmentServiceFactory();
      this.unifiedAssignmentService = factory.getUnifiedService();
    }
    return this.unifiedAssignmentService;
  }

  /**
   * Get manual assignment service directly
   */
  getManualAssignmentService(): ManualAssignmentService {
    return this.getAssignmentServiceFactory().getServiceForSource('manual') as unknown as ManualAssignmentService;
  }

  /**
   * Get Canvas assignment service directly
   */
  getCanvasAssignmentService(): CanvasAssignmentService {
    return this.getAssignmentServiceFactory().getServiceForSource('canvas') as unknown as CanvasAssignmentService;
  }

  /**
   * Get course service factory (lazy-loaded)
   */
  getCourseServiceFactory(): CourseServiceFactory {
    if (!this.courseServiceFactory) {
      this.courseServiceFactory = new CourseServiceFactory(this.database);
    }
    return this.courseServiceFactory;
  }

  /**
   * Get unified course service (lazy-loaded)
   */
  getCourseService(): ICompleteCourseService {
    if (!this.unifiedCourseService) {
      const factory = this.getCourseServiceFactory();
      this.unifiedCourseService = factory.getUnifiedService();
    }
    return this.unifiedCourseService;
  }

  /**
   * Get user preference service (lazy-loaded)
   */
  getUserPreferenceService(): UserPreferenceService {
    if (!this.userPreferenceService) {
      this.userPreferenceService = new UserPreferenceService(this.database);
    }
    return this.userPreferenceService;
  }

  /**
   * Get admin service (lazy-loaded)
   */
  getAdminService(): AdminService {
    if (!this.adminService) {
      this.adminService = new AdminService(this.database);
    }
    return this.adminService;
  }

  /**
   * Get Canvas integration service (lazy-loaded)
   */
  getCanvasIntegrationService(): CanvasIntegrationService {
    if (!this.canvasIntegrationService) {
      this.canvasIntegrationService = new CanvasIntegrationService(this.database);
    }
    return this.canvasIntegrationService;
  }

  /**
   * Get email service (lazy-loaded)
   */
  getEmailService(): EmailService {
    if (!this.emailService) {
      this.emailService = new EmailService(this.database);
    }
    return this.emailService;
  }

  /**
   * Get analytics service (lazy-loaded)
   */
  getAnalyticsService(): AnalyticsService {
    if (!this.analyticsService) {
      this.analyticsService = new AnalyticsService(this.database);
    }
    return this.analyticsService;
  }

  /**
   * Get error log service (lazy-loaded)
   */
  getErrorLogService(): ErrorLogService {
    if (!this.errorLogService) {
      this.errorLogService = new ErrorLogService(this.database);
    }
    return this.errorLogService;
  }

  /**
   * Get authentication service (lazy-loaded)
   */
  getAuthenticationService(): AuthenticationService {
    if (!this.authenticationService) {
      this.authenticationService = new AuthenticationService(this.database);
    }
    return this.authenticationService;
  }

  /**
   * Create a scoped container for testing or isolated operations
   */
  createScope(database?: PrismaClient): ServiceContainer {
    return new ServiceContainer(database || this.database);
  }

  /**
   * Clean up all services and connections
   */
  async cleanup(): Promise<void> {
    await Promise.all([
      this.assignmentServiceFactory?.cleanup(),
      this.courseServiceFactory?.cleanup(),
      this.userPreferenceService?.cleanup(),
      this.adminService?.cleanup(),
      this.canvasIntegrationService?.cleanup(),
      this.emailService?.cleanup(),
      this.analyticsService?.cleanup(),
      this.errorLogService?.cleanup(),
      this.authenticationService?.cleanup(),
      ...Array.from(this.services.values())
        .filter(service => service.cleanup)
        .map(service => service.cleanup())
    ]);

    this.services.clear();
    this.assignmentServiceFactory = undefined;
    this.unifiedAssignmentService = undefined;
    this.courseServiceFactory = undefined;
    this.unifiedCourseService = undefined;
    this.userPreferenceService = undefined;
    this.adminService = undefined;
    this.canvasIntegrationService = undefined;
    this.emailService = undefined;
    this.analyticsService = undefined;
    this.errorLogService = undefined;
    this.authenticationService = undefined;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static reset(): void {
    if (ServiceContainer.instance) {
      ServiceContainer.instance.cleanup();
      ServiceContainer.instance = null;
    }
  }
}

/**
 * Convenience function to get the default service container instance
 */
export function getServiceContainer(database?: PrismaClient): ServiceContainer {
  return ServiceContainer.getInstance(database);
}

/**
 * Convenience function to get the main assignment service
 */
export function getAssignmentService(database?: PrismaClient): ICompleteAssignmentService {
  return getServiceContainer(database).getAssignmentService();
}

/**
 * Convenience function to get the main course service
 */
export function getCourseService(database?: PrismaClient): ICompleteCourseService {
  return getServiceContainer(database).getCourseService();
}

/**
 * Convenience function to get the user preference service
 */
export function getUserPreferenceService(database?: PrismaClient): UserPreferenceService {
  return getServiceContainer(database).getUserPreferenceService();
}

/**
 * Convenience function to get the admin service
 */
export function getAdminService(database?: PrismaClient): AdminService {
  return getServiceContainer(database).getAdminService();
}

/**
 * Convenience function to get the Canvas integration service
 */
export function getCanvasIntegrationService(database?: PrismaClient): CanvasIntegrationService {
  return getServiceContainer(database).getCanvasIntegrationService();
}

/**
 * Convenience function to get the email service
 */
export function getEmailService(database?: PrismaClient): EmailService {
  return getServiceContainer(database).getEmailService();
}

/**
 * Convenience function to get the analytics service
 */
export function getAnalyticsService(database?: PrismaClient): AnalyticsService {
  return getServiceContainer(database).getAnalyticsService();
}

/**
 * Convenience function to get the error log service
 */
export function getErrorLogService(database?: PrismaClient): ErrorLogService {
  return getServiceContainer(database).getErrorLogService();
}

/**
 * Convenience function to get the authentication service
 */
export function getAuthenticationService(database?: PrismaClient): AuthenticationService {
  return getServiceContainer(database).getAuthenticationService();
}
