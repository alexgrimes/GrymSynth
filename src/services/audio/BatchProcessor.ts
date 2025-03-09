import { v4 as uuidv4 } from 'uuid';
import { SimpleAudioBuffer } from "../../interfaces/audio";
import { Logger } from "../../utils/logger";
import { GAMAMemoryManager, ResourceAllocationStrategy } from "./GAMAMemoryManager";

/**
 * Configuration for the BatchProcessor
 */
export interface BatchProcessorConfig {
  /** Maximum batch size */
  maxBatchSize?: number;

  /** Maximum concurrent batches */
  maxConcurrentBatches?: number;

  /** Timeout for batch processing in milliseconds */
  batchTimeoutMs?: number;

  /** Memory manager instance */
  memoryManager?: GAMAMemoryManager;

  /** Logging configuration */
  logConfig?: {
    /** Whether to log detailed batch operations */
    verbose?: boolean;
    /** Whether to log warnings */
    logWarnings?: boolean;
  };
}

/**
 * Batch item status
 */
export enum BatchItemStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Batch processing operation type
 */
export enum BatchOperationType {
  PROCESS = 'process',
  ANALYZE = 'analyze',
  EXTRACT_FEATURES = 'extractFeatures'
}

/**
 * Batch item representing a single task in a batch
 */
export interface BatchItem<T, R> {
  /** Unique identifier for the item */
  id: string;
  /** Input data for the item */
  input: T;
  /** Result of processing (if completed) */
  result?: R;
  /** Error message (if failed) */
  error?: string;
  /** Current status of the item */
  status: BatchItemStatus;
  /** When the item was added to the batch */
  addedAt: number;
  /** When processing started */
  startedAt?: number;
  /** When processing completed */
  completedAt?: number;
  /** Processing duration in milliseconds */
  duration?: number;
  /** Priority of the item (higher = more important) */
  priority: number;
  /** Custom metadata for the item */
  metadata?: Record<string, any>;
  /** Similarity group ID (for dynamic batching) */
  similarityGroup?: string;
}

/**
 * Batch representing a group of items to be processed together
 */
export interface Batch<T, R> {
  /** Unique identifier for the batch */
  id: string;
  /** Items in the batch */
  items: BatchItem<T, R>[];
  /** Current status of the batch */
  status: BatchItemStatus;
  /** When the batch was created */
  createdAt: number;
  /** When processing started */
  startedAt?: number;
  /** When processing completed */
  completedAt?: number;
  /** Processing duration in milliseconds */
  duration?: number;
  /** Operation type for this batch */
  operationType: BatchOperationType;
  /** Resource allocation strategy used */
  resourceStrategy?: ResourceAllocationStrategy;
  /** Whether the batch can be cancelled */
  cancellable: boolean;
}

/**
 * Progress information for a batch operation
 */
export interface BatchProgress {
  /** Batch ID */
  batchId: string;
  /** Total number of items */
  total: number;
  /** Number of completed items */
  completed: number;
  /** Number of failed items */
  failed: number;
  /** Overall progress percentage (0-100) */
  percentage: number;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
  /** Whether the operation is cancellable */
  cancellable: boolean;
}

/**
 * Callback for batch progress updates
 */
export type ProgressCallback = (progress: BatchProgress) => void;

/**
 * Similarity function for dynamic batching
 */
export type SimilarityFunction<T> = (a: T, b: T) => number;

/**
 * Processor function that processes a batch of items
 */
export type BatchProcessorFunction<T, R> = (
  items: T[],
  resourceStrategy: ResourceAllocationStrategy,
  onProgress?: ProgressCallback
) => Promise<(R | Error)[]>;

/**
 * Batch processor for efficient processing of audio operations
 */
export class BatchProcessor {
  private maxBatchSize: number;
  private maxConcurrentBatches: number;
  private batchTimeoutMs: number;
  private memoryManager: GAMAMemoryManager | null;
  private logger: Logger;
  private verbose: boolean;
  private logWarnings: boolean;

