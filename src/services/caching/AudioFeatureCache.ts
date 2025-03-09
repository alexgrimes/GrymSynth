import { Logger } from "../../utils/logger";

/**
 * Configuration for the AudioFeatureCache
 */
export interface AudioFeatureCacheConfig {
  /** Maximum number of entries to store in the cache */
  maxEntries?: number;

  /** Time-to-live for cache entries in milliseconds */
  ttl?: number;

  /** Whether to enable cache warming */
  enableWarming?: boolean;

  /** Logging configuration */
  logConfig?: {
    /** Whether to log detailed cache operations */
    verbose?: boolean;
    /** Whether to log cache warnings */
    logWarnings?: boolean;
  };

  /** Analytics configuration */
  analyticsConfig?: {
    /** Whether to track detailed analytics */
    enabled?: boolean;
    /** Maximum number of analytics entries to store */
    maxEntries?: number;
  };
}

/**
 * Cache entry for audio feature vectors
 */
export interface CacheEntry<T> {
  /** The cached data */
  data: T;
  /** When the entry was created */
  createdAt: number;
  /** When the entry was last accessed */
  lastAccessed: number;
  /** Number of times this entry has been accessed */
  accessCount: number;
  /** Size of the data in bytes (approximate) */
  sizeBytes: number;
  /** Metadata for the cache entry */
  metadata?: Record<string, any>;
}

/**
 * Cache analytics data
 */
export interface CacheAnalytics {
  /** Total number of cache hits */
  hits: number;
  /** Total number of cache misses */
  misses: number;
  /** Hit rate (0-1) */
  hitRate: number;
  /** Average access time in milliseconds */
  avgAccessTime: number;
  /** Total size of cached data in bytes */
  totalSize: number;
  /** Number of entries in the cache */
  entryCount: number;
  /** Number of entries evicted from the cache */
  evictionCount: number;
  /** Detailed analytics by key pattern (if enabled) */
  keyPatternStats?: Record<string, {
    hits: number;
    misses: number;
    hitRate: number;
  }>;
  /** Performance impact estimate (time saved in ms) */
  estimatedTimeSaved: number;
}

/**
 * Cache invalidation strategy
 */
export enum InvalidationStrategy {
  /** Invalidate entries after a fixed time */
  TTL = 'ttl',
  /** Invalidate least recently used entries when cache is full */
  LRU = 'lru',
  /** Invalidate least frequently used entries when cache is full */
  LFU = 'lfu',
  /** Invalidate entries based on a custom function */
  CUSTOM = 'custom'
}

/**
 * Options for cache operations
 */
export interface CacheOptions {
  /** Time-to-live for this specific entry (overrides default) */
  ttl?: number;
  /** Priority for this entry (higher = more important) */
  priority?: number;
  /** Custom metadata for this entry */
  metadata?: Record<string, any>;
  /** Whether to refresh the TTL on access */
  refreshTTL?: boolean;
  /** Custom invalidation strategy for this entry */
  invalidationStrategy?: InvalidationStrategy;
}

/**
 * Pattern matching options for finding similar cache entries
 */
export interface PatternMatchOptions {
  /** Similarity threshold (0-1) */
  threshold?: number;
  /** Maximum number of results to return */
  maxResults?: number;
  /** Whether to update lastAccessed time for matched entries */
  updateAccess?: boolean;
}

/**
 * LRU cache implementation for audio feature vectors
 */
export class AudioFeatureCache {
  private cache: Map<string, CacheEntry<Float32Array>>;
  private logger: Logger;
  private maxEntries: number;
  private ttl: number;
  private enableWarming: boolean;
  private verbose: boolean;
  private logWarnings: boolean;
  private trackAnalytics: boolean;
  private maxAnalyticsEntries: number;

  // Analytics data
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;
  private accessTimes: number[] = [];
  private keyPatternStats: Map<string, { hits: number; misses: number }> = new Map();
  private analyticsHistory: CacheAnalytics[] = [];

