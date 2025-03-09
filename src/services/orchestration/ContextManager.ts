import { ContextItem, ContextQuery, ModelContextMetadata } from "../../services/types";
import { ContextFilter } from "../../context/types";
import { Logger } from "../../utils/logger";
import { ContextManager as BaseContextManager } from "../../context/context-manager";

/**
 * Interface for context transformation options
 */
export interface ContextTransformOptions {
  sourceModelType: string;
  targetModelType: string;
  preserveKeys?: string[];
  filterKeys?: string[];
  transformations?: Record<string, (value: any) => any>;
}

/**
 * Interface for context cache configuration
 */
export interface ContextCacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  pruneInterval: number; // Interval for automatic pruning in milliseconds
}

/**
 * Interface for a cached context item
 */
interface CachedContextItem {
  context: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Approximate size in bytes
}

/**
 * Enhanced ContextManager for optimizing context sharing between models
 */
export class ContextManager {
  private logger: Logger;
  private baseContextManager: BaseContextManager;
  private contextCache: Map<string, CachedContextItem> = new Map();
  private cacheConfig: ContextCacheConfig;
  private pruneTimer: NodeJS.Timeout | null = null;
  private totalCacheSize: number = 0;
  private modelContextTransformers: Map<string, Map<string, (context: any) => any>> = new Map();
  private contextSizeEstimator: (context: any) => number;

  constructor(
    baseContextManager: BaseContextManager,
    cacheConfig: Partial<ContextCacheConfig> = {}
  ) {
    this.baseContextManager = baseContextManager;
    this.logger = new Logger({ namespace: "context-manager" });

    // Set default cache configuration
    this.cacheConfig = {
      maxSize: cacheConfig.maxSize || 100 * 1024 * 1024, // 100MB default
      ttl: cacheConfig.ttl || 30 * 60 * 1000, // 30 minutes default
      pruneInterval: cacheConfig.pruneInterval || 5 * 60 * 1000 // 5 minutes default
    };

    // Initialize context size estimator
    this.contextSizeEstimator = this.createContextSizeEstimator();

    // Start automatic pruning
    this.startAutomaticPruning();
  }

  /**
   * Store context in the base context manager
   */
  async storeContext(content: any): Promise<ContextItem> {
    const result = await this.baseContextManager.storeContext(content);

    // Invalidate cache entries that might depend on this context
    this.invalidateRelatedCacheEntries(content);

    return result;
  }

  /**
   * Get context for a specific model with caching
   */
  async getContextForModel(
    modelType: string,
    filter?: ContextFilter
  ): Promise<any> {
    // Generate cache key based on model type and filter
    const cacheKey = this.generateCacheKey(modelType, filter);

    // Check if context is in cache
    if (this.contextCache.has(cacheKey)) {
      const cachedItem = this.contextCache.get(cacheKey)!;

      // Check if cached item is still valid
      if (Date.now() - cachedItem.timestamp < this.cacheConfig.ttl) {
        // Update access statistics
        cachedItem.accessCount++;
        cachedItem.lastAccessed = Date.now();

        this.logger.debug(`Cache hit for model ${modelType}`, {
          cacheKey,
          accessCount: cachedItem.accessCount
        });

        return cachedItem.context;
      } else {
        // Remove expired item from cache
        this.removeFromCache(cacheKey);
      }
    }

    // Get context from base context manager
    const context = await this.baseContextManager.getContextForModel(modelType, filter);

    if (context) {
      // Store in cache
      this.addToCache(cacheKey, context);
    }

    return context;
  }