  // Active batches and queues
  private activeBatches: Map<string, Batch<any, any>>;
  private pendingItems: Map<BatchOperationType, BatchItem<any, any>[]>;
  private processingPromises: Map<string, Promise<void>>;

  // Progress tracking
  private progressCallbacks: Map<string, ProgressCallback>;

  // Cancellation support
  private cancelledBatches: Set<string>;

  // Dynamic batching
  private similarityFunctions: Map<BatchOperationType, SimilarityFunction<any>>;
  private similarityThreshold: number = 0.7;

  // Processor functions
  private processorFunctions: Map<BatchOperationType, BatchProcessorFunction<any, any>>;

  /**
   * Creates a new BatchProcessor
   * @param config Configuration for the batch processor
   */
  constructor(config: BatchProcessorConfig = {}) {
    this.maxBatchSize = config.maxBatchSize || 16;
    this.maxConcurrentBatches = config.maxConcurrentBatches || 4;
    this.batchTimeoutMs = config.batchTimeoutMs || 5000;
    this.memoryManager = config.memoryManager || null;
    this.logger = new Logger({ namespace: "batch-processor" });
    this.verbose = config.logConfig?.verbose || false;
    this.logWarnings = config.logConfig?.logWarnings !== false;

    this.activeBatches = new Map();
    this.pendingItems = new Map();
    this.processingPromises = new Map();
    this.progressCallbacks = new Map();
    this.cancelledBatches = new Set();
    this.similarityFunctions = new Map();
    this.processorFunctions = new Map();

    // Initialize pending items queues for each operation type
    Object.values(BatchOperationType).forEach(type => {
      this.pendingItems.set(type, []);
    });

    // Start batch processing loop
    this.startProcessingLoop();

    this.logger.info("BatchProcessor initialized", {
      maxBatchSize: this.maxBatchSize,
      maxConcurrentBatches: this.maxConcurrentBatches,
      batchTimeoutMs: this.batchTimeoutMs
    });
  }

  /**
   * Registers a processor function for a specific operation type
   * @param operationType Operation type
   * @param processorFn Processor function
   * @param similarityFn Optional similarity function for dynamic batching
   */
  public registerProcessor<T, R>(
    operationType: BatchOperationType,
    processorFn: BatchProcessorFunction<T, R>,
    similarityFn?: SimilarityFunction<T>
  ): void {
    this.processorFunctions.set(operationType, processorFn);

    if (similarityFn) {
      this.similarityFunctions.set(operationType, similarityFn);
    }

    this.logger.info(`Registered processor for ${operationType}`, {
      hasSimilarityFunction: !!similarityFn
    });
  }