  // Cache warming data
  private warmingPatterns: Set<string> = new Set();
  private warmingInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new AudioFeatureCache
   * @param config Configuration for the cache
   */
  constructor(config: AudioFeatureCacheConfig = {}) {
    this.cache = new Map();
    this.logger = new Logger({ namespace: "audio-feature-cache" });

    this.maxEntries = config.maxEntries || 1000;
    this.ttl = config.ttl || 3600000; // Default: 1 hour
    this.enableWarming = config.enableWarming || false;
    this.verbose = config.logConfig?.verbose || false;
    this.logWarnings = config.logConfig?.logWarnings !== false;
    this.trackAnalytics = config.analyticsConfig?.enabled !== false;
    this.maxAnalyticsEntries = config.analyticsConfig?.maxEntries || 100;

    this.logger.info("AudioFeatureCache initialized", {
      maxEntries: this.maxEntries,
      ttl: this.ttl,
      enableWarming: this.enableWarming
    });

    // Start cache warming if enabled
    if (this.enableWarming) {
      this.startCacheWarming();
    }

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Gets a feature vector from the cache
   * @param key Cache key
   * @param options Cache options
   * @returns The cached feature vector or undefined if not found
   */
  public get(key: string, options: CacheOptions = {}): Float32Array | undefined {
    const startTime = performance.now();

    // Check if key exists in cache
    const entry = this.cache.get(key);

    if (!entry) {
      this.recordMiss(key);
      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    const entryTtl = options.ttl || this.ttl;
    if (now - entry.createdAt > entryTtl) {
      // Entry has expired
      this.cache.delete(key);
      this.recordMiss(key);

      if (this.verbose) {
        this.logger.debug(`Cache entry expired: ${key}`, {
          age: now - entry.createdAt,
          ttl: entryTtl
        });
      }

      return undefined;
    }

    // Update access information
    entry.lastAccessed = now;
    entry.accessCount++;

    // Refresh TTL if requested
    if (options.refreshTTL) {
      entry.createdAt = now;
    }

    // Record hit
    this.recordHit(key, performance.now() - startTime);

    // Add to warming patterns
    if (this.enableWarming) {
      this.warmingPatterns.add(key);
    }

    return entry.data;
  }

  /**
   * Sets a feature vector in the cache
   * @param key Cache key
   * @param data Feature vector to cache
   * @param options Cache options
   * @returns Whether the operation was successful
   */
  public set(key: string, data: Float32Array, options: CacheOptions = {}): boolean {
    // Check if we need to evict entries
    if (this.cache.size >= this.maxEntries) {
      this.evictEntries();
    }

    const now = Date.now();

    // Calculate approximate size in bytes
    const sizeBytes = data.length * Float32Array.BYTES_PER_ELEMENT;

    // Create cache entry
    const entry: CacheEntry<Float32Array> = {
      data,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      sizeBytes,
      metadata: options.metadata
    };

    // Store in cache
    this.cache.set(key, entry);

    if (this.verbose) {
      this.logger.debug(`Cache entry set: ${key}`, {
        size: this.formatBytes(sizeBytes),
        ttl: options.ttl || this.ttl
      });
    }

    return true;
  }

  /**
   * Checks if a key exists in the cache
   * @param key Cache key
   * @returns Whether the key exists and is not expired
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.createdAt > this.ttl) {
      // Entry has expired
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Deletes a key from the cache
   * @param key Cache key
   * @returns Whether the key was deleted
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache
   */
  public clear(): void {
    this.cache.clear();
    this.logger.info("Cache cleared");
  }

  /**
   * Gets the number of entries in the cache
   * @returns Number of cache entries
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Gets all keys in the cache
   * @returns Array of cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Finds similar feature vectors in the cache
   * @param features Feature vector to compare against
   * @param options Pattern matching options
   * @returns Array of matches with similarity scores
   */
  public findSimilar(features: Float32Array, options: PatternMatchOptions = {}): Array<{
    key: string;
    data: Float32Array;
    similarity: number;
    metadata?: Record<string, any>;
  }> {
    const threshold = options.threshold || 0.8;
    const maxResults = options.maxResults || 5;
    const updateAccess = options.updateAccess !== false;

    const startTime = performance.now();
    const results: Array<{
      key: string;
      data: Float32Array;
      similarity: number;
      metadata?: Record<string, any>;
    }> = [];

    // Calculate similarity for each entry
    for (const [key, entry] of this.cache.entries()) {
      // Skip expired entries
      if (Date.now() - entry.createdAt > this.ttl) {
        continue;
      }

      // Calculate cosine similarity
      const similarity = this.calculateCosineSimilarity(features, entry.data);

      // If similarity is above threshold, add to results
      if (similarity >= threshold) {
        results.push({
          key,
          data: entry.data,
          similarity,
          metadata: entry.metadata
        });

        // Update access time if requested
        if (updateAccess) {
          entry.lastAccessed = Date.now();
          entry.accessCount++;
        }
      }
    }

    // Sort by similarity (highest first) and limit results
    const sortedResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);

    if (this.verbose) {
      this.logger.debug(`Found ${sortedResults.length} similar patterns`, {
        threshold,
        searchTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });
    }

    return sortedResults;
  }

  /**
   * Calculates cosine similarity between two feature vectors
   * @param a First feature vector
   * @param b Second feature vector
   * @returns Similarity score (0-1)
   */
  private calculateCosineSimilarity(a: Float32Array, b: Float32Array): number {
    // If vectors are different lengths, use the shorter one
    const length = Math.min(a.length, b.length);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    // Avoid division by zero
    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Invalidates cache entries based on a pattern
   * @param pattern Regular expression pattern to match keys
   * @returns Number of entries invalidated
   */
  public invalidatePattern(pattern: RegExp): number {
    let count = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0 && this.logWarnings) {
      this.logger.info(`Invalidated ${count} entries matching pattern: ${pattern}`);
    }

    return count;
  }

  /**
   * Invalidates cache entries based on a custom function
   * @param predicate Function that returns true for entries to invalidate
   * @returns Number of entries invalidated
   */
  public invalidateIf(predicate: (entry: CacheEntry<Float32Array>, key: string) => boolean): number {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (predicate(entry, key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0 && this.logWarnings) {
      this.logger.info(`Invalidated ${count} entries using custom predicate`);
    }

    return count;
  }

  /**
   * Evicts entries from the cache based on LRU strategy
   * @param count Number of entries to evict (default: 1)
   * @returns Number of entries evicted
   */
  private evictEntries(count: number = 1): number {
    if (this.cache.size === 0) {
      return 0;
    }

    // Sort entries by last accessed time (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // Evict the specified number of entries
    let evicted = 0;
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      evicted++;
    }

    this.evictions += evicted;

    if (evicted > 0 && this.verbose) {
      this.logger.debug(`Evicted ${evicted} entries from cache`);
    }

    return evicted;
  }

  /**
   * Records a cache hit
   * @param key Cache key
   * @param accessTime Time taken to access the cache
   */
  private recordHit(key: string, accessTime: number): void {
    if (!this.trackAnalytics) {
      return;
    }

    this.hits++;
    this.accessTimes.push(accessTime);

    // Trim access times if needed
    if (this.accessTimes.length > 1000) {
      this.accessTimes.shift();
    }

    // Record key pattern stats
    const pattern = this.getKeyPattern(key);
    const stats = this.keyPatternStats.get(pattern) || { hits: 0, misses: 0 };
    stats.hits++;
    this.keyPatternStats.set(pattern, stats);
  }

  /**
   * Records a cache miss
   * @param key Cache key
   */
  private recordMiss(key: string): void {
    if (!this.trackAnalytics) {
      return;
    }

    this.misses++;

    // Record key pattern stats
    const pattern = this.getKeyPattern(key);
    const stats = this.keyPatternStats.get(pattern) || { hits: 0, misses: 0 };
    stats.misses++;
    this.keyPatternStats.set(pattern, stats);
  }

  /**
   * Extracts a pattern from a cache key
   * @param key Cache key
   * @returns Key pattern
   */
  private getKeyPattern(key: string): string {
    // Extract a pattern from the key
    // This is a simple implementation that uses the prefix up to the first delimiter
    const match = key.match(/^([^:]+):/);
    return match ? match[1] : 'default';
  }

  /**
   * Starts periodic cleanup of expired entries
   */
  private startPeriodicCleanup(): void {
    // Run cleanup every minute
    setInterval(() => {
      this.cleanupExpiredEntries();

      // Collect analytics if tracking is enabled
      if (this.trackAnalytics) {
        this.collectAnalytics();
      }
    }, 60000);
  }

  /**
   * Cleans up expired cache entries
   * @returns Number of entries removed
   */
  private cleanupExpiredEntries(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0 && this.verbose) {
      this.logger.debug(`Cleaned up ${removed} expired entries`);
    }

    return removed;
  }

