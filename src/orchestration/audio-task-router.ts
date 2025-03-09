import { TaskRouter, RoutedTaskResult, TaskRoutingError } from "./task-router";
import { ServiceRegistry } from "../services/service-registry";
import { ContextManager } from "../context/context-manager";
import { Task, TaskResult } from "../services/types";
import { Logger } from "../utils/logger";

export class AudioTaskRouter {
  private logger: Logger;
  private taskRouter: TaskRouter;

  constructor(
    serviceRegistry: ServiceRegistry,
    contextManager: ContextManager
  ) {
    this.taskRouter = new TaskRouter(serviceRegistry, contextManager);
    this.logger = new Logger({ namespace: "audio-task-router" });
  }

  async routeAudioTask(task: Task): Promise<RoutedTaskResult> {
    this.logger.info("Routing audio task", {
      taskId: task.id,
      type: task.type,
    });

    try {
      // Determine the appropriate service based on task type
      let serviceId: string;

      if (this.isAnalysisTask(task)) {
        // Route analysis tasks to wav2vec2
        serviceId = "wav2vec2";
        this.logger.info("Routing to wav2vec2 service", { taskId: task.id });
      } else if (this.isGenerationTask(task)) {
        // Route generation tasks to audioldm
        serviceId = "audioldm";
        this.logger.info("Routing to audioldm service", { taskId: task.id });
      } else {
        throw new Error(`Unsupported task type: ${task.type}`);
      }

      // Override the task type if needed to match the service's expected types
      const modifiedTask: Task = {
        ...task,
        modelType: this.isAnalysisTask(task) ? "wav2vec2" : "audioldm",
      };

      // Use the base TaskRouter to handle the actual routing
      return await this.taskRouter.routeTask(modifiedTask);
    } catch (error) {
      this.logger.error("Task routing failed", {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Create a proper error object
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      // Return error result with routing metrics
      const now = Date.now();
      return {
        id: task.id,
        status: "error",
        error: errorObj,
        data: null,
        routingMetrics: {
          routingTime: 0,
          contextFetchTime: 0,
          executionTime: 0,
          totalTime: 0,
        },
      };
    }
  }

  // Helper method to determine if task is for analysis or generation
  isAnalysisTask(task: Task): boolean {
    return (
      task.type === "audio-analysis" ||
      task.type === "speech-to-text" ||
      task.type === "audio-feature-extraction" ||
      task.type === "audio_process" ||
      task.type === "audio_analyze"
    );
  }

  isGenerationTask(task: Task): boolean {
    return (
      task.type === "audio-generation" ||
      task.type === "text-to-audio" ||
      task.type === "music-generation"
    );
  }

  // Main entry point for routing audio tasks
  async routeTask(task: Task): Promise<RoutedTaskResult> {
    // For audio-related tasks, use our specialized router
    if (this.isAnalysisTask(task) || this.isGenerationTask(task)) {
      return this.routeAudioTask(task);
    }

    // For other task types, use the base implementation
    return this.taskRouter.routeTask(task);
  }
}
