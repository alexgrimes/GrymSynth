import { ServiceRegistry } from "../services/service-registry";
import { ContextManager } from "../context/context-manager";
import { Task, TaskResult, ServiceNotFoundError } from "../services/types";
import { ContextFilter, AudioModelContext } from "../context/types";
import { Logger } from "../utils/logger";

export class TaskRoutingError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = "TaskRoutingError";
  }
}

export interface TaskRoutingMetrics {
  routingTime: number;
  contextFetchTime: number;
  executionTime: number;
  totalTime: number;
}

export interface RoutedTaskResult extends TaskResult {
  routingMetrics: TaskRoutingMetrics;
}

export class TaskRouter {
  private logger: Logger;

  constructor(
    private serviceRegistry: ServiceRegistry,
    private contextManager: ContextManager
  ) {
    this.logger = new Logger({ namespace: "task-router" });
  }

  async routeTask(task: Task): Promise<RoutedTaskResult> {
    const startTime = Date.now();
    let contextFetchTime = 0;
    let routingTime = 0;
    let executionTime = 0;

    try {
      // Determine appropriate service based on task type
      const serviceId = await this.determineServiceId(task);
      routingTime = Date.now() - startTime;

      // Get context for task
      const contextStartTime = Date.now();
      let context = {};
      try {
        context = await this.getTaskContext(task);
      } catch (error) {
        // Log context error but continue with minimal context
        this.logger.warn(
          "Failed to get context for task, using minimal context",
          {
            taskId: task.id,
            error: error instanceof Error ? error.message : String(error),
          }
        );
        context = this.getMinimalContext(task);
      }
      contextFetchTime = Date.now() - contextStartTime;

      // Enrich task with context
      const enrichedTask = this.enrichTaskWithContext(task, context);

      // Get service and execute task
      const executionStartTime = Date.now();
      const service = await this.serviceRegistry.getService(serviceId);

      // If service is offline, try to initialize it
      if ((await service.getStatus()) === "offline") {
        try {
          await service.initialize();
        } catch (error) {
          this.logger.warn(`Failed to initialize service ${serviceId}`, {
            error,
          });
          // Continue anyway - the service might still work
        }
      }

      const result = await service.executeTask(enrichedTask);
      executionTime = Date.now() - executionStartTime;

      // Store results in context if needed
      if (task.storeResults) {
        await this.storeTaskResult(task, result).catch((error) => {
          // Log but don't fail the task if storing results fails
          this.logger.warn("Failed to store task result in context", {
            taskId: task.id,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }

      const totalTime = Date.now() - startTime;

      return {
        ...result,
        routingMetrics: {
          routingTime,
          contextFetchTime,
          executionTime,
          totalTime,
        },
      };
    } catch (error) {
      this.logger.error("Task routing failed", {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });

      const totalTime = Date.now() - startTime;

      if (error instanceof ServiceNotFoundError) {
        throw new TaskRoutingError(
          `No suitable service found for task ${task.id}`,
          error
        );
      }

      // Return error result instead of throwing
      return {
        id: task.id,
        status: "error",
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        routingMetrics: {
          routingTime,
          contextFetchTime,
          executionTime,
          totalTime,
        },
        success: false,
        metadata: {
          duration: totalTime,
          timestamp: Date.now(),
          status: "error"
        }
      };
    }
  }

  private async determineServiceId(task: Task): Promise<string> {
    // Map task types to service IDs
    const serviceMap: Record<string, string> = {
      audio_process: "wav2vec2",
      audio_analyze: "wav2vec2",
      "audio-analysis": "wav2vec2",
      "speech-to-text": "wav2vec2",
      "audio-feature-extraction": "wav2vec2",
      "audio-generation": "audioldm",
      "text-to-audio": "audioldm",
      "music-generation": "audioldm",
      // Add more mappings as needed
    };

    const serviceId = serviceMap[task.type];
    if (!serviceId) {
      throw new TaskRoutingError(`Unsupported task type: ${task.type}`);
    }

    // Verify service is available
    const statuses = await this.serviceRegistry.getServiceStatuses();
    if (statuses[serviceId] !== "online") {
      this.logger.warn(
        `Service ${serviceId} is offline, will try to initialize`
      );
    }

    return serviceId;
  }

  private async getTaskContext(task: Task): Promise<any> {
    const filter: ContextFilter = {
      types: [
        "audio_parameters",
        "processing_requirements",
        "stylistic_preferences",
      ],
      minPriority: 1,
      tags: task.context?.tags || [],
    };

    if (task.context?.fromTimestamp) {
      filter.fromTimestamp = new Date(task.context.fromTimestamp);
    }

    try {
      return await this.contextManager.getContextForModel(
        task.modelType || "default",
        filter
      );
    } catch (error) {
      this.logger.warn("Failed to get context for task", {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Return minimal context rather than failing
      return this.getMinimalContext(task);
    }
  }

  private getMinimalContext(task: Task): AudioModelContext {
    const taskPriority = task.context?.priority || 1;

    // Provide minimal but valid context based on model type
    if (task.modelType === "wav2vec2") {
      return {
        audioParameters: {
          sampleRate: 16000, // Wav2Vec2 default
          channels: 1, // Mono audio
          bitDepth: 16, // Standard bit depth
          format: "wav", // Default format
        },
        processingRequirements: {
          quality: "medium",
          latency: "batch",
          priority: taskPriority,
        },
        stylistic: {
          genre: "general",
          tempo: 120,
          effects: [],
        },
      };
    }

    // Default minimal context for unknown model types
    return {
      audioParameters: {
        sampleRate: 44100,
        channels: 2,
        bitDepth: 16,
        format: "wav",
      },
      processingRequirements: {
        quality: "medium",
        latency: "batch",
        priority: taskPriority,
      },
      stylistic: {
        genre: "general",
        tempo: 120,
        effects: [],
      },
    };
  }

  private enrichTaskWithContext(task: Task, context: any): Task {
    return {
      ...task,
      context: {
        ...task.context,
        modelContext: context,
      },
    };
  }

  private async storeTaskResult(task: Task, result: TaskResult): Promise<void> {
    try {
      await this.contextManager.storeContext({
        id: `result-${task.id}`,
        type: "task_history",
        content: {
          taskType: task.type,
          modelType: task.modelType,
          status: result.status,
          metrics: result.metrics,
          timestamp: new Date(),
        },
        metadata: {
          timestamp: new Date(),
          source: "task-router",
          priority: 2,
          tags: ["task-result", task.type, task.modelType || "unknown"],
        },
      });
    } catch (error) {
      this.logger.warn("Failed to store task result in context", {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw error as this is not critical for task completion
    }
  }

  // Utility methods for task routing insights
  async getRoutingStats(): Promise<{
    activeServices: string[];
    taskTypeMap: Record<string, string>;
    averageRoutingTimes: Record<string, number>;
  }> {
    const statuses = await this.serviceRegistry.getServiceStatuses();

    return {
      activeServices: Object.entries(statuses)
        .filter(([_, status]) => status === "online")
        .map(([id]) => id),
      taskTypeMap: {
        audio_process: "wav2vec2",
        audio_analyze: "wav2vec2",
        "audio-analysis": "wav2vec2",
        "speech-to-text": "wav2vec2",
        "audio-feature-extraction": "wav2vec2",
        "audio-generation": "audioldm",
        "text-to-audio": "audioldm",
        "music-generation": "audioldm",
      },
      averageRoutingTimes: {}, // Would be populated from metrics collection
    };
  }
}
