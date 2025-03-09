import { TaskRouter, TaskRoutingError, RoutedTaskResult } from "./task-router";
import { serviceRegistry } from "../services";
import { contextManager } from "../context";
import { Logger } from "../utils/logger";

// Export types and classes
export { TaskRouter, TaskRoutingError, RoutedTaskResult };
export type { TaskRoutingMetrics } from "./task-router";

const logger = new Logger({ namespace: "orchestration-module" });

// Create and export default task router instance
export const taskRouter = new TaskRouter(serviceRegistry, contextManager);

// Helper function to initialize the orchestration system
export async function initializeOrchestration(): Promise<void> {
  try {
    // Verify service registry and context manager are available
    const services = serviceRegistry.getAllServiceIds();
    logger.info("Available services", { services });

    // Initialize any additional orchestration components here
    logger.info("Orchestration system initialized");
  } catch (error) {
    logger.error("Failed to initialize orchestration system", { error });
    throw error;
  }
}

// Example usage:
/*
const task = {
  id: 'task-123',
  type: 'audio_process',
  modelType: 'wav2vec2',
  data: audioBuffer,
  storeResults: true,
  context: {
    tags: ['high-priority'],
    fromTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
  }
};

try {
  const result = await taskRouter.routeTask(task);
  console.log('Task completed:', result);
} catch (error) {
  if (error instanceof TaskRoutingError) {
    console.error('Task routing failed:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
*/
