/**
 * SystemInitializer
 *
 * Service for initializing all system components in the correct order
 */
import { Logger } from '../../utils/logger';
import { ComponentRegistry } from './ComponentRegistry';
import { SystemHealthMonitor } from './SystemHealthMonitor';

// Define initialization options
export interface InitializationOptions {
  // Whether to initialize critical components only
  criticalOnly?: boolean;

  // Component IDs to initialize (overrides criticalOnly)
  componentIds?: string[];

  // Timeout in milliseconds
  timeoutMs?: number;

  // Whether to continue on error
  continueOnError?: boolean;

  // Whether to check health after initialization
  checkHealth?: boolean;
}

// Define initialization result
export interface InitializationResult {
  // Whether initialization was successful
  success: boolean;

  // Initialized components
  initializedComponents: string[];

  // Failed components
  failedComponents: string[];

  // Errors
  errors: Record<string, Error>;

  // Duration in milliseconds
  durationMs: number;

  // System health after initialization (if checked)
  health?: any;
}

export class SystemInitializer {
  private registry: ComponentRegistry;
  private healthMonitor: SystemHealthMonitor;
  private logger: Logger;
  private isInitializing = false;
  private defaultTimeout = 60000; // 60 seconds
  private initializationListeners: ((result: InitializationResult) => void)[] = [];

  constructor(registry: ComponentRegistry, healthMonitor: SystemHealthMonitor) {
    this.registry = registry;
    this.healthMonitor = healthMonitor;
    this.logger = new Logger({ namespace: 'system-initializer' });
  }

  /**
   * Initialize system components
   */
  async initialize(options: InitializationOptions = {}): Promise<InitializationResult> {
    if (this.isInitializing) {
      this.logger.warn('Initialization already in progress');
      return {
        success: false,
        initializedComponents: [],
        failedComponents: [],
        errors: { system: new Error('Initialization already in progress') },
        durationMs: 0
      };
    }

    this.isInitializing = true;
    const startTime = Date.now();
    const timeout = options.timeoutMs ?? this.defaultTimeout;

    this.logger.info('Initializing system components', {
      criticalOnly: options.criticalOnly,
      componentIds: options.componentIds,
      timeout
    });

    // Determine components to initialize
    const componentsToInitialize = this.determineComponentsToInitialize(options);

    // Create result object
    const result: InitializationResult = {
      success: true,
      initializedComponents: [],
      failedComponents: [],
      errors: {},
      durationMs: 0
    };

    try {
      // Set initialization timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Initialization timeout after ${timeout}ms`));
        }, timeout);
      });

      // Initialize components
      const initPromise = this.initializeComponents(componentsToInitialize, result, options);

      // Wait for initialization or timeout
      await Promise.race([initPromise, timeoutPromise]);

      const endTime = Date.now();
      result.durationMs = endTime - startTime;

      // Check health if requested
      if (options.checkHealth) {
        try {
          result.health = await this.healthMonitor.checkHealth();
        } catch (error) {
          this.logger.error('Error checking health after initialization', { error });
        }
      }

      // Determine success
      result.success = result.failedComponents.length === 0;

      // Notify listeners
      this.notifyInitializationListeners(result);

      if (result.success) {
        this.logger.info('System initialization completed successfully', {
          components: result.initializedComponents.length,
          durationMs: result.durationMs
        });
      } else {
        this.logger.warn('System initialization completed with errors', {
          initialized: result.initializedComponents.length,
          failed: result.failedComponents.length,
          durationMs: result.durationMs
        });
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      result.durationMs = endTime - startTime;
      result.success = false;

      if (error instanceof Error) {
        result.errors.system = error;
      } else {
        result.errors.system = new Error(String(error));
      }

      this.logger.error('System initialization failed', {
        error,
        initialized: result.initializedComponents.length,
        failed: result.failedComponents.length,
        durationMs: result.durationMs
      });

      // Notify listeners
      this.notifyInitializationListeners(result);

      return result;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Add initialization listener
   */
  addInitializationListener(listener: (result: InitializationResult) => void): void {
    this.initializationListeners.push(listener);
  }

  /**
   * Remove initialization listener
   */
  removeInitializationListener(listener: (result: InitializationResult) => void): void {
    const index = this.initializationListeners.indexOf(listener);
    if (index !== -1) {
      this.initializationListeners.splice(index, 1);
    }
  }

  /**
   * Check if initialization is in progress
   */
  isInProgress(): boolean {
    return this.isInitializing;
  }

  /**
   * Determine components to initialize
   */
  private determineComponentsToInitialize(options: InitializationOptions): string[] {
    if (options.componentIds && options.componentIds.length > 0) {
      // Use specified component IDs
      return [...options.componentIds];
    }

    if (options.criticalOnly) {
      // Initialize critical components only
      return this.registry.getCriticalComponents();
    }

    // Initialize all components in dependency order
    return this.registry.getInitializationOrder();
  }

  /**
   * Initialize components
   */
  private async initializeComponents(
    componentIds: string[],
    result: InitializationResult,
    options: InitializationOptions
  ): Promise<void> {
    for (const id of componentIds) {
      try {
        const component = this.registry.getComponent(id);
        if (!component) {
          this.logger.warn(`Component ${id} not found, skipping initialization`);
          continue;
        }

        if (typeof component.initialize !== 'function') {
          this.logger.debug(`Component ${id} does not implement initialize, skipping`);
          result.initializedComponents.push(id);
          continue;
        }

        this.logger.debug(`Initializing component: ${id}`);
        await component.initialize();
        result.initializedComponents.push(id);
        this.logger.debug(`Component initialized: ${id}`);
      } catch (error) {
        result.failedComponents.push(id);
        result.errors[id] = error instanceof Error ? error : new Error(String(error));

        this.logger.error(`Failed to initialize component: ${id}`, { error });

        // Stop initialization if continueOnError is false
        if (!options.continueOnError) {
          this.logger.error('Stopping initialization due to error');
          break;
        }
      }
    }
  }

  /**
   * Notify initialization listeners
   */
  private notifyInitializationListeners(result: InitializationResult): void {
    for (const listener of this.initializationListeners) {
      try {
        listener(result);
      } catch (error) {
        this.logger.error('Error in initialization listener', { error });
      }
    }
  }
}