  /**
   * Collects cache analytics
   */
  private collectAnalytics(): void {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    // Calculate average access time
    const avgAccessTime = this.accessTimes.length > 0
      ? this.accessTimes.reduce((sum, time) => sum + time, 0) / this.accessTimes.length
      : 0;

    // Calculate total cache size
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.sizeBytes;
    }

    // Calculate key pattern stats
    const keyPatternStats: Record<string, { hits: number; misses: number; hitRate: number }> = {};
    for (const [pattern, stats] of this.keyPatternStats.entries()) {
      const patternTotal = stats.hits + stats.misses;
      keyPatternStats[pattern] = {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: patternTotal > 0 ? stats.hits / patternTotal : 0
      };
    }

    // Estimate time saved (assuming cache misses take 10x longer than hits)
    const estimatedTimeSaved = this.hits * avgAccessTime * 9; // (10x - 1x) * hits

    // Create analytics entry
    const analytics: CacheAnalytics = {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      avgAccessTime,
      totalSize,
      entryCount: this.cache.size,
      evictionCount: this.evictions,
      keyPatternStats,
      estimatedTimeSaved
    };

    // Add to history
    this.analyticsHistory.push(analytics);

    // Trim history if needed
    if (this.analyticsHistory.length > this.maxAnalyticsEntries) {
      this.analyticsHistory.shift();
    }
  }

  /**
   * Gets cache analytics
   * @returns Cache analytics data
   */
  public getAnalytics(): CacheAnalytics {
    // If we have analytics history, return the latest entry
    if (this.analyticsHistory.length > 0) {
      return this.analyticsHistory[this.analyticsHistory.length - 1];
    }

    // Otherwise, collect and return current analytics
    this.collectAnalytics();
    return this.analyticsHistory[this.analyticsHistory.length - 1];
  }

  /**
   * Gets cache analytics history
   * @returns Array of cache analytics data points
   */
  public getAnalyticsHistory(): CacheAnalytics[] {
    return [...this.analyticsHistory];
  }

  /**
   * Starts cache warming
   */
  private startCacheWarming(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }

    // Run warming every 5 minutes
    this.warmingInterval = setInterval(() => {
      this.warmCache();
    }, 300000);

    this.logger.info("Cache warming started");
  }

  /**
   * Stops cache warming
   */
  public stopCacheWarming(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
      this.logger.info("Cache warming stopped");
    }
  }

  /**
   * Warms the cache by pre-fetching frequently accessed patterns
   */
  private warmCache(): void {
    if (this.warmingPatterns.size === 0) {
      return;
    }

    if (this.verbose) {
      this.logger.debug(`Warming cache with ${this.warmingPatterns.size} patterns`);
    }

    // In a real implementation, this would pre-fetch data for these patterns
    // For now, we just log that warming would happen
    if (this.verbose) {
      this.logger.debug("Cache warming complete");
    }
  }

  /**
   * Formats bytes into a human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Disposes the cache and releases all resources
   */
  public dispose(): void {
    // Stop cache warming
    this.stopCacheWarming();

    // Clear the cache
    this.cache.clear();

    this.logger.info("AudioFeatureCache disposed");
  }
}
