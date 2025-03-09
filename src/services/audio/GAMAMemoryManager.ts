import { MemoryManager } from "../../utils/memory";
import { Logger } from "../../utils/logger";

/**
 * Configuration for the GAMAMemoryManager
 */
export interface GAMAMemoryManagerConfig {
  /** Maximum memory allocation in string format (e.g., "4GB") */
  maxMemory: string;

  /** Minimum memory to reserve for critical operations (e.g., "512MB") */
  reservedMemory?: string;

  /** Threshold percentage for triggering memory optimization (0-100) */
  optimizationThreshold?: number;

  /** Logging configuration */
  logConfig?: {
    /** Whether to log detailed memory usage */
    verbose?: boolean;
    /** Whether to log memory warnings */
    logWarnings?: boolean;
  };

  /** Analytics configuration */
  analyticsConfig?: {
    /** How often to collect analytics (in ms) */
    collectionInterval?: number;
    /** Maximum number of data points to store */
    maxDataPoints?: number;
    /** Whether to track per-operation memory usage */
    trackOperations?: boolean;
  };
}

/**
 * Resource allocation strategy based on operation type
 */
export interface ResourceAllocationStrategy {
  /** Batch size to use for this operation */
  batchSize: number;
  /** Whether to use FP16 precision */
  useFp16: boolean;
  /** Whether to use gradient checkpointing */
  useGradientCheckpointing: boolean;
  /** Whether to use quantization */
  useQuantization: boolean;
  /** Memory limit for this operation (in bytes) */
  memoryLimit: number;
}

/**
 * Tensor resource information
 */
export interface TensorResource {
  /** Unique identifier for the tensor */
  id: string;
  /** Size of the tensor in bytes */
  sizeBytes: number;
  /** When the tensor was created */
  createdAt: number;
  /** When the tensor was last accessed */
  lastAccessed: number;
  /** Operation that created this tensor */
  operation: string;
  /** Whether this tensor is pinned (cannot be released) */
  isPinned: boolean;
  /** Reference count for this tensor */
  refCount: number;
}

/**
 * Memory usage analytics data
 */
export interface MemoryAnalytics {
  /** Timestamp of the analytics data */
  timestamp: number;
  /** Total memory used (in bytes) */
  totalUsed: number;
  /** Maximum memory available (in bytes) */
  maxAvailable: number;
  /** Usage percentage (0-100) */
  usagePercentage: number;
  /** Memory used by tensors (in bytes) */
  tensorMemory: number;
  /** Number of active tensors */
  activeTensors: number;
  /** Memory used by operation (in bytes) */
  operationMemory: Record<string, number>;
  /** Number of garbage collections triggered */
  gcCount: number;
}

/**
 * Specialized memory manager for GAMA operations with advanced features
 */
export class GAMAMemoryManager {
  private memoryManager: MemoryManager;
  private logger: Logger;
  private reservedBytes: number;
  private optimizationThreshold: number;
  private tensors: Map<string, TensorResource>;
  private analytics: MemoryAnalytics[];
  private analyticsInterval: NodeJS.Timeout | null = null;
  private gcCount: number = 0;
  private operationResourceStrategies: Map<string, ResourceAllocationStrategy>;
  private verbose: boolean;
  private logWarnings: boolean;
  private maxDataPoints: number;
  private trackOperations: boolean;

  /**
   * Creates a new GAMAMemoryManager
   * @param config Configuration for the memory manager
   */
  constructor(config: GAMAMemoryManagerConfig) {
    this.memoryManager = new MemoryManager({ maxMemory: config.maxMemory });
    this.logger = new Logger({ namespace: "gama-memory-manager" });

    // Parse reserved memory or default to 10% of max
    this.reservedBytes = config.reservedMemory
      ? this.parseMemoryString(config.reservedMemory)
      : this.memoryManager.getMemoryUsage().max * 0.1;

    this.optimizationThreshold = config.optimizationThreshold || 70;
    this.verbose = config.logConfig?.verbose || false;
    this.logWarnings = config.logConfig?.logWarnings !== false;
    this.maxDataPoints = config.analyticsConfig?.maxDataPoints || 1000;
    this.trackOperations = config.analyticsConfig?.trackOperations || true;

    this.tensors = new Map();
    this.analytics = [];
    this.operationResourceStrategies = new Map();

    // Initialize default resource strategies for common operations
    this.initializeDefaultStrategies();

    // Start analytics collection if configured
    if (config.analyticsConfig?.collectionInterval) {
      this.startAnalyticsCollection(config.analyticsConfig.collectionInterval);
    }

    this.logger.info("GAMAMemoryManager initialized", {
      maxMemory: config.maxMemory,
      reservedMemory: this.reservedBytes,
      optimizationThreshold: this.optimizationThreshold
    });
  }