  /**
   * Adds an item to be processed in a batch
   * @param operationType Operation type
   * @param input Input data
   * @param options Additional options
   * @returns Promise that resolves with the result
   */
  public async addItem<T, R>(
    operationType: BatchOperationType,
    input: T,
    options: {
      priority?: number;
      metadata?: Record<string, any>;
      onProgress?: ProgressCallback;
    } = {}
  ): Promise<R> {
    // Check if processor is registered for this operation type
    if (!this.processorFunctions.has(operationType)) {
      throw new Error(`No processor registered for operation type: ${operationType}`);
    }

    // Create batch item
    const itemId = uuidv4();
    const item: BatchItem<T, R> = {
      id: itemId,
      input,
      status: BatchItemStatus.PENDING,
      addedAt: Date.now(),
      priority: options.priority || 0,
      metadata: options.metadata
    };

    // Add to pending items queue
    const pendingItems = this.pendingItems.get(operationType) || [];
    pendingItems.push(item);
    this.pendingItems.set(operationType, pendingItems);

    // Sort by priority (higher first)
    pendingItems.sort((a, b) => b.priority - a.priority);

    // If similarity function is available, assign to similarity group
    if (this.similarityFunctions.has(operationType)) {
      this.assignSimilarityGroup(operationType, item, pendingItems);
    }

    if (this.verbose) {
      this.logger.debug(`Added item to ${operationType} queue`, {
        itemId,
        priority: item.priority,
        queueLength: pendingItems.length,
        similarityGroup: item.similarityGroup
      });
    }

    // Register progress callback if provided
    if (options.onProgress) {
      this.progressCallbacks.set(itemId, options.onProgress);
    }

    // Create a promise that will resolve when the item is processed
    return new Promise<R>((resolve, reject) => {
      // Check item status periodically
      const checkInterval = setInterval(() => {
        // Get updated item from active batches
        let updatedItem: BatchItem<T, R> | undefined;

        for (const batch of this.activeBatches.values()) {
          const foundItem = batch.items.find(i => i.id === itemId);
          if (foundItem) {
            updatedItem = foundItem as BatchItem<T, R>;
            break;
          }
        }

        // If not in active batches, check pending items
        if (!updatedItem) {
          updatedItem = pendingItems.find(i => i.id === itemId) as BatchItem<T, R>;
        }

        if (!updatedItem) {
          clearInterval(checkInterval);
          reject(new Error(`Item ${itemId} not found`));
          return;
        }

        // Check if processing is complete
        if (updatedItem.status === BatchItemStatus.COMPLETED) {
          clearInterval(checkInterval);
          resolve(updatedItem.result as R);
        } else if (updatedItem.status === BatchItemStatus.FAILED) {
          clearInterval(checkInterval);
          reject(new Error(updatedItem.error || 'Unknown error'));
        } else if (updatedItem.status === BatchItemStatus.CANCELLED) {
          clearInterval(checkInterval);
          reject(new Error('Operation was cancelled'));
        }
      }, 100);
    });
  }

  /**
   * Assigns an item to a similarity group for dynamic batching
   * @param operationType Operation type
   * @param item Item to assign
   * @param pendingItems All pending items
   */
  private assignSimilarityGroup<T, R>(
    operationType: BatchOperationType,
    item: BatchItem<T, R>,
    pendingItems: BatchItem<any, any>[]
  ): void {
    const similarityFn = this.similarityFunctions.get(operationType);
    if (!similarityFn) return;

    // Find existing groups
    const existingGroups = new Set<string>();
    pendingItems.forEach(i => {
      if (i.similarityGroup && i !== item) {
        existingGroups.add(i.similarityGroup);
      }
    });

    // Find most similar existing group
    let bestGroupId: string | undefined;
    let bestSimilarity = 0;

    for (const groupId of existingGroups) {
      // Find a representative item from this group
      const groupItem = pendingItems.find(i => i.similarityGroup === groupId);
      if (!groupItem) continue;

      // Calculate similarity
      const similarity = similarityFn(item.input, groupItem.input);

      if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
        bestSimilarity = similarity;
        bestGroupId = groupId;
      }
    }

