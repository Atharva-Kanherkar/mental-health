/**
 * Cache Service - In-memory caching for insights
 * Reduces AI costs and improves response times
 * Implements TTL (time-to-live) for cache invalidation
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: Date;
  createdAt: Date;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private readonly defaultTTL = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor() {
    this.cache = new Map();
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL;
    const expiresAt = new Date(Date.now() + ttl);

    this.cache.set(key, {
      data: value,
      expiresAt,
      createdAt: new Date()
    });
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all cache entries for a user
   */
  deleteByUserId(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`user:${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Check if cache contains key
   */
  has(key: string): boolean {
    const value = this.get(key);
    return value !== null;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    oldestEntry: Date | null;
  } {
    const entries = Array.from(this.cache.values());

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: entries.length > 0
        ? entries.reduce((oldest, entry) =>
            entry.createdAt < oldest ? entry.createdAt : oldest,
            entries[0].createdAt
          )
        : null
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Generate cache key for insights
   */
  static generateKey(userId: string, type: string, params?: Record<string, any>): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `user:${userId}:${type}:${paramsStr}`;
  }
}

// TTL constants for different insight types
export const CACHE_TTL = {
  WEEKLY_INSIGHTS: 24 * 60 * 60 * 1000,    // 24 hours
  PATTERNS: 60 * 60 * 1000,                 // 1 hour
  CORRELATIONS: 60 * 60 * 1000,             // 1 hour
  PREDICTIONS: 6 * 60 * 60 * 1000,          // 6 hours
  WARNINGS: 30 * 60 * 1000,                 // 30 minutes
  PROGRESS: 60 * 60 * 1000                  // 1 hour
};

export const cacheService = new CacheService();