  /**
   * Parses a memory string (e.g., "4GB") into bytes
   */
  private parseMemoryString(memoryStr: string): number {
    // Reuse the parsing logic from MemoryManager
    const tempManager = new MemoryManager({ maxMemory: memoryStr });
    return tempManager.getMemoryUsage().max;
  }

  /**
   * Initializes default resource allocation strategies for common operations
   */
  private initializeDefaultStrategies(): void {
    const maxMemory = this.memoryManager.getMemoryUsage().max;

    // Strategy for audio processing (speech-to-text)
    this.operationResourceStrategies.set("process", {
      batchSize: 1,
      useFp16: true,
      useGradientCheckpointing: true,
      useQuantization: true,
      memoryLimit: maxMemory * 0.7 // 70% of max memory
    });

    // Strategy for feature extraction
    this.operationResourceStrategies.set("extractFeatures", {
      batchSize: 4,
      useFp16: true,
      useGradientCheckpointing: false,
      useQuantization: true,
      memoryLimit: maxMemory * 0.5 // 50% of max memory
    });

    // Strategy for audio analysis
    this.operationResourceStrategies.set("analyze", {
      batchSize: 2,
      useFp16: true,
      useGradientCheckpointing: true,
      useQuantization: true,
      memoryLimit: maxMemory * 0.6 // 60% of max memory
    });
  }

  /**
   * Starts periodic collection of memory analytics
   * @param intervalMs Interval in milliseconds
   */
  private startAnalyticsCollection(intervalMs: number): void {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }

    this.analyticsInterval = setInterval(() => {
      this.collectAnalytics();
    }, intervalMs);