    // Assign to best group or create new group
    if (bestGroupId) {
      item.similarityGroup = bestGroupId;
    } else {
      item.similarityGroup = uuidv4();
    }
  }

  /**
   * Starts the batch processing loop
   */
  private startProcessingLoop(): void {
    // Process batches every 100ms
    setInterval(() => {
      this.processPendingItems();
    }, 100);
  }

  /**
   * Processes pending items by creating and executing batches
   */
  private processPendingItems(): void {
    // Skip if we're at max concurrent batches
    if (this.activeBatches.size >= this.maxConcurrentBatches) {
      return;
    }

    // Process each operation type
    for (const operationType of Object.values(BatchOperationType)) {
      const pendingItems = this.pendingItems.get(operationType) || [];

      // Skip if no pending items
      if (pendingItems.length === 0) {
        continue;
      }

      // Check if we should create a batch
      const shouldCreateBatch =
        pendingItems.length >= this.maxBatchSize || // Batch is full
        (pendingItems.length > 0 && Date.now() - pendingItems[0].addedAt >= this.batchTimeoutMs); // Timeout reached

      if (shouldCreateBatch) {
        this.createAndProcessBatch(operationType);
      }
    }
  }

  /**
   * Creates and processes a batch for a specific operation type
   * @param operationType Operation type
   */
  private createAndProcessBatch(operationType: BatchOperationType): void {
    const pendingItems = this.pendingItems.get(operationType) || [];
    if (pendingItems.length === 0) return;

    // Determine batch size based on memory manager if available
    let batchSize = this.maxBatchSize;
    if (this.memoryManager) {
      // Estimate item size (this would be more accurate in a real implementation)
      const estimatedItemSize = 1024 * 1024; // 1MB per item as a rough estimate
      batchSize = this.memoryManager.optimizeBatchSize(
        operationType,
        estimatedItemSize,
        pendingItems.length
      );
    }

    // Create batch items
    let batchItems: BatchItem<any, any>[];

    // If similarity function is available, use dynamic batching
    if (this.similarityFunctions.has(operationType)) {
      batchItems = this.createDynamicBatch(operationType, pendingItems, batchSize);
    } else {
      // Otherwise, just take the first N items
      batchItems = pendingItems.slice(0, batchSize);
    }

    // Remove selected items from pending queue
    const batchItemIds = new Set(batchItems.map(item => item.id));
    this.pendingItems.set(
      operationType,
      pendingItems.filter(item => !batchItemIds.has(item.id))
    );

    // Create batch
    const batchId = uuidv4();
    const batch: Batch<any, any> = {
      id: batchId,
      items: batchItems,
      status: BatchItemStatus.PENDING,
      createdAt: Date.now(),
      operationType,
      cancellable: true
    };

    // Add to active batches
    this.activeBatches.set(batchId, batch);

    // Process batch
    this.processBatch(batch);
  }

  /**
   * Creates a batch of similar items for dynamic batching
   * @param operationType Operation type
   * @param pendingItems All pending items
   * @param maxBatchSize Maximum batch size
   * @returns Batch items
   */
  private createDynamicBatch(
    operationType: BatchOperationType,
    pendingItems: BatchItem<any, any>[],
    maxBatchSize: number
  ): BatchItem<any, any>[] {
    // If no items, return empty array
    if (pendingItems.length === 0) {
      return [];
    }

    // Start with the highest priority item
    const firstItem = pendingItems[0];
    const selectedItems: BatchItem<any, any>[] = [firstItem];

    // If first item has a similarity group, prioritize items from that group
    if (firstItem.similarityGroup) {
      // Get all items in the same similarity group
      const groupItems = pendingItems
        .filter(item => item.similarityGroup === firstItem.similarityGroup && item !== firstItem)
        .slice(0, maxBatchSize - 1);

      selectedItems.push(...groupItems);
    }

    // If we still have space, add more items by priority
    if (selectedItems.length < maxBatchSize) {
      const remainingItems = pendingItems
        .filter(item => !selectedItems.includes(item))
        .slice(0, maxBatchSize - selectedItems.length);

      selectedItems.push(...remainingItems);
    }

    return selectedItems;
  }

  /**
   * Processes a batch of items
   * @param batch Batch to process
   */
  private async processBatch(batch: Batch<any, any>): Promise<void> {
    const { id: batchId, operationType, items } = batch;

    // Get processor function
    const processorFn = this.processorFunctions.get(operationType);
    if (!processorFn) {
      this.failBatch(batch, `No processor function registered for ${operationType}`);
      return;
    }

    // Update batch status
    batch.status = BatchItemStatus.PROCESSING;
    batch.startedAt = Date.now();

    // Update item status
    items.forEach(item => {
      item.status = BatchItemStatus.PROCESSING;
      item.startedAt = Date.now();
    });

    // Get resource strategy from memory manager if available
    let resourceStrategy: ResourceAllocationStrategy;
    if (this.memoryManager) {
      // Estimate data size (this would be more accurate in a real implementation)
      const estimatedDataSize = items.length * 1024 * 1024; // 1MB per item as a rough estimate
      resourceStrategy = this.memoryManager.getResourceStrategy(operationType, estimatedDataSize);
    } else {
      // Default strategy
      resourceStrategy = {
        batchSize: items.length,
        useFp16: true,
        useGradientCheckpointing: false,
        useQuantization: true,
        memoryLimit: 0
      };
    }

    batch.resourceStrategy = resourceStrategy;

    if (this.verbose) {
      this.logger.debug(`Processing batch ${batchId}`, {
        operationType,
        itemCount: items.length,
        resourceStrategy
      });
    }

    // Create progress tracking function
    const progressCallback = (progress: BatchProgress) => {
      // Send progress to all item callbacks
      items.forEach(item => {
        const callback = this.progressCallbacks.get(item.id);
        if (callback) {
          callback(progress);
        }
      });
    };

    // Create processing promise
    const processingPromise = (async () => {
      try {
        // Check if batch is cancelled before processing
        if (this.cancelledBatches.has(batchId)) {
          this.markBatchAsCancelled(batch);
          return;
        }

        // Extract input data
        const inputData = items.map(item => item.input);

        // Process batch
        const results = await processorFn(inputData, resourceStrategy, progressCallback);

        // Check if batch was cancelled during processing
        if (this.cancelledBatches.has(batchId)) {
          this.markBatchAsCancelled(batch);
          return;
        }

        // Update items with results
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const result = results[i];

          item.completedAt = Date.now();
          item.duration = item.completedAt - (item.startedAt || item.addedAt);

          if (result instanceof Error) {
            item.status = BatchItemStatus.FAILED;
            item.error = result.message;
          } else {
            item.status = BatchItemStatus.COMPLETED;
            item.result = result;
          }
        }

        // Update batch status
        batch.status = BatchItemStatus.COMPLETED;
        batch.completedAt = Date.now();
        batch.duration = batch.completedAt - (batch.startedAt || batch.createdAt);

        if (this.verbose) {
          this.logger.debug(`Batch ${batchId} completed`, {
            operationType,
            duration: batch.duration,
            successCount: items.filter(item => item.status === BatchItemStatus.COMPLETED).length,
            failureCount: items.filter(item => item.status === BatchItemStatus.FAILED).length
          });
        }
      } catch (error) {
        // Fail all items in the batch
        this.failBatch(batch, error instanceof Error ? error.message : String(error));
      } finally {
        // Remove from active batches and processing promises
        setTimeout(() => {
          this.activeBatches.delete(batchId);
          this.processingPromises.delete(batchId);
          this.cancelledBatches.delete(batchId);
        }, 5000); // Keep batch around for a few seconds for status checks
      }
    })();

    // Store processing promise
    this.processingPromises.set(batchId, processingPromise);
  }

  /**
   * Fails all items in a batch
   * @param batch Batch to fail
   * @param errorMessage Error message
   */
  private failBatch(batch: Batch<any, any>, errorMessage: string): void {
    const { id: batchId, items } = batch;

    if (this.logWarnings) {
      this.logger.warn(`Batch ${batchId} failed`, { error: errorMessage });
    }

    // Update batch status
    batch.status = BatchItemStatus.FAILED;
    batch.completedAt = Date.now();
    batch.duration = batch.completedAt - (batch.startedAt || batch.createdAt);

    // Update item status
    items.forEach(item => {
      item.status = BatchItemStatus.FAILED;
      item.error = errorMessage;
      item.completedAt = Date.now();
      item.duration = item.completedAt - (item.startedAt || item.addedAt);
    });
  }

  /**
   * Marks a batch as cancelled and updates its status
   * @param batch Batch to cancel
   */
  private markBatchAsCancelled(batch: Batch<any, any>): void {
    const { id: batchId, items } = batch;

    this.logger.info(`Batch ${batchId} cancelled`);

    // Update batch status
    batch.status = BatchItemStatus.CANCELLED;
    batch.completedAt = Date.now();
    batch.duration = batch.completedAt - (batch.startedAt || batch.createdAt);

    // Update item status
    items.forEach(item => {
      item.status = BatchItemStatus.CANCELLED;
      item.completedAt = Date.now();
      item.duration = item.completedAt - (item.startedAt || item.addedAt);
    });
  }

  /**
   * Cancels a batch operation
   * @param batchId Batch ID
   * @returns Whether the operation was cancelled
   */
  public cancelBatch(batchId: string): boolean {
    const batch = this.activeBatches.get(batchId);

    if (!batch || !batch.cancellable) {
      return false;
    }

    // Mark batch as cancelled
    this.cancelledBatches.add(batchId);

    // If batch is still pending, cancel it immediately
    if (batch.status === BatchItemStatus.PENDING) {
      this.markBatchAsCancelled(batch);
    }

    return true;
  }

  /**
   * Gets the status of a batch
   * @param batchId Batch ID
   * @returns Batch status or undefined if not found
   */
  public getBatchStatus(batchId: string): BatchItemStatus | undefined {
    const batch = this.activeBatches.get(batchId);
    return batch?.status;
  }

  /**
   * Gets progress information for a batch
   * @param batchId Batch ID
   * @returns Batch progress or undefined if not found
   */
  public getBatchProgress(batchId: string): BatchProgress | undefined {
    const batch = this.activeBatches.get(batchId);

    if (!batch) {
      return undefined;
    }

    const { items } = batch;
    const total = items.length;
    const completed = items.filter(item =>
      item.status === BatchItemStatus.COMPLETED ||
      item.status === BatchItemStatus.FAILED
    ).length;
    const failed = items.filter(item => item.status === BatchItemStatus.FAILED).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    // Estimate time remaining
    let estimatedTimeRemaining: number | undefined;

    if (completed > 0 && completed < total && batch.startedAt) {
      const elapsedTime = Date.now() - batch.startedAt;
      const averageTimePerItem = elapsedTime / completed;
      estimatedTimeRemaining = averageTimePerItem * (total - completed);
    }

    return {
      batchId,
      total,
      completed,
      failed,
      percentage,
      estimatedTimeRemaining,
      cancellable: batch.cancellable
    };
  }

  /**
   * Gets all active batches
   * @returns Array of active batches
   */
  public getActiveBatches(): Batch<any, any>[] {
    return Array.from(this.activeBatches.values());
  }

  /**
   * Gets the number of pending items for an operation type
   * @param operationType Operation type
   * @returns Number of pending items
   */
  public getPendingItemCount(operationType: BatchOperationType): number {
    const pendingItems = this.pendingItems.get(operationType) || [];
    return pendingItems.length;
  }

  /**
   * Gets the total number of pending items across all operation types
   * @returns Total number of pending items
   */
  public getTotalPendingItemCount(): number {
    let total = 0;
    for (const items of this.pendingItems.values()) {
      total += items.length;
    }
    return total;
  }

  /**
   * Sets the similarity threshold for dynamic batching
   * @param threshold Threshold value (0-1)
   */
  public setSimilarityThreshold(threshold: number): void {
    this.similarityThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Disposes the batch processor and cancels all active batches
   */
  public dispose(): void {
    // Cancel all active batches
    for (const batchId of this.activeBatches.keys()) {
      this.cancelBatch(batchId);
    }

    // Clear all data structures
    this.activeBatches.clear();
    this.pendingItems.clear();
    this.processingPromises.clear();
    this.progressCallbacks.clear();
    this.cancelledBatches.clear();

    this.logger.info("BatchProcessor disposed");
  }
}

/**
 * Default similarity function for audio buffers
 * @param a First audio buffer
 * @param b Second audio buffer
 * @returns Similarity score (0-1)
 */
export function defaultAudioSimilarityFunction(a: SimpleAudioBuffer, b: SimpleAudioBuffer): number {
  // Check if sample rates match
  if (a.sampleRate !== b.sampleRate) {
    return 0.5; // Medium similarity if sample rates differ
  }

  // Check if channels match
  if (a.channels !== b.channels) {
    return 0.6; // Slightly higher similarity if only channels differ
  }

  // Check if lengths are similar
  const lengthRatio = Math.min(a.data.length, b.data.length) / Math.max(a.data.length, b.data.length);

  // Combine factors
  return 0.7 + (lengthRatio * 0.3); // Base similarity of 0.7, up to 1.0 for identical lengths
}
