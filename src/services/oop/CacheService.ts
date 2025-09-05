import { Redis } from "@upstash/redis";
import { BaseService } from "../base/BaseService";
import { ICacheService } from "../interfaces/ICacheService";

/**
 * Redis-based caching service for performance optimization
 * Provides centralized caching with TTL support and cache invalidation
 */
export class CacheService extends BaseService implements ICacheService {
  private redis: Redis | null = null;
  private readonly defaultTTL = 300; // 5 minutes
  private readonly longTTL = 3600; // 1 hour
  private readonly shortTTL = 60; // 1 minute

  constructor(database: any) {
    super(database);
    this.initializeRedis();
  }

  private initializeRedis() {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.redis !== null;
  }

  /**
   * Get cached value with JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);
      if (value === null) return null;

      // Handle both string and object values
      if (typeof value === 'string') {
        return JSON.parse(value) as T;
      }
      return value as T;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with JSON serialization
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      const ttl = ttlSeconds ?? this.defaultTTL;

      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple cached values by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      // Redis doesn't have native pattern deletion in Upstash
      // We'll use a simple approach for common patterns
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.warn(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(pairs: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const ttl = ttlSeconds ?? this.defaultTTL;
      const pipeline = this.redis.pipeline();

      for (const [key, value] of Object.entries(pairs)) {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        pipeline.setex(key, ttl, serializedValue);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.warn(`Cache mset error:`, error);
      return false;
    }
  }

  /**
   * Get or set cache with function
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    await this.set(key, data, ttlSeconds);

    return data;
  }

  /**
   * Cache user-specific data
   */
  getUserKey(userId: string, resource: string, ...params: string[]): string {
    return `user:${userId}:${resource}:${params.join(':')}`;
  }

  /**
   * Cache assignments for a user
   */
  async cacheUserAssignments(userId: string, assignments: any[], ttlSeconds?: number): Promise<void> {
    const key = this.getUserKey(userId, 'assignments');
    await this.set(key, assignments, ttlSeconds ?? this.defaultTTL);
  }

  /**
   * Get cached assignments for a user
   */
  async getUserAssignments(userId: string): Promise<any[] | null> {
    const key = this.getUserKey(userId, 'assignments');
    return await this.get<any[]>(key);
  }

  /**
   * Cache courses for a user
   */
  async cacheUserCourses(userId: string, courses: any[], ttlSeconds?: number): Promise<void> {
    const key = this.getUserKey(userId, 'courses');
    await this.set(key, courses, ttlSeconds ?? this.longTTL); // Courses change less frequently
  }

  /**
   * Get cached courses for a user
   */
  async getUserCourses(userId: string): Promise<any[] | null> {
    const key = this.getUserKey(userId, 'courses');
    return await this.get<any[]>(key);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}:*`,
    ];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }

  /**
   * Cache dashboard stats
   */
  async cacheDashboardStats(userId: string, stats: any, ttlSeconds?: number): Promise<void> {
    const key = this.getUserKey(userId, 'dashboard', 'stats');
    await this.set(key, stats, ttlSeconds ?? this.shortTTL); // Dashboard stats change frequently
  }

  /**
   * Get cached dashboard stats
   */
  async getDashboardStats(userId: string): Promise<any | null> {
    const key = this.getUserKey(userId, 'dashboard', 'stats');
    return await this.get<any>(key);
  }

  /**
   * Health check for Redis connection
   */
  async ping(): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    if (!this.redis) return { available: false };

    try {
      // Basic stats - Upstash Redis has limited introspection
      const ping = await this.ping();
      return {
        available: true,
        connected: ping,
        type: 'upstash-redis'
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cleanup method required by BaseService
   */
  async cleanup(): Promise<void> {
    // Upstash Redis doesn't require explicit connection cleanup
    // but we implement this to satisfy the abstract method requirement
    return Promise.resolve();
  }
}