    this.logger.info("Memory analytics collection started", {
      intervalMs
    });
  }

  /**
   * Stops analytics collection
   */
  public stopAnalyticsCollection(): void {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
      this.analyticsInterval = null;
      this.logger.info("Memory analytics collection stopped");
    }
  }

  /**
   * Collects current memory analytics
   */
  private collectAnalytics(): void {
    const memUsage = this.memoryManager.getMemoryUsage();
    const operationStats = this.memoryManager.getOperationStats();

    // Calculate tensor memory
    let tensorMemory = 0;
    this.tensors.forEach(tensor => {
      tensorMemory += tensor.sizeBytes;
    });

    // Calculate per-operation memory
    const operationMemory: Record<string, number> = {};
    if (this.trackOperations) {
      Object.keys(operationStats).forEach(op => {
        operationMemory[op] = 0;
        this.tensors.forEach(tensor => {
          if (tensor.operation === op) {
            operationMemory[op] += tensor.sizeBytes;
          }
        });
      });
    }

    // Create analytics entry
    const analytics: MemoryAnalytics = {
      timestamp: Date.now(),
      totalUsed: memUsage.used,
      maxAvailable: memUsage.max,
      usagePercentage: memUsage.percentage,
      tensorMemory,
      activeTensors: this.tensors.size,
      operationMemory,
      gcCount: this.gcCount
    };

    // Add to analytics history
    this.analytics.push(analytics);

    // Trim analytics history if needed
    if (this.analytics.length > this.maxDataPoints) {
      this.analytics.shift();
    }

    if (this.verbose) {
      this.logger.debug("Memory analytics collected", {
        usagePercentage: memUsage.percentage.toFixed(2) + "%",
        activeTensors: this.tensors.size,
        tensorMemory: this.formatBytes(tensorMemory)
      });
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
   * Gets the optimal resource allocation strategy for an operation
   * @param operation Operation name
   * @param dataSize Size of the data in bytes
   * @returns Resource allocation strategy
   */
  public getResourceStrategy(operation: string, dataSize: number): ResourceAllocationStrategy {
    // Start timing the optimization
    const startTime = performance.now();

    // Get current memory usage
    const memUsage = this.memoryManager.getMemoryUsage();

    // Get default strategy for this operation or use a generic one
    const defaultStrategy = this.operationResourceStrategies.get(operation) || {
      batchSize: 2,
      useFp16: true,
      useGradientCheckpointing: false,
      useQuantization: true,
      memoryLimit: memUsage.max * 0.5
    };

    // Calculate available memory (excluding reserved memory)
    const availableMemory = Math.max(0, memUsage.max - memUsage.used - this.reservedBytes);

    // Calculate optimal batch size based on available memory and data size
    // Ensure at least batch size 1, but cap at the default strategy's batch size
    const optimalBatchSize = Math.min(
      Math.max(1, Math.floor(availableMemory / (dataSize * 1.5))),
      defaultStrategy.batchSize
    );

    // Determine if we need to use more aggressive memory optimization
    const memoryPressure = memUsage.percentage;
    const useFp16 = memoryPressure > 50 || defaultStrategy.useFp16;
    const useGradientCheckpointing = memoryPressure > 70 || defaultStrategy.useGradientCheckpointing;
    const useQuantization = memoryPressure > 40 || defaultStrategy.useQuantization;

    // Calculate memory limit for this operation
    const memoryLimit = Math.min(
      availableMemory,
      defaultStrategy.memoryLimit
    );

    // Create optimized strategy
    const strategy: ResourceAllocationStrategy = {
      batchSize: optimalBatchSize,
      useFp16,
      useGradientCheckpointing,
      useQuantization,
      memoryLimit
    };

    if (this.verbose) {
      const optimizationTime = performance.now() - startTime;
      this.logger.debug(`Resource strategy for ${operation}`, {
        batchSize: strategy.batchSize,
        useFp16: strategy.useFp16,
        useGradientCheckpointing: strategy.useGradientCheckpointing,
        memoryLimit: this.formatBytes(strategy.memoryLimit),
        optimizationTime: `${optimizationTime.toFixed(2)}ms`
      });
    }

    return strategy;
  }

  /**
   * Registers a tensor in the memory manager
   * @param id Unique identifier for the tensor
   * @param sizeBytes Size of the tensor in bytes
   * @param operation Operation that created this tensor
   * @returns The tensor resource
   */
  public registerTensor(id: string, sizeBytes: number, operation: string): TensorResource {
    const now = Date.now();

    const tensor: TensorResource = {
      id,
      sizeBytes,
      createdAt: now,
      lastAccessed: now,
      operation,
      isPinned: false,
      refCount: 1
    };

    this.tensors.set(id, tensor);

    if (this.verbose) {
      this.logger.debug(`Tensor ${id} registered`, {
        size: this.formatBytes(sizeBytes),
        operation
      });
    }

    // Check if we need to optimize memory
    this.checkMemoryUsage();

    return tensor;
  }

  /**
   * Accesses a tensor, updating its last accessed time and reference count
   * @param id Tensor ID
   * @param incrementRef Whether to increment the reference count
   * @returns The tensor resource or undefined if not found
   */
  public accessTensor(id: string, incrementRef: boolean = false): TensorResource | undefined {
    const tensor = this.tensors.get(id);

    if (tensor) {
      tensor.lastAccessed = Date.now();

      if (incrementRef) {
        tensor.refCount++;
      }

      if (this.verbose) {
        this.logger.debug(`Tensor ${id} accessed`, {
          refCount: tensor.refCount
        });
      }
    }

    return tensor;
  }

  /**
   * Pins a tensor to prevent it from being released
   * @param id Tensor ID
   * @returns Whether the operation was successful
   */
  public pinTensor(id: string): boolean {
    const tensor = this.tensors.get(id);

    if (tensor) {
      tensor.isPinned = true;
      tensor.lastAccessed = Date.now();

      if (this.verbose) {
        this.logger.debug(`Tensor ${id} pinned`);
      }

      return true;
    }

    return false;
  }

  /**
   * Unpins a tensor, allowing it to be released
   * @param id Tensor ID
   * @returns Whether the operation was successful
   */
  public unpinTensor(id: string): boolean {
    const tensor = this.tensors.get(id);

    if (tensor) {
      tensor.isPinned = false;
      tensor.lastAccessed = Date.now();

      if (this.verbose) {
        this.logger.debug(`Tensor ${id} unpinned`);
      }

      return true;
    }

    return false;
  }

  /**
   * Releases a tensor, decrementing its reference count
   * @param id Tensor ID
   * @param force Whether to force release even if refCount > 0
   * @returns Whether the tensor was fully released
   */
  public releaseTensor(id: string, force: boolean = false): boolean {
    const tensor = this.tensors.get(id);

    if (!tensor) {
      return false;
    }

    // Decrement reference count
    tensor.refCount--;

    // If reference count is 0 or force is true, and the tensor is not pinned, remove it
    if ((tensor.refCount <= 0 || force) && !tensor.isPinned) {
      this.tensors.delete(id);

      if (this.verbose) {
        this.logger.debug(`Tensor ${id} released`, {
          size: this.formatBytes(tensor.sizeBytes),
          force
        });
      }

      return true;
    }

    if (this.verbose) {
      this.logger.debug(`Tensor ${id} reference count decreased`, {
        refCount: tensor.refCount
      });
    }

    return false;
  }

  /**
   * Checks current memory usage and triggers optimization if needed
   */
  private checkMemoryUsage(): void {
    const memUsage = this.memoryManager.getMemoryUsage();

    // If memory usage is above the optimization threshold, try to free memory
    if (memUsage.percentage > this.optimizationThreshold) {
      this.optimizeMemory();
    }
  }

  /**
   * Optimizes memory usage by releasing unused tensors
   * @returns Number of tensors released
   */
  public optimizeMemory(): number {
    const memUsage = this.memoryManager.getMemoryUsage();

    if (this.logWarnings) {
      this.logger.warn("Memory optimization triggered", {
        usagePercentage: memUsage.percentage.toFixed(2) + "%",
        activeTensors: this.tensors.size
      });
    }

    // Sort tensors by last accessed time (oldest first)
    const sortedTensors = Array.from(this.tensors.values())
      .filter(tensor => !tensor.isPinned && tensor.refCount <= 0)
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    let releasedCount = 0;
    let releasedBytes = 0;

    // Release tensors until we're below the threshold or no more tensors to release
    for (const tensor of sortedTensors) {
      if (memUsage.percentage <= this.optimizationThreshold * 0.8) {
        break;
      }

      if (this.releaseTensor(tensor.id, true)) {
        releasedCount++;
        releasedBytes += tensor.sizeBytes;
      }
    }

    // Trigger garbage collection if available
    if (global.gc) {
      try {
        global.gc();
        this.gcCount++;
      } catch (error) {
        this.logger.error("Failed to trigger garbage collection", {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (releasedCount > 0 && this.logWarnings) {
      this.logger.info("Memory optimization completed", {
        releasedTensors: releasedCount,
        releasedMemory: this.formatBytes(releasedBytes),
        newUsagePercentage: this.memoryManager.getMemoryUsage().percentage.toFixed(2) + "%"
      });
    }

    return releasedCount;
  }

  /**
   * Gets the current memory usage
   * @returns Memory usage information
   */
  public getMemoryUsage(): { used: number; max: number; percentage: number; tensorCount: number; tensorMemory: number } {
    const memUsage = this.memoryManager.getMemoryUsage();

    // Calculate tensor memory
    let tensorMemory = 0;
    this.tensors.forEach(tensor => {
      tensorMemory += tensor.sizeBytes;
    });

    return {
      used: memUsage.used,
      max: memUsage.max,
      percentage: memUsage.percentage,
      tensorCount: this.tensors.size,
      tensorMemory
    };
  }

  /**
   * Gets memory usage analytics
   * @param options Options for filtering analytics
   * @returns Memory analytics data
   */
  public getAnalytics(options?: {
    startTime?: number;
    endTime?: number;
    maxPoints?: number;
  }): MemoryAnalytics[] {
    let result = this.analytics;

    // Filter by time range if specified
    if (options?.startTime || options?.endTime) {
      result = result.filter(a => {
        if (options.startTime && a.timestamp < options.startTime) return false;
        if (options.endTime && a.timestamp > options.endTime) return false;
        return true;
      });
    }

    // Limit number of points if specified
    if (options?.maxPoints && result.length > options.maxPoints) {
      // Sample evenly across the time range
      const step = Math.floor(result.length / options.maxPoints);
      result = result.filter((_, i) => i % step === 0).slice(0, options.maxPoints);
    }

    return result;
  }

  /**
   * Gets optimization opportunities based on memory usage patterns
   * @returns Array of optimization suggestions
   */
  public getOptimizationOpportunities(): Array<{
    operation: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    currentUsage: number;
    potentialSaving: number;
  }> {
    const opportunities: Array<{
      operation: string;
      suggestion: string;
      impact: 'high' | 'medium' | 'low';
      currentUsage: number;
      potentialSaving: number;
    }> = [];
    const operationStats = this.memoryManager.getOperationStats();

    // Calculate per-operation memory
    const operationMemory: Record<string, number> = {};
    this.tensors.forEach(tensor => {
      if (!operationMemory[tensor.operation]) {
        operationMemory[tensor.operation] = 0;
      }
      operationMemory[tensor.operation] += tensor.sizeBytes;
    });

    // Analyze operations for optimization opportunities
    for (const [operation, memory] of Object.entries(operationMemory)) {
      const stats = operationStats[operation];

      if (!stats) continue;

      // Check for high memory operations
      if (memory > this.memoryManager.getMemoryUsage().max * 0.3) {
        opportunities.push({
          operation,
          suggestion: "Consider reducing batch size or using more aggressive memory optimization",
          impact: 'high',
          currentUsage: memory,
          potentialSaving: memory * 0.4 // Estimate 40% potential saving
        });
      }

      // Check for operations with long average duration
      if (stats.avgDuration && stats.avgDuration > 5000) {
        opportunities.push({
          operation,
          suggestion: "Operation has high latency, consider optimizing or splitting into smaller tasks",
          impact: 'medium',
          currentUsage: memory,
          potentialSaving: 0 // No direct memory saving, but performance improvement
        });
      }

      // Check for operations that might benefit from quantization
      const strategy = this.operationResourceStrategies.get(operation);
      if (strategy && !strategy.useQuantization && memory > this.memoryManager.getMemoryUsage().max * 0.2) {
        opportunities.push({
          operation,
          suggestion: "Enable quantization to reduce memory usage",
          impact: 'medium',
          currentUsage: memory,
          potentialSaving: memory * 0.3 // Estimate 30% potential saving with quantization
        });
      }
    }

    return opportunities;
  }

  /**
   * Optimizes batch size based on available resources
   * @param operation Operation name
   * @param itemSizeBytes Size of each item in bytes
   * @param maxItems Maximum number of items
   * @returns Optimal batch size
   */
  public optimizeBatchSize(operation: string, itemSizeBytes: number, maxItems: number): number {
    // Get current memory usage
    const memUsage = this.memoryManager.getMemoryUsage();

    // Get available memory (excluding reserved memory)
    const availableMemory = Math.max(0, memUsage.max - memUsage.used - this.reservedBytes);

    // Calculate maximum batch size based on available memory
    // Use a safety factor of 1.5 to account for overhead
    const memoryBasedBatchSize = Math.floor(availableMemory / (itemSizeBytes * 1.5));

    // Get default strategy for this operation
    const strategy = this.operationResourceStrategies.get(operation);
    const defaultBatchSize = strategy ? strategy.batchSize : 4;

    // Calculate optimal batch size
    const optimalBatchSize = Math.min(
      Math.max(1, memoryBasedBatchSize), // At least 1, at most what memory allows
      defaultBatchSize, // Don't exceed default for this operation
      maxItems // Don't exceed the number of items
    );

    if (this.verbose) {
      this.logger.debug(`Batch size optimization for ${operation}`, {
        availableMemory: this.formatBytes(availableMemory),
        itemSize: this.formatBytes(itemSizeBytes),
        memoryBasedBatchSize,
        defaultBatchSize,
        optimalBatchSize
      });
    }

    return optimalBatchSize;
  }

  /**
   * Starts tracking an operation
   * @param operation Operation name
   * @returns Start time for the operation
   */
  public startOperation(operation: string): number {
    return this.memoryManager.startOperation(operation);
  }

  /**
   * Ends tracking an operation
   * @param operation Operation name
   * @param startTime Start time from startOperation
   */
  public endOperation(operation: string, startTime: number): void {
    this.memoryManager.endOperation(operation, startTime);
  }

  /**
   * Gets operation statistics
   * @returns Operation statistics
   */
  public getOperationStats(): Record<string, any> {
    return this.memoryManager.getOperationStats();
  }

  /**
   * Disposes the memory manager and releases all resources
   */
  public dispose(): void {
    // Stop analytics collection
    this.stopAnalyticsCollection();

    // Release all tensors
    this.tensors.clear();

    // Reset stats
    this.memoryManager.resetStats();

    this.logger.info("GAMAMemoryManager disposed");
  }
}
