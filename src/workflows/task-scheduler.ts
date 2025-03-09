import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";
import { PriorityQueue } from "../utils/priority-queue";
import { Logger } from "../utils/logger";
import { AudioTaskRouter } from "../orchestration/audio-task-router";
import { Task, TaskResult } from "../services/types";
import { ScheduledTask, TaskStatus } from "./types";

export declare interface TaskScheduler {
  on(
    event: "taskCompleted",
    listener: (taskId: string, result: TaskResult) => void
  ): this;
  on(
    event: "taskFailed",
    listener: (taskId: string, error: Error) => void
  ): this;
}

export class TaskScheduler extends EventEmitter {
  private taskQueue: PriorityQueue<ScheduledTask>;
  private audioTaskRouter: AudioTaskRouter;
  private maxConcurrentTasks: number;
  private runningTasks: Map<string, ScheduledTask>;
  private completedTasks: Map<string, ScheduledTask>;
  private logger: Logger;
  private processingQueue: boolean = false;

  constructor(audioTaskRouter: AudioTaskRouter, maxConcurrentTasks = 5) {
    super();
    this.taskQueue = new PriorityQueue<ScheduledTask>();
    this.audioTaskRouter = audioTaskRouter;
    this.maxConcurrentTasks = maxConcurrentTasks;
    this.runningTasks = new Map();
    this.completedTasks = new Map();
    this.logger = new Logger("task-scheduler");
  }

  async scheduleTask(
    task: Task,
    priority: number = 1,
    dependencies: string[] = []
  ): Promise<string> {
    // Create scheduled task
    const scheduledTask: ScheduledTask = {
      id: uuidv4(),
      task,
      priority,
      dependencies,
      status: "pending",
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
    };

    this.logger.info(`Scheduling task: ${scheduledTask.id}`, {
      taskType: task.type,
      priority,
      dependencies,
    });

    // Add to queue
    this.taskQueue.enqueue(scheduledTask, priority);

    // Process queue
    this.processQueue();

    return scheduledTask.id;
  }

  getTaskStatus(taskId: string): TaskStatus | undefined {
    // Check running tasks
    if (this.runningTasks.has(taskId)) {
      const task = this.runningTasks.get(taskId)!;
      return {
        id: task.id,
        status: task.status,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        hasError: !!task.error,
        taskType: task.task.type,
      };
    }

    // Check completed tasks
    if (this.completedTasks.has(taskId)) {
      const task = this.completedTasks.get(taskId)!;
      return {
        id: task.id,
        status: task.status,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        hasError: !!task.error,
        taskType: task.task.type,
      };
    }

    // Check queue
    const queuedTask = this.taskQueue.find((task) => task.id === taskId);
    if (queuedTask) {
      return {
        id: queuedTask.id,
        status: queuedTask.status,
        createdAt: queuedTask.createdAt,
        startedAt: queuedTask.startedAt,
        completedAt: queuedTask.completedAt,
        hasError: !!queuedTask.error,
        taskType: queuedTask.task.type,
      };
    }

    return undefined;
  }

  getTaskResult(taskId: string): TaskResult | null {
    // Check running tasks
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      return runningTask.result;
    }

    // Check completed tasks
    const completedTask = this.completedTasks.get(taskId);
    if (completedTask) {
      return completedTask.result;
    }

    return null;
  }

  private async processQueue(): Promise<void> {
    // Prevent concurrent queue processing
    if (this.processingQueue) {
      return;
    }

    this.processingQueue = true;

    try {
      // Process until we're at capacity or the queue is empty
      while (
        this.runningTasks.size < this.maxConcurrentTasks &&
        !this.taskQueue.isEmpty()
      ) {
        // Get next task
        const nextTask = this.taskQueue.dequeue();
        if (!nextTask) {
          break;
        }

        // Check dependencies
        const allDependenciesMet = this.checkDependencies(nextTask);
        if (!allDependenciesMet) {
          // Put back in queue with same priority
          this.logger.info(
            `Dependencies not met for task: ${nextTask.id}, re-queuing`
          );
          this.taskQueue.enqueue(nextTask, nextTask.priority);
          continue;
        }

        // Mark as running
        nextTask.status = "running";
        nextTask.startedAt = new Date();
        this.runningTasks.set(nextTask.id, nextTask);

        this.logger.info(`Starting task: ${nextTask.id}`, {
          taskType: nextTask.task.type,
          dependencies: nextTask.dependencies,
        });

        // Execute task asynchronously
        this.executeTask(nextTask).catch((error) => {
          this.logger.error(`Task execution error: ${error.message}`, {
            taskId: nextTask.id,
            error,
          });
        });
      }
    } finally {
      this.processingQueue = false;
    }
  }

  private async executeTask(scheduledTask: ScheduledTask): Promise<void> {
    try {
      // Execute task
      const result = await this.audioTaskRouter.routeTask(scheduledTask.task);

      // Update task status
      scheduledTask.status = "completed";
      scheduledTask.result = result;
      scheduledTask.completedAt = new Date();

      // Move to completed tasks
      this.runningTasks.delete(scheduledTask.id);
      this.completedTasks.set(scheduledTask.id, scheduledTask);

      this.logger.info(`Task completed: ${scheduledTask.id}`, {
        status: result.status,
        processingTime: result.metrics?.processingTime,
      });

      // Emit completion event
      this.emit("taskCompleted", scheduledTask.id, result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      // Handle error
      scheduledTask.status = "failed";
      scheduledTask.error = error;
      scheduledTask.completedAt = new Date();

      // Move to completed tasks
      this.runningTasks.delete(scheduledTask.id);
      this.completedTasks.set(scheduledTask.id, scheduledTask);

      this.logger.error(`Task failed: ${scheduledTask.id}`, { error });

      // Emit error event
      this.emit("taskFailed", scheduledTask.id, error);
    }

    // Process queue again
    this.processQueue();
  }

  private checkDependencies(task: ScheduledTask): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    for (const dependencyId of task.dependencies) {
      const dependency = this.completedTasks.get(dependencyId);

      // If dependency doesn't exist or isn't completed successfully, return false
      if (
        !dependency ||
        dependency.status !== "completed" ||
        dependency.error
      ) {
        return false;
      }

      // If the dependency completed but with an error status in its result
      if (dependency.result && dependency.result.status !== "success") {
        return false;
      }
    }

    return true;
  }

  cancelAllTasks(): void {
    // Clear queue
    while (!this.taskQueue.isEmpty()) {
      const task = this.taskQueue.dequeue();
      if (task) {
        task.status = "cancelled";
        this.completedTasks.set(task.id, task);
      }
    }

    // Cancel running tasks
    // Note: We can't actually stop tasks that are already running,
    // but we can mark them as cancelled
    for (const [id, task] of this.runningTasks.entries()) {
      task.status = "cancelled";
      this.completedTasks.set(id, task);
    }

    this.runningTasks.clear();

    this.logger.info("All tasks cancelled");
  }

  cancelTask(taskId: string): boolean {
    // Check if task is queued
    const queuedTask = this.taskQueue.remove((task) => task.id === taskId);
    if (queuedTask) {
      this.logger.info(`Cancelled queued task: ${taskId}`);
      return true;
    }

    // Check if task is running
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      runningTask.status = "cancelled";
      this.completedTasks.set(taskId, runningTask);
      this.runningTasks.delete(taskId);
      this.logger.info(`Marked running task as cancelled: ${taskId}`);
      return true;
    }

    return false;
  }
}
