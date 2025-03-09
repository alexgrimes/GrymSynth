// Export all orchestration components
export * from './TaskDelegator';
export * from './ContextManager';
export * from './ModelOrchestrator';

// Export default instances
import { ServiceRegistry } from '../../services/service-registry';
import { ContextManager as BaseContextManager } from '../../context/context-manager';
import { TaskDelegator } from './TaskDelegator';
import { ContextManager } from './ContextManager';
import { ModelOrchestrator } from './ModelOrchestrator';

// Create and configure the orchestration layer
export const createOrchestrationLayer = (
  serviceRegistry: ServiceRegistry,
  baseContextManager: BaseContextManager
) => {
  // Create the context manager
  const contextManager = new ContextManager(baseContextManager, {
    maxSize: 100 * 1024 * 1024, // 100MB default cache size
    ttl: 30 * 60 * 1000, // 30 minutes TTL
    pruneInterval: 5 * 60 * 1000 // 5 minutes prune interval
  });

  // Register default context transformers
  contextManager.registerDefaultTransformers();

  // Create the task delegator
  const taskDelegator = new TaskDelegator(serviceRegistry);

  // Create the model orchestrator
  const modelOrchestrator = new ModelOrchestrator(serviceRegistry, contextManager);

  return {
    contextManager,
    taskDelegator,
    modelOrchestrator
  };
};
