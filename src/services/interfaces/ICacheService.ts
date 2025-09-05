/**
 * Cache Service Interface
 * Defines contract for caching operations
 */
export interface ICacheService {
  /**
   * Check if cache is available
   */
  isAvailable(): boolean;

  /**
   * Get cached value
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set cached value with TTL
   */
  set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;

  /**
   * Delete cached value
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple values by pattern
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Get or set with fetcher function
   */
  getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T>;

  /**
   * Cache user assignments
   */
  cacheUserAssignments(userId: string, assignments: any[], ttlSeconds?: number): Promise<void>;

  /**
   * Get cached user assignments
   */
  getUserAssignments(userId: string): Promise<any[] | null>;

  /**
   * Cache user courses
   */
  cacheUserCourses(userId: string, courses: any[], ttlSeconds?: number): Promise<void>;

  /**
   * Get cached user courses
   */
  getUserCourses(userId: string): Promise<any[] | null>;

  /**
   * Invalidate user cache
   */
  invalidateUserCache(userId: string): Promise<void>;

  /**
   * Cache dashboard stats
   */
  cacheDashboardStats(userId: string, stats: any, ttlSeconds?: number): Promise<void>;

  /**
   * Get cached dashboard stats
   */
  getDashboardStats(userId: string): Promise<any | null>;

  /**
   * Health check
   */
  ping(): Promise<boolean>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<any>;
}
