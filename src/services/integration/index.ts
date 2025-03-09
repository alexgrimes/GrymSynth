/**
 * Integration Services
 *
 * Exports for system integration components
 */
import { Logger } from '../../utils/logger';
import { ComponentRegistry } from './ComponentRegistry';
import { SystemInitializer } from './SystemInitializer';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { SystemShutdown } from './SystemShutdown';

// Create logger
const logger = new Logger({ namespace: 'integration' });

// Create component registry
const registry = new ComponentRegistry();

// Create system initializer
const initializer = new SystemInitializer(registry, new SystemHealthMonitor(registry));

// Create health monitor
const healthMonitor = new SystemHealthMonitor(registry);

// Create system shutdown
const shutdown = new SystemShutdown(registry);

// Export components
export {
  ComponentRegistry,
  SystemInitializer,
  SystemHealthMonitor,
  SystemShutdown
};

// Export registry instance
export const componentRegistry = registry;

/**
 * Bootstrap system components
 */
export function systemBootstrap() {
  logger.info('Bootstrapping system components');

  return {
    registry,
    initializer,
    healthMonitor,
    shutdown
  };
}

/**
 * Initialize system
 */
export async function initializeSystem() {
  logger.info('Initializing system');

  if (!initializer) {
    throw new Error('System initializer not available');
  }

  return initializer.initialize();
}

/**
 * Get system health
 */
export async function getSystemHealth() {
  if (!healthMonitor) {
    throw new Error('Health monitor not available');
  }

  const health = healthMonitor.getLastHealth();
  if (!health) {
    // Perform health check if no previous result
    return await healthMonitor.checkHealth();
  }

  return health;
}

/**
 * Shutdown system
 */
export async function shutdownSystem(options?: string | { reason?: string }) {
  logger.info('Shutting down system');

  if (!shutdown) {
    throw new Error('System shutdown not available');
  }

  // Convert string to options object
  const shutdownOptions = typeof options === 'string'
    ? { reason: options }
    : options;

  return shutdown.shutdown(shutdownOptions);
}