  /**
   * Get transformed context for a target model based on source model context
   */
  async getTransformedContext(
    sourceModelType: string,
    targetModelType: string,
    sourceContext: any
  ): Promise<any> {
    // Generate cache key for transformed context
    const cacheKey = `transform:${sourceModelType}:${targetModelType}:${this.hashContext(sourceContext)}`;

    // Check if transformed context is in cache
    if (this.contextCache.has(cacheKey)) {
      const cachedItem = this.contextCache.get(cacheKey)!;

      // Check if cached item is still valid
      if (Date.now() - cachedItem.timestamp < this.cacheConfig.ttl) {
        // Update access statistics
        cachedItem.accessCount++;
        cachedItem.lastAccessed = Date.now();

        this.logger.debug(`Cache hit for transformed context ${sourceModelType} -> ${targetModelType}`, {
          cacheKey,
          accessCount: cachedItem.accessCount
        });

        return cachedItem.context;
      } else {
        // Remove expired item from cache
        this.removeFromCache(cacheKey);
      }
    }

    // Get transformer for this model pair
    const transformer = this.getContextTransformer(sourceModelType, targetModelType);

    if (!transformer) {
      this.logger.warn(`No transformer found for ${sourceModelType} -> ${targetModelType}, using source context`);
      return sourceContext;
    }

    // Transform context
    const transformedContext = transformer(sourceContext);

    // Store in cache
    this.addToCache(cacheKey, transformedContext);

    return transformedContext;
  }

  /**
   * Register a context transformer for a specific model pair
   */
  registerContextTransformer(
    sourceModelType: string,
    targetModelType: string,
    transformer: (context: any) => any
  ): void {
    if (!this.modelContextTransformers.has(sourceModelType)) {
      this.modelContextTransformers.set(sourceModelType, new Map());
    }

    this.modelContextTransformers.get(sourceModelType)!.set(targetModelType, transformer);

    this.logger.info(`Registered context transformer for ${sourceModelType} -> ${targetModelType}`);
  }

  /**
   * Create a context transformer based on transformation options
   */
  createTransformer(options: ContextTransformOptions): (context: any) => any {
    return (sourceContext: any) => {
      if (!sourceContext) {
        return null;
      }

      // Start with a deep copy of the source context
      let targetContext = JSON.parse(JSON.stringify(sourceContext));

      // Apply key filtering if specified
      if (options.filterKeys && options.filterKeys.length > 0) {
        const filteredContext: Record<string, any> = {};

        // Only include keys that are not in the filter list
        for (const key of Object.keys(targetContext)) {
          if (!options.filterKeys.includes(key)) {
            filteredContext[key] = targetContext[key];
          }
        }

        targetContext = filteredContext;
      }

      // Apply key preservation if specified
      if (options.preserveKeys && options.preserveKeys.length > 0) {
        const preservedContext: Record<string, any> = {};

        // Only include keys that are in the preserve list
        for (const key of options.preserveKeys) {
          if (key in targetContext) {
            preservedContext[key] = targetContext[key];
          }
        }

        targetContext = preservedContext;
      }

      // Apply custom transformations if specified
      if (options.transformations) {
        for (const [key, transform] of Object.entries(options.transformations)) {
          if (key in targetContext) {
            targetContext[key] = transform(targetContext[key]);
          }
        }
      }

      // Add metadata about the transformation
      targetContext._transformationMetadata = {
        sourceModelType: options.sourceModelType,
        targetModelType: options.targetModelType,
        transformedAt: new Date().toISOString()
      };

      return targetContext;
    };
  }

  /**
   * Get a context transformer for a specific model pair
   */
  private getContextTransformer(
    sourceModelType: string,
    targetModelType: string
  ): ((context: any) => any) | null {
    // Check if we have a direct transformer
    if (
      this.modelContextTransformers.has(sourceModelType) &&
      this.modelContextTransformers.get(sourceModelType)!.has(targetModelType)
    ) {
      return this.modelContextTransformers.get(sourceModelType)!.get(targetModelType)!;
    }

    // Check if we have a generic transformer for the target model
    if (
      this.modelContextTransformers.has('*') &&
      this.modelContextTransformers.get('*')!.has(targetModelType)
    ) {
      return this.modelContextTransformers.get('*')!.get(targetModelType)!;
    }

    // Check if we have a generic transformer for any target model
    if (
      this.modelContextTransformers.has(sourceModelType) &&
      this.modelContextTransformers.get(sourceModelType)!.has('*')
    ) {
      return this.modelContextTransformers.get(sourceModelType)!.get('*')!;
    }

    // No transformer found
    return null;
  }

