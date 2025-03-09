import { TaskType, TaskResult, AudioTask } from "./tasks";

/**
 * Interface for model adapters that can handle specific tasks
 */
export interface ModelAdapter {
  /**
   * Process a given task
   */
  handleTask(task: AudioTask): Promise<TaskResult>;

  /**
   * Get adapter capabilities for task routing
   */
  getCapabilities(): ModelCapabilities;

  /**
   * Check adapter health status
   */
  checkHealth?(): Promise<boolean>;

  /**
   * Clean up adapter resources
   */
  dispose?(): Promise<void>;
}

/**
 * Model capabilities for task routing decisions
 */
export interface ModelCapabilities {
  /** List of task types this adapter can handle */
  supportedTasks: TaskType[];

  /** Supported audio formats */
  supportedFormats: string[];

  /** Performance characteristics */
  performance: {
    /** Average task processing time in milliseconds */
    averageLatency: number;

    /** Tasks per second this adapter can handle */
    throughput: number;

    /** Maximum concurrent tasks */
    maxConcurrent?: number;
  };

  /** Resource requirements */
  resourceRequirements?: {
    /** Memory requirement in readable format (e.g., '1GB') */
    memory: string;

    /** CPU priority level */
    cpuPriority?: "low" | "medium" | "high";
  };
}

/**
 * Model registration details
 */
export interface ModelRegistration {
  /** Model adapter instance */
  adapter: ModelAdapter;

  /** Unique identifier for this model */
  id: string;

  /** Registration priority (higher = preferred) */
  priority: number;
}

/**
 * Model selection criteria
 */
export interface ModelSelectionCriteria {
  /** Required task type */
  taskType: TaskType;

  /** Required format support */
  format?: string;

  /** Maximum acceptable latency */
  maxLatency?: number;

  /** Minimum throughput required */
  minThroughput?: number;
}
