import { PrismaClient } from "@prisma/client";
import { AssignmentServiceFactory, UnifiedAssignmentService } from "../oop/AssignmentServiceFactory";
import { ManualAssignmentService } from "../oop/ManualAssignmentService";
import { CanvasAssignmentService } from "../oop/CanvasAssignmentService";
import { ICompleteAssignmentService } from "../interfaces/IAssignmentService";

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
      ...Array.from(this.services.values())
        .filter(service => service.cleanup)
        .map(service => service.cleanup())
    ]);

    this.services.clear();
    this.assignmentServiceFactory = undefined;
    this.unifiedAssignmentService = undefined;
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