  /**
   * Generate a cache key based on model type and filter
   */
  private generateCacheKey(modelType: string, filter?: ContextFilter): string {
    if (!filter) {
      return `model:${modelType}`;
    }

    // Create a stable representation of the filter
    const filterStr = JSON.stringify(filter, Object.keys(filter).sort());

    return `model:${modelType}:filter:${filterStr}`;
  }

  /**
   * Add an item to the context cache
   */
  private addToCache(key: string, context: any): void {
    // Estimate the size of the context
    const size = this.contextSizeEstimator(context);

    // Check if adding this item would exceed the cache size limit
    if (this.totalCacheSize + size > this.cacheConfig.maxSize) {
      // Prune cache to make room
      this.pruneCache(size);
    }

    // Add to cache
    const cachedItem: CachedContextItem = {
      context,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size
    };

    this.contextCache.set(key, cachedItem);
    this.totalCacheSize += size;

    this.logger.debug(`Added item to cache`, {
      key,
      size,
      totalCacheSize: this.totalCacheSize
    });
  }

  /**
   * Remove an item from the context cache
   */
  private removeFromCache(key: string): void {
    if (this.contextCache.has(key)) {
      const cachedItem = this.contextCache.get(key)!;
      this.totalCacheSize -= cachedItem.size;
      this.contextCache.delete(key);

      this.logger.debug(`Removed item from cache`, {
        key,
        size: cachedItem.size,
        totalCacheSize: this.totalCacheSize
      });
    }
  }

  /**
   * Prune the cache to make room for new items
   */
  private pruneCache(requiredSpace: number = 0): void {
    if (this.contextCache.size === 0) {
      return;
    }

    this.logger.info(`Pruning cache to free up ${requiredSpace} bytes`, {
      currentSize: this.totalCacheSize,
      maxSize: this.cacheConfig.maxSize,
      itemCount: this.contextCache.size
    });

    // Convert cache to array for sorting
    const cacheItems = Array.from(this.contextCache.entries());

    // Sort by last accessed (oldest first)
    cacheItems.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let freedSpace = 0;
    let prunedCount = 0;

    // Remove items until we've freed up enough space
    for (const [key, item] of cacheItems) {
      // Stop if we've freed up enough space
      if (freedSpace >= requiredSpace && this.totalCacheSize <= this.cacheConfig.maxSize * 0.8) {
        break;
      }

      this.removeFromCache(key);
      freedSpace += item.size;
      prunedCount++;
    }

    this.logger.info(`Pruned ${prunedCount} items from cache`, {
      freedSpace,
      remainingItems: this.contextCache.size,
      totalCacheSize: this.totalCacheSize
    });
  }

  /**
   * Start automatic pruning of the cache
   */
  private startAutomaticPruning(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
    }

    this.pruneTimer = setInterval(() => {
      this.pruneExpiredItems();
    }, this.cacheConfig.pruneInterval);

