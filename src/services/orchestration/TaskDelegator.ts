import { ServiceRegistry } from "../../services/service-registry";
import { Task, TaskResult, ServiceNotFoundError } from "../../services/types";
import { Logger } from "../../utils/logger";

/**
 * Error thrown when task delegation fails
 */
export class TaskDelegationError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = "TaskDelegationError";
  }
}

/**
 * Represents a model's capabilities for handling specific task types
 */
export interface ModelCapability {
  taskType: string;
  confidence: number; // 0-1 score indicating how well the model handles this task type
  specializations?: string[]; // Specific subtypes or aspects this model excels at
  resourceRequirements: {
    memory: number; // Memory requirements in MB
    computeUnits: number; // Relative compute units required
  };
  averageLatency: number; // Average processing time in ms
}

/**
 * Represents a model's performance metrics for specific task types
 */
export interface ModelPerformanceMetrics {
  taskType: string;
  successRate: number; // 0-1 score
  averageLatency: number; // in ms
  errorRate: number; // 0-1 score
  lastUpdated: Date;
  sampleSize: number; // Number of tasks used to calculate these metrics
}

/**
 * Represents a task with priority and scheduling information
 */
export interface PrioritizedTask extends Task {
  priority: number; // 1-10, higher is more important
  deadline?: Date; // Optional deadline for task completion
  dependencies?: string[]; // IDs of tasks that must complete before this one
  estimatedDuration?: number; // Estimated processing time in ms
}

/**
 * Represents a composite task that requires multiple models
 */
export interface CompositeTask extends Task {
  subtasks: Task[];
  aggregationStrategy: 'sequential' | 'parallel' | 'conditional';
  dependencies?: Record<string, string[]>; // Maps subtask ID to array of dependent subtask IDs
}

/**
 * Represents the result of a model selection process
 */
export interface ModelSelectionResult {
  modelId: string;
  confidence: number;
  fallbackModels: string[];
  estimatedLatency: number;
}

/**
 * Enhanced TaskDelegator for optimizing how the reasoning LLM interacts with GAMA and other specialized models
 */
export class TaskDelegator {
  private logger: Logger;
  private modelCapabilities: Map<string, ModelCapability[]> = new Map();
  private modelPerformance: Map<string, ModelPerformanceMetrics[]> = new Map();
  private taskQueue: PrioritizedTask[] = [];
  private processingTasks: Set<string> = new Set();
  private compositeTaskResults: Map<string, Map<string, TaskResult>> = new Map();

  constructor(private serviceRegistry: ServiceRegistry) {
    this.logger = new Logger({ namespace: "task-delegator" });
    this.initializeModelCapabilities();
  }

