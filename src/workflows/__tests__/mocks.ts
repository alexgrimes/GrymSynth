import { Task, TaskResult, ServiceMetrics } from "../../services/types";
import { RoutedTaskResult } from "../../orchestration/task-router";
import { Logger } from "../../utils/logger";

type FailureMode = "none" | "transient" | "permanent";

export class MockTaskRouter {
  private logger: Logger;
  private simulatedDelay: number;
  private failureMode: FailureMode = "none";
  private remainingFailures: number = 0;
  private maxRetries: number = 3;

  constructor(simulatedDelay: number = 100) {
    this.logger = new Logger("mock-task-router");
    this.simulatedDelay = simulatedDelay;
  }

  setFailureMode(mode: FailureMode, failureCount?: number) {
    this.failureMode = mode;
    this.remainingFailures = failureCount || 0;
  }

  async routeTask(task: Task): Promise<RoutedTaskResult> {
    const startTime = Date.now();
    this.logger.info(`Processing mock task: ${task.id}`, { type: task.type });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, this.simulatedDelay));

    const mockMetrics: ServiceMetrics = {
      memoryUsage: 100,
      processingTime: this.simulatedDelay,
      requestCount: 1,
      errorCount: 0,
      lastProcessedAt: new Date(),
    };

    const routingMetrics = {
      routingTime: 10,
      contextFetchTime: 5,
      executionTime: this.simulatedDelay,
      totalTime: Date.now() - startTime,
    };

    // Handle simulated failures
    if (this.shouldFail()) {
      if (this.failureMode === "permanent" || this.remainingFailures > 0) {
        this.remainingFailures--;
        mockMetrics.errorCount = 1;

        const error = new Error(
          this.failureMode === "permanent"
            ? "Permanent failure: max retries exceeded"
            : "Transient failure: retry may succeed"
        );

        return {
          id: task.id,
          status: "error",
          data: null,
          error,
          metrics: mockMetrics,
          routingMetrics,
        };
      }
    }

    // Simulate failure for non-existent files
    if (task.data.audioFile?.includes("non-existent")) {
      return {
        id: task.id,
        status: "error",
        data: null,
        error: new Error("File not found"),
        metrics: mockMetrics,
        routingMetrics,
      };
    }

    // Handle conditional path testing
    if (task.data.forceError) {
      return {
        id: task.id,
        status: "success",
        data: {
          mockResult: true,
          value: false, // This will trigger the error path
          processedAt: new Date(),
          taskType: task.type,
        },
        metrics: mockMetrics,
        routingMetrics,
      };
    }

    // Return mock success result
    return {
      id: task.id,
      status: "success",
      data: {
        mockResult: true,
        value: true,
        processedAt: new Date(),
        taskType: task.type,
      },
      metrics: mockMetrics,
      routingMetrics,
    };
  }

  async getStatus(): Promise<"online" | "offline"> {
    return "online";
  }

  private shouldFail(): boolean {
    return (
      this.failureMode === "permanent" ||
      (this.failureMode === "transient" && this.remainingFailures > 0)
    );
  }
}

export class MockContextManager {
  private storage: Map<string, any>;
  private logger: Logger;

  constructor() {
    this.storage = new Map();
    this.logger = new Logger("mock-context-manager");
  }

  async store(key: string, content: any): Promise<void> {
    this.logger.debug(`Storing content for key: ${key}`);
    this.storage.set(key, content);
  }

  async query(query: { key: string }): Promise<any[]> {
    this.logger.debug(`Querying content for key: ${query.key}`);
    const content = this.storage.get(query.key);
    return content ? [content] : [];
  }

  async storeContext(content: any): Promise<void> {
    const key = content.type || "default";
    await this.store(key, content);
  }

  async getContextForModel(modelType: string): Promise<any> {
    const result = await this.query({ key: modelType });
    return result[0] || null;
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

export class MockServiceRegistry {
  async getService(): Promise<any> {
    return {
      executeTask: async (task: Task): Promise<TaskResult> => ({
        id: task.id,
        status: "success",
        data: { mock: true },
      }),
      getStatus: async () => "online",
    };
  }

  async getServiceStatuses(): Promise<Record<string, string>> {
    return {
      "mock-service": "online",
    };
  }
}
