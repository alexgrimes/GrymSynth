/**
 * SystemShutdown
 *
 * Service for graceful system shutdown
 */
import { Logger } from '../../utils/logger';
import { ComponentRegistry } from './ComponentRegistry';

// Define shutdown options
export interface ShutdownOptions {
  timeout?: number;
  force?: boolean;
  reason?: string;
  order?: string[];
}

// Define shutdown result
export interface ShutdownResult {
  success: boolean;
  shutdownComponents: string[];
  failedComponents: string[];
  errors: Record<string, Error>;
  duration: number;
  forced: boolean;
}

export class SystemShutdown {
  private registry: ComponentRegistry;
  private logger: Logger;
  private isShuttingDown = false;
  private defaultTimeout = 30000; // 30 seconds
  private shutdownOrder: string[] = [];
  private shutdownListeners: ((reason: string) => void)[] = [];

  constructor(registry: ComponentRegistry) {
    this.registry = registry;
    this.logger = new Logger({ namespace: 'system-shutdown' });
  }

  /**
   * Initiate system shutdown
   */
  async shutdown(options: ShutdownOptions = {}): Promise<ShutdownResult> {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress');
      return {
        success: false,
        shutdownComponents: [],
        failedComponents: [],
        errors: { system: new Error('Shutdown already in progress') },
        duration: 0,
        forced: false
      };
    }

    this.isShuttingDown = true;
    const startTime = Date.now();
    const timeout = options.timeout ?? this.defaultTimeout;
    const reason = options.reason ?? 'Requested shutdown';

    this.logger.info('Initiating system shutdown', {
      reason,
      timeout,
      force: options.force
    });

    // Notify shutdown listeners
    this.notifyShutdownListeners(reason);

    // Determine shutdown order
    const shutdownOrder = this.determineShutdownOrder(options.order);

    // Create result object
    const result: ShutdownResult = {
      success: true,
      shutdownComponents: [],
      failedComponents: [],
      errors: {},
      duration: 0,
      forced: false
    };

    try {
      // Set shutdown timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          if (options.force) {
            this.logger.warn('Shutdown timeout reached, forcing shutdown');
            result.forced = true;
            resolve();
          } else {
            reject(new Error('Shutdown timeout reached'));
          }
        }, timeout);
      });

      // Shutdown components
      const shutdownPromise = this.shutdownComponents(shutdownOrder, result);

      // Wait for shutdown or timeout
      await Promise.race([shutdownPromise, timeoutPromise]);

      const endTime = Date.now();
      result.duration = endTime - startTime;

      if (result.failedComponents.length > 0) {
        this.logger.warn('Some components failed to shutdown', {
          components: result.failedComponents
        });
        result.success = false;
      } else {
        this.logger.info('System shutdown completed successfully', {
          duration: result.duration,
          components: result.shutdownComponents.length
        });
        result.success = true;
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      result.duration = endTime - startTime;
      result.success = false;

      if (error instanceof Error) {
        result.errors.system = error;
      } else {
        result.errors.system = new Error(String(error));
      }

      this.logger.error('System shutdown failed', {
        error,
        shutdownComponents: result.shutdownComponents,
        failedComponents: result.failedComponents
      });

      return result;
    } finally {
      this.isShuttingDown = false;
    }
  }

  /**
   * Add shutdown listener
   */
  addShutdownListener(listener: (reason: string) => void): void {
    this.shutdownListeners.push(listener);
  }

  /**
   * Remove shutdown listener
   */
  removeShutdownListener(listener: (reason: string) => void): void {
    const index = this.shutdownListeners.indexOf(listener);
    if (index !== -1) {
      this.shutdownListeners.splice(index, 1);
    }
  }

  /**
   * Check if shutdown is in progress
   */
  isInProgress(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Set default shutdown order
   */
  setShutdownOrder(order: string[]): void {
    this.shutdownOrder = [...order];
  }

  /**
   * Determine shutdown order
   */
  private determineShutdownOrder(customOrder?: string[]): string[] {
    if (customOrder && customOrder.length > 0) {
      return [...customOrder];
    }

    if (this.shutdownOrder.length > 0) {
      return [...this.shutdownOrder];
    }

    // Default shutdown order is reverse of component registration
    const componentIds = this.registry.getComponentIds();
    return [...componentIds].reverse();
  }

  /**
   * Shutdown components in order
   */
  private async shutdownComponents(
    componentIds: string[],
    result: ShutdownResult
  ): Promise<void> {
    for (const id of componentIds) {
      try {
        const component = this.registry.getComponent(id);
        if (!component) {
          this.logger.warn(`Component ${id} not found, skipping shutdown`);
          continue;
        }

        if (typeof component.shutdown !== 'function') {
          this.logger.debug(`Component ${id} does not implement shutdown, skipping`);
          result.shutdownComponents.push(id);
          continue;
        }

        this.logger.debug(`Shutting down component: ${id}`);
        await component.shutdown();
        result.shutdownComponents.push(id);
        this.logger.debug(`Component shutdown complete: ${id}`);
      } catch (error) {
        result.failedComponents.push(id);
        result.errors[id] = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Failed to shutdown component: ${id}`, { error });
      }
    }
  }

  /**
   * Notify shutdown listeners
   */
  private notifyShutdownListeners(reason: string): void {
    for (const listener of this.shutdownListeners) {
      try {
        listener(reason);
      } catch (error) {
        this.logger.error('Error in shutdown listener', { error });
      }
    }
  }
}

// Helper function to resolve a promise after timeout
function resolve(): void {
  // This is intentionally empty
}