  /**
   * Initialize model capabilities based on registered services
   * In a real implementation, this would load from a configuration or discovery service
   */
  private async initializeModelCapabilities(): Promise<void> {
    const serviceIds = this.serviceRegistry.getAllServiceIds();

    for (const serviceId of serviceIds) {
      try {
        const service = await this.serviceRegistry.getService(serviceId);

        // If the service has a getCapabilities method, use it
        if (typeof (service as any).getCapabilities === 'function') {
          const capabilities = await (service as any).getCapabilities();
          this.modelCapabilities.set(serviceId, capabilities);
          this.logger.info(`Loaded capabilities for model ${serviceId}`, {
            capabilityCount: capabilities.length
          });
        } else {
          // Set default capabilities based on service type
          this.setDefaultCapabilities(serviceId);
        }
      } catch (error) {
        this.logger.warn(`Failed to initialize capabilities for model ${serviceId}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Set default capabilities for a model based on its service ID
   */
  private setDefaultCapabilities(serviceId: string): void {
    const defaultCapabilities: Record<string, ModelCapability[]> = {
      'wav2vec2': [
        {
          taskType: 'audio_process',
          confidence: 0.9,
          specializations: ['speech-to-text', 'audio-analysis'],
          resourceRequirements: { memory: 2048, computeUnits: 5 },
          averageLatency: 500
        }
      ],
      'audioldm': [
        {
          taskType: 'audio-generation',
          confidence: 0.85,
          specializations: ['text-to-audio', 'music-generation'],
          resourceRequirements: { memory: 4096, computeUnits: 8 },
          averageLatency: 2000
        }
      ],
      'gama': [
        {
          taskType: 'audio-analysis',
          confidence: 0.95,
          specializations: ['pattern-recognition', 'feature-extraction', 'audio-classification'],
          resourceRequirements: { memory: 3072, computeUnits: 7 },
          averageLatency: 800
        }
      ]
    };

    if (defaultCapabilities[serviceId]) {
      this.modelCapabilities.set(serviceId, defaultCapabilities[serviceId]);
      this.logger.info(`Set default capabilities for model ${serviceId}`);
    } else {
      this.logger.warn(`No default capabilities available for model ${serviceId}`);
      // Set empty capabilities array
      this.modelCapabilities.set(serviceId, []);
    }
  }

  /**
   * Update model performance metrics based on task execution results
   */
  public updateModelPerformance(
    modelId: string,
    taskType: string,
    result: TaskResult
  ): void {
    const isSuccess = result.status === 'success';
    const latency = result.metrics?.processingTime || 0;

    if (!this.modelPerformance.has(modelId)) {
      this.modelPerformance.set(modelId, []);
    }

    const metrics = this.modelPerformance.get(modelId)!;
    const existingMetric = metrics.find(m => m.taskType === taskType);

    if (existingMetric) {
      // Update existing metrics with exponential moving average
      const alpha = 0.2; // Weight for new data
      const newSampleSize = existingMetric.sampleSize + 1;

      existingMetric.successRate =
        existingMetric.successRate * (1 - alpha) + (isSuccess ? 1 : 0) * alpha;

      existingMetric.errorRate =
        existingMetric.errorRate * (1 - alpha) + (isSuccess ? 0 : 1) * alpha;

      existingMetric.averageLatency =
        existingMetric.averageLatency * (1 - alpha) + latency * alpha;

      existingMetric.lastUpdated = new Date();
      existingMetric.sampleSize = newSampleSize;
    } else {
      // Create new metrics entry
      metrics.push({
        taskType,
        successRate: isSuccess ? 1 : 0,
        errorRate: isSuccess ? 0 : 1,
        averageLatency: latency,
        lastUpdated: new Date(),
        sampleSize: 1
      });
    }

    this.logger.debug(`Updated performance metrics for ${modelId} on ${taskType}`, {
      success: isSuccess,
      latency
    });
  }

  /**
   * Select the most appropriate model for a given task
   */
  public async selectModelForTask(task: Task): Promise<ModelSelectionResult> {
    const taskType = task.type;
    const startTime = Date.now();

    // Get all available models
    const serviceIds = this.serviceRegistry.getAllServiceIds();
    const candidateModels: Array<{
      modelId: string;
      score: number;
      capabilities: ModelCapability[];
      performance?: ModelPerformanceMetrics;
    }> = [];

    // Special handling for audio analysis tasks to route to GAMA
    if (this.isAudioAnalysisTask(task) && serviceIds.includes('gama')) {
      this.logger.info(`Routing audio analysis task to GAMA`, { taskId: task.id });
      return {
        modelId: 'gama',
        confidence: 0.95,
        fallbackModels: ['wav2vec2'],
        estimatedLatency: 800
      };
    }

    // Score each model based on capabilities and performance
    for (const modelId of serviceIds) {
      const capabilities = this.modelCapabilities.get(modelId) || [];
      const matchingCapability = capabilities.find(c => c.taskType === taskType);

      if (!matchingCapability) {
        continue; // Skip models that don't support this task type
      }

      const performance = this.modelPerformance.get(modelId)?.find(p => p.taskType === taskType);

      // Calculate base score from capability confidence
      let score = matchingCapability.confidence;

      // Adjust score based on performance if available
      if (performance) {
        // Weight performance metrics
        const successWeight = 0.4;
        const latencyWeight = 0.3;
        const errorWeight = 0.3;

        // Normalize latency to 0-1 scale (lower is better)
        const normalizedLatency = Math.min(1, matchingCapability.averageLatency / performance.averageLatency);

        // Calculate performance score
        const performanceScore =
          (performance.successRate * successWeight) +
          ((1 - normalizedLatency) * latencyWeight) +
          ((1 - performance.errorRate) * errorWeight);

        // Blend capability and performance scores
        // As we get more samples, we trust performance more
        const performanceWeight = Math.min(0.8, performance.sampleSize / 100);
        score = (score * (1 - performanceWeight)) + (performanceScore * performanceWeight);
      }

      // Check for specialized handling based on task data
      if (matchingCapability.specializations && task.data) {
        for (const specialization of matchingCapability.specializations) {
          if (this.taskMatchesSpecialization(task, specialization)) {
            // Boost score for specialized handling
            score *= 1.2;
            break;
          }
        }
      }

      candidateModels.push({
        modelId,
        score,
        capabilities: [matchingCapability],
        performance
      });
    }

    // Sort models by score descending
    candidateModels.sort((a, b) => b.score - a.score);

    if (candidateModels.length === 0) {
      throw new TaskDelegationError(`No suitable model found for task type: ${taskType}`);
    }

    // Select primary and fallback models
    const primary = candidateModels[0];
    const fallbacks = candidateModels.slice(1, 3).map(m => m.modelId);

    const result: ModelSelectionResult = {
      modelId: primary.modelId,
      confidence: primary.score,
      fallbackModels: fallbacks,
      estimatedLatency: primary.capabilities[0].averageLatency
    };

    this.logger.info(`Selected model for task ${task.id}`, {
      taskType,
      selectedModel: result.modelId,
      confidence: result.confidence,
      fallbacks: result.fallbackModels,
      selectionTime: Date.now() - startTime
    });

    return result;
  }

  /**
   * Check if a task matches a specialization
   */
  private taskMatchesSpecialization(task: Task, specialization: string): boolean {
    // Check task type
    if (task.type.includes(specialization)) {
      return true;
    }

    // Check task data for specialization hints
    if (task.data && typeof task.data === 'object') {
      if ((task.data as any).specialization === specialization) {
        return true;
      }

      if ((task.data as any).type === specialization) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a task is an audio analysis task
   */
  private isAudioAnalysisTask(task: Task): boolean {
    return (
      task.type === 'audio-analysis' ||
      task.type === 'audio_analyze' ||
      task.type === 'audio-feature-extraction' ||
      task.type === 'audio-pattern-recognition' ||
      (task.type === 'audio_process' && (task.data as any)?.operation === 'analyze')
    );
  }

  /**
   * Add a task to the priority queue
   */
  public async scheduleTask(task: Task, priority: number = 5): Promise<void> {
    const prioritizedTask: PrioritizedTask = {
      ...task,
      priority
    };

    // Add estimated duration based on selected model
    try {
      const modelSelection = await this.selectModelForTask(task);
      prioritizedTask.estimatedDuration = modelSelection.estimatedLatency;
    } catch (error) {
      this.logger.warn(`Could not estimate duration for task ${task.id}`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    this.taskQueue.push(prioritizedTask);

    // Sort queue by priority (higher first) and then by deadline if available
    this.taskQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }

      if (a.deadline && b.deadline) {
        return a.deadline.getTime() - b.deadline.getTime(); // Earlier deadline first
      }

      if (a.deadline) return -1; // Tasks with deadlines come first
      if (b.deadline) return 1;

      return 0;
    });

    this.logger.info(`Scheduled task ${task.id} with priority ${priority}`, {
      queueLength: this.taskQueue.length
    });
  }

  /**
   * Get the next task from the queue that is ready to be processed
   */
  public getNextTask(): PrioritizedTask | null {
    // Filter out tasks with unmet dependencies
    const readyTasks = this.taskQueue.filter(task => {
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }

      // Check if all dependencies are completed
      return task.dependencies.every(depId => !this.processingTasks.has(depId));
    });

    if (readyTasks.length === 0) {
      return null;
    }

    // Get highest priority task
    const nextTask = readyTasks[0];

    // Remove from queue and mark as processing
    this.taskQueue = this.taskQueue.filter(t => t.id !== nextTask.id);
    this.processingTasks.add(nextTask.id);

    return nextTask;
  }

  /**
   * Mark a task as completed and remove from processing set
   */
  public completeTask(taskId: string): void {
    this.processingTasks.delete(taskId);
    this.logger.debug(`Marked task ${taskId} as completed`);
  }

  /**
   * Handle a composite task by breaking it down into subtasks
   */
  public async handleCompositeTask(task: CompositeTask): Promise<TaskResult> {
    this.logger.info(`Handling composite task ${task.id} with ${task.subtasks.length} subtasks`);

    // Initialize results storage for this composite task
    this.compositeTaskResults.set(task.id, new Map());

    try {
      if (task.aggregationStrategy === 'sequential') {
        return await this.handleSequentialCompositeTask(task);
      } else if (task.aggregationStrategy === 'parallel') {
        return await this.handleParallelCompositeTask(task);
      } else if (task.aggregationStrategy === 'conditional') {
        return await this.handleConditionalCompositeTask(task);
      } else {
        throw new TaskDelegationError(`Unknown aggregation strategy: ${task.aggregationStrategy}`);
      }
    } finally {
      // Clean up results storage
      this.compositeTaskResults.delete(task.id);
    }
  }

  /**
   * Handle a sequential composite task
   */
  private async handleSequentialCompositeTask(task: CompositeTask): Promise<TaskResult> {
    const results: TaskResult[] = [];
    const startTime = Date.now();

    // Process subtasks in sequence
    for (const subtask of task.subtasks) {
      try {
        // Select model for subtask
        const modelSelection = await this.selectModelForTask(subtask);

        // Get service for selected model
        const service = await this.serviceRegistry.getService(modelSelection.modelId);

        // Execute subtask
        const result = await service.executeTask(subtask);

        // Store result
        this.compositeTaskResults.get(task.id)!.set(subtask.id, result);
        results.push(result);

        // Update model performance
        this.updateModelPerformance(modelSelection.modelId, subtask.type, result);

        // If subtask failed and it's critical, fail the whole task
        if (result.status === 'error' && subtask.metadata?.critical) {
          return {
            id: task.id,
            success: false,
            status: 'error',
            error: new Error(`Critical subtask ${subtask.id} failed: ${result.error?.message}`),
            data: {
              completedSubtasks: results.length,
              subtaskResults: results
            },
            metadata: {
              duration: Date.now() - startTime,
              timestamp: Date.now()
            }
          };
        }
      } catch (error) {
        this.logger.error(`Failed to execute subtask ${subtask.id}`, {
          error: error instanceof Error ? error.message : String(error)
        });

        // If subtask is critical, fail the whole task
        if (subtask.metadata?.critical) {
          return {
            id: task.id,
            success: false,
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
            data: {
              completedSubtasks: results.length,
              subtaskResults: results
            },
            metadata: {
              duration: Date.now() - startTime,
              timestamp: Date.now()
            }
          };
        }
      }
    }

    // Combine results
    return {
      id: task.id,
      success: true,
      status: 'success',
      data: {
        subtaskResults: results,
        combinedData: this.combineResults(results)
      },
      metadata: {
        duration: Date.now() - startTime,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Handle a parallel composite task
   */
  private async handleParallelCompositeTask(task: CompositeTask): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Process subtasks in parallel
      const resultPromises = task.subtasks.map(async (subtask) => {
        try {
          // Select model for subtask
          const modelSelection = await this.selectModelForTask(subtask);

          // Get service for selected model
          const service = await this.serviceRegistry.getService(modelSelection.modelId);

          // Execute subtask
          const result = await service.executeTask(subtask);

          // Store result
          this.compositeTaskResults.get(task.id)!.set(subtask.id, result);

          // Update model performance
          this.updateModelPerformance(modelSelection.modelId, subtask.type, result);

          return result;
        } catch (error) {
          this.logger.error(`Failed to execute subtask ${subtask.id}`, {
            error: error instanceof Error ? error.message : String(error)
          });

          // Return error result
          const errorResult: TaskResult = {
            id: subtask.id,
            success: false,
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
            metadata: {
              duration: 0,
              timestamp: Date.now()
            }
          };

          // Store error result
          this.compositeTaskResults.get(task.id)!.set(subtask.id, errorResult);

          return errorResult;
        }
      });

      // Wait for all subtasks to complete
      const results = await Promise.all(resultPromises);

      // Check if any critical subtasks failed
      const criticalFailure = task.subtasks.some((subtask, index) => {
        return subtask.metadata?.critical && results[index].status === 'error';
      });

      if (criticalFailure) {
        return {
          id: task.id,
          success: false,
          status: 'error',
          error: new Error('One or more critical subtasks failed'),
          data: {
            subtaskResults: results
          },
          metadata: {
            duration: Date.now() - startTime,
            timestamp: Date.now()
          }
        };
      }

      // Combine results
      return {
        id: task.id,
        success: true,
        status: 'success',
        data: {
          subtaskResults: results,
          combinedData: this.combineResults(results)
        },
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      this.logger.error(`Failed to handle parallel composite task ${task.id}`, {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        id: task.id,
        success: false,
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now()
        }
      };
    }
  }

  /**
   * Handle a conditional composite task
   */
  private async handleConditionalCompositeTask(task: CompositeTask): Promise<TaskResult> {
    const startTime = Date.now();
    const results: TaskResult[] = [];
    const processedSubtasks = new Set<string>();

    try {
      // Start with subtasks that have no dependencies
      const initialSubtasks = task.subtasks.filter(subtask => {
        return !task.dependencies?.[subtask.id] || task.dependencies[subtask.id].length === 0;
      });

      // Process initial subtasks
      for (const subtask of initialSubtasks) {
        const result = await this.executeSubtask(subtask, task.id);
        results.push(result);
        processedSubtasks.add(subtask.id);
      }

      // Process remaining subtasks based on dependencies
      let progress = true;
      while (progress && processedSubtasks.size < task.subtasks.length) {
        progress = false;

        for (const subtask of task.subtasks) {
          if (processedSubtasks.has(subtask.id)) {
            continue; // Skip already processed subtasks
          }

          const dependencies = task.dependencies?.[subtask.id] || [];
          const allDependenciesMet = dependencies.every(depId => processedSubtasks.has(depId));

          if (allDependenciesMet) {
            // Check if any dependencies failed and this subtask should be skipped
            const shouldSkip = dependencies.some(depId => {
              const depResult = this.compositeTaskResults.get(task.id)!.get(depId);
              return depResult?.status === 'error' && subtask.metadata?.skipOnDependencyFailure;
            });

            if (shouldSkip) {
              this.logger.info(`Skipping subtask ${subtask.id} due to dependency failure`);
              processedSubtasks.add(subtask.id);
              progress = true;
              continue;
            }

            // Execute subtask
            const result = await this.executeSubtask(subtask, task.id);
            results.push(result);
            processedSubtasks.add(subtask.id);
            progress = true;
          }
        }
      }

      // Check if all subtasks were processed
      if (processedSubtasks.size < task.subtasks.length) {
        this.logger.warn(`Not all subtasks were processed for task ${task.id}`, {
          processed: processedSubtasks.size,
          total: task.subtasks.length
        });
      }

      // Check if any critical subtasks failed
      const criticalFailure = results.some(result => {
        const subtask = task.subtasks.find(s => s.id === result.id);
        return subtask?.metadata?.critical && result.status === 'error';
      });

      if (criticalFailure) {
        return {
          id: task.id,
          success: false,
          status: 'error',
          error: new Error('One or more critical subtasks failed'),
          data: {
            subtaskResults: results
          },
          metadata: {
            duration: Date.now() - startTime,
            timestamp: Date.now()
          }
        };
      }

      // Combine results
      return {
        id: task.id,
        success: true,
        status: 'success',
        data: {
          subtaskResults: results,
          combinedData: this.combineResults(results)
        },
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      this.logger.error(`Failed to handle conditional composite task ${task.id}`, {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        id: task.id,
        success: false,
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now()
        }
      };
    }
  }

  /**
   * Execute a single subtask
   */
  private async executeSubtask(subtask: Task, parentTaskId: string): Promise<TaskResult> {
    try {
      // Select model for subtask
      const modelSelection = await this.selectModelForTask(subtask);

      // Get service for selected model
      const service = await this.serviceRegistry.getService(modelSelection.modelId);

      // Execute subtask
      const result = await service.executeTask(subtask);

      // Store result
      this.compositeTaskResults.get(parentTaskId)!.set(subtask.id, result);

      // Update model performance
      this.updateModelPerformance(modelSelection.modelId, subtask.type, result);

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute subtask ${subtask.id}`, {
        error: error instanceof Error ? error.message : String(error)
      });

      // Create error result
      const errorResult: TaskResult = {
        id: subtask.id,
        success: false,
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          duration: 0,
          timestamp: Date.now()
        }
      };

      // Store error result
      this.compositeTaskResults.get(parentTaskId)!.set(subtask.id, errorResult);

      return errorResult;
    }
  }

  /**
   * Combine results from multiple subtasks
   */
  private combineResults(results: TaskResult[]): any {
    // Filter out error results
    const successResults = results.filter(r => r.status === 'success');

    if (successResults.length === 0) {
      return null;
    }

    // Simple combination strategy - merge data objects
    const combinedData: Record<string, any> = {};

    for (const result of successResults) {
      if (result.data && typeof result.data === 'object') {
        Object.assign(combinedData, result.data);
      }
    }

    return combinedData;
  }

  /**
   * Get statistics about the task delegator
   */
  public getStats(): {
    queueLength: number;
    processingCount: number;
    modelCapabilitiesCount: number;
    modelPerformanceMetricsCount: number;
  } {
    return {
      queueLength: this.taskQueue.length,
      processingCount: this.processingTasks.size,
      modelCapabilitiesCount: Array.from(this.modelCapabilities.values()).reduce(
        (sum, caps) => sum + caps.length, 0
      ),
      modelPerformanceMetricsCount: Array.from(this.modelPerformance.values()).reduce(
        (sum, metrics) => sum + metrics.length, 0
      )
    };
  }
}