    this.logger.info(`Started automatic cache pruning`, {
      interval: this.cacheConfig.pruneInterval
    });
  }

  /**
   * Prune expired items from the cache
   */
  private pruneExpiredItems(): void {
    const now = Date.now();
    let expiredCount = 0;
    let freedSpace = 0;

    for (const [key, item] of this.contextCache.entries()) {
      if (now - item.timestamp > this.cacheConfig.ttl) {
        freedSpace += item.size;
        this.removeFromCache(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.info(`Pruned ${expiredCount} expired items from cache`, {
        freedSpace,
        remainingItems: this.contextCache.size,
        totalCacheSize: this.totalCacheSize
      });
    }
  }

  /**
   * Invalidate cache entries that might depend on the given context
   */
  private invalidateRelatedCacheEntries(context: any): void {
    if (!context || typeof context !== 'object') {
      return;
    }

    const type = context.type;
    const modelType = context.modelType;

    if (!type && !modelType) {
      return;
    }

    let invalidatedCount = 0;
    let freedSpace = 0;

    // Invalidate entries related to this context type or model type
    for (const [key, item] of this.contextCache.entries()) {
      if (
        (type && key.includes(`:type:${type}`)) ||
        (modelType && key.includes(`:model:${modelType}`))
      ) {
        freedSpace += item.size;
        this.removeFromCache(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      this.logger.info(`Invalidated ${invalidatedCount} related cache entries`, {
        contextType: type,
        modelType,
        freedSpace
      });
    }
  }

  /**
   * Create a function to estimate the size of a context object in bytes
   */
  private createContextSizeEstimator(): (context: any) => number {
    return (context: any): number => {
      if (!context) {
        return 0;
      }

      // Convert to JSON string and measure its length
      // This is a simple approximation of memory usage
      const jsonStr = JSON.stringify(context);

      // Assume 2 bytes per character (UTF-16)
      return jsonStr.length * 2;
    };
  }

  /**
   * Create a hash of a context object for cache keys
   */
  private hashContext(context: any): string {
    if (!context) {
      return 'null';
    }

    // Simple hash function for objects
    const jsonStr = JSON.stringify(context);
    let hash = 0;

    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return hash.toString(16);
  }

  /**
   * Register default transformers for common model pairs
   */
  registerDefaultTransformers(): void {
    // Register transformer for wav2vec2 -> gama
    this.registerContextTransformer('wav2vec2', 'gama', this.createTransformer({
      sourceModelType: 'wav2vec2',
      targetModelType: 'gama',
      transformations: {
        // Transform audio parameters for GAMA
        audioParameters: (params) => ({
          ...params,
          format: 'float32', // GAMA expects float32 format
          normalized: true   // GAMA expects normalized audio
        }),
        // Transform processing requirements for GAMA
        processingRequirements: (reqs) => ({
          ...reqs,
          featureExtraction: true,
          patternRecognition: true
        })
      }
    }));

    // Register transformer for audioldm -> gama
    this.registerContextTransformer('audioldm', 'gama', this.createTransformer({
      sourceModelType: 'audioldm',
      targetModelType: 'gama',
      transformations: {
        // Transform audio parameters for GAMA
        audioParameters: (params) => ({
          ...params,
          format: 'float32', // GAMA expects float32 format
          normalized: true   // GAMA expects normalized audio
        }),
        // Transform stylistic preferences for GAMA
        stylistic: (style) => ({
          ...style,
          analysisMode: 'generation' // Hint that this is generated audio
        })
      }
    }));

    // Register transformer for gama -> wav2vec2
    this.registerContextTransformer('gama', 'wav2vec2', this.createTransformer({
      sourceModelType: 'gama',
      targetModelType: 'wav2vec2',
      transformations: {
        // Transform audio parameters for wav2vec2
        audioParameters: (params) => ({
          ...params,
          sampleRate: 16000, // wav2vec2 expects 16kHz audio
          channels: 1,       // wav2vec2 expects mono audio
          bitDepth: 16       // wav2vec2 expects 16-bit audio
        })
      }
    }));

    // Register generic transformer for any model -> reasoning LLM
    this.registerContextTransformer('*', 'reasoning', this.createTransformer({
      sourceModelType: '*',
      targetModelType: 'reasoning',
      transformations: {
        // Transform any context to a format suitable for reasoning
        audioParameters: (params) => ({
          description: `Audio with ${params.sampleRate}Hz sample rate, ${params.channels} channels`,
          duration: params.duration || 'unknown'
        }),
        // Include metadata about the source model
        _sourceModel: (model) => model || 'unknown'
      }
    }));
  }

  /**
   * Get statistics about the context manager
   */
  getStats(): {
    cacheSize: number;
    cacheItemCount: number;
    cacheHitRate: number;
    transformerCount: number;
  } {
    // Calculate cache hit rate
    let totalAccesses = 0;
    let totalHits = 0;

    for (const item of this.contextCache.values()) {
      totalAccesses += item.accessCount;
      totalHits += item.accessCount - 1; // First access is always a miss
    }

    const hitRate = totalAccesses > 0 ? totalHits / totalAccesses : 0;

    // Count transformers
    let transformerCount = 0;
    for (const transformers of this.modelContextTransformers.values()) {
      transformerCount += transformers.size;
    }

    return {
      cacheSize: this.totalCacheSize,
      cacheItemCount: this.contextCache.size,
      cacheHitRate: hitRate,
      transformerCount
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }

    this.contextCache.clear();
    this.totalCacheSize = 0;
    this.modelContextTransformers.clear();

    this.logger.info('Context manager disposed');
  }
}
