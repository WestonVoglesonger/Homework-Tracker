/**
 * Generic repository interface following Repository Pattern
 * Provides common CRUD operations for all entities
 */
export interface IRepository<T, CreateInput, UpdateInput> {
  /**
   * Find an entity by ID for a specific user
   * @param userId - ID of the user
   * @param id - ID of the entity
   * @returns Promise resolving to entity or null if not found
   */
  findById(userId: string, id: string): Promise<T | null>;

  /**
   * Find multiple entities with optional filtering
   * @param userId - ID of the user
   * @param filters - Optional filters to apply
   * @returns Promise resolving to array of entities
   */
  findMany(userId: string, filters?: any): Promise<T[]>;

  /**
   * Create a new entity
   * @param userId - ID of the user creating the entity
   * @param input - Data for creating the entity
   * @returns Promise resolving to created entity
   */
  create(userId: string, input: CreateInput): Promise<T>;

  /**
   * Update an existing entity
   * @param userId - ID of the user updating the entity
   * @param id - ID of the entity to update
   * @param input - Data for updating the entity
   * @returns Promise resolving to updated entity
   */
  update(userId: string, id: string, input: UpdateInput): Promise<T>;

  /**
   * Delete an entity
   * @param userId - ID of the user deleting the entity
   * @param id - ID of the entity to delete
   * @returns Promise resolving to deletion confirmation
   */
  delete(userId: string, id: string): Promise<{ success: true }>;
}

/**
 * Extended repository interface for entities with Canvas integration
 */
export interface ICanvasRepository<T, CreateInput, UpdateInput> 
  extends IRepository<T, CreateInput, UpdateInput> {
  
  /**
   * Find an entity by Canvas ID for a specific user
   * @param userId - ID of the user
   * @param canvasId - Canvas ID of the entity
   * @returns Promise resolving to entity or null if not found
   */
  findByCanvasId(userId: string, canvasId: string): Promise<T | null>;

  /**
   * Bulk create or update entities from Canvas data
   * @param userId - ID of the user
   * @param canvasData - Array of Canvas entities
   * @returns Promise resolving to sync results
   */
  bulkUpsertFromCanvas(userId: string, canvasData: any[]): Promise<{
    created: number;
    updated: number;
    errors: any[];
  }>;
}
