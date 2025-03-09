/**
 * ComponentRegistry
 *
 * Registry for managing all system components
 */
import { Logger } from '../../utils/logger';

// Define system component
export interface SystemComponent {
  // Initialize component
  initialize?: () => Promise<void>;

  // Shutdown component
  shutdown?: () => Promise<void>;

  // Check component health
  checkHealth?: () => ComponentHealth;

  // Additional methods and properties
  [key: string]: any;
}

// Define component health
export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  details?: Record<string, any>;
  error?: Error;
}

// Define component registration options
export interface ComponentRegistrationOptions {
  // Whether the component is critical for system operation
  isCritical?: boolean;

  // Component dependencies
  dependencies?: string[];

  // Component tags for categorization
  tags?: string[];

  // Component metadata
  metadata?: Record<string, any>;
}

export class ComponentRegistry {
  private logger: Logger;
  private components: Map<string, SystemComponent> = new Map();
  private componentOptions: Map<string, ComponentRegistrationOptions> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private reverseDependencyGraph: Map<string, Set<string>> = new Map();

  constructor() {
    this.logger = new Logger({ namespace: 'component-registry' });
  }

  /**
   * Register a component
   */
  registerComponent(
    id: string,
    component: SystemComponent,
    options: ComponentRegistrationOptions = {}
  ): void {
    if (this.components.has(id)) {
      this.logger.warn(`Component already registered: ${id}, replacing`);
    }

    this.components.set(id, component);
    this.componentOptions.set(id, options);

    // Initialize dependency graphs
    if (!this.dependencyGraph.has(id)) {
      this.dependencyGraph.set(id, new Set());
    }

    if (!this.reverseDependencyGraph.has(id)) {
      this.reverseDependencyGraph.set(id, new Set());
    }

    // Register dependencies
    if (options.dependencies) {
      for (const dependency of options.dependencies) {
        // Add to dependency graph
        this.dependencyGraph.get(id)!.add(dependency);

        // Add to reverse dependency graph
        if (!this.reverseDependencyGraph.has(dependency)) {
          this.reverseDependencyGraph.set(dependency, new Set());
        }

        this.reverseDependencyGraph.get(dependency)!.add(id);
      }
    }

    this.logger.info(`Registered component: ${id}`, {
      isCritical: options.isCritical,
      dependencies: options.dependencies,
      tags: options.tags
    });
  }

  /**
   * Unregister a component
   */
  unregisterComponent(id: string): boolean {
    if (!this.components.has(id)) {
      this.logger.warn(`Component not found: ${id}`);
      return false;
    }

    // Check if other components depend on this one
    const dependents = this.reverseDependencyGraph.get(id);
    if (dependents && dependents.size > 0) {
      this.logger.warn(`Cannot unregister component ${id}, other components depend on it: ${Array.from(dependents).join(', ')}`);
      return false;
    }

    // Remove from components
    this.components.delete(id);
    this.componentOptions.delete(id);

    // Remove from dependency graphs
    this.dependencyGraph.delete(id);
    this.reverseDependencyGraph.delete(id);

    // Remove from other components' dependencies
    for (const dependencies of this.dependencyGraph.values()) {
      dependencies.delete(id);
    }

    this.logger.info(`Unregistered component: ${id}`);
    return true;
  }

  /**
   * Get a component
   */
  getComponent(id: string): SystemComponent | undefined {
    return this.components.get(id);
  }

  /**
   * Get component options
   */
  getComponentOptions(id: string): ComponentRegistrationOptions | undefined {
    return this.componentOptions.get(id);
  }

  /**
   * Get component IDs
   */
  getComponentIds(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Get component count
   */
  getComponentCount(): number {
    return this.components.size;
  }

  /**
   * Check if component is critical
   */
  isComponentCritical(id: string): boolean {
    const options = this.componentOptions.get(id);
    return options?.isCritical === true;
  }

  /**
   * Get critical components
   */
  getCriticalComponents(): string[] {
    return this.getComponentIds().filter(id => this.isComponentCritical(id));
  }

  /**
   * Get component dependencies
   */
  getComponentDependencies(id: string): string[] {
    const dependencies = this.dependencyGraph.get(id);
    return dependencies ? Array.from(dependencies) : [];
  }

  /**
   * Get component dependents
   */
  getComponentDependents(id: string): string[] {
    const dependents = this.reverseDependencyGraph.get(id);
    return dependents ? Array.from(dependents) : [];
  }

  /**
   * Get components by tag
   */
  getComponentsByTag(tag: string): string[] {
    return this.getComponentIds().filter(id => {
      const options = this.componentOptions.get(id);
      return options?.tags?.includes(tag);
    });
  }

  /**
   * Get component health
   */
  getComponentHealth(id: string): ComponentHealth | null {
    const component = this.components.get(id);

    if (!component) {
      return null;
    }

    if (typeof component.checkHealth !== 'function') {
      return { status: 'unknown' };
    }

    try {
      return component.checkHealth();
    } catch (error) {
      this.logger.error(`Error checking health for component ${id}`, { error });

      return {
        status: 'unhealthy',
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Get all component health
   */
  getAllComponentHealth(): Record<string, ComponentHealth> {
    const result: Record<string, ComponentHealth> = {};

    for (const id of this.getComponentIds()) {
      const health = this.getComponentHealth(id);
      if (health) {
        result[id] = health;
      }
    }

    return result;
  }

  /**
   * Get initialization order
   */
  getInitializationOrder(): string[] {
    return this.topologicalSort();
  }

  /**
   * Get shutdown order
   */
  getShutdownOrder(): string[] {
    // Shutdown order is reverse of initialization order
    return this.topologicalSort().reverse();
  }

  /**
   * Perform topological sort of components based on dependencies
   */
  private topologicalSort(): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    // Get all component IDs
    const componentIds = this.getComponentIds();

    // Define recursive visit function
    const visit = (id: string): void => {
      // Check if already visited
      if (visited.has(id)) {
        return;
      }

      // Check for circular dependency
      if (temp.has(id)) {
        this.logger.error(`Circular dependency detected involving component: ${id}`);
        return;
      }

      // Mark as temporarily visited
      temp.add(id);

      // Visit dependencies
      const dependencies = this.getComponentDependencies(id);
      for (const dependency of dependencies) {
        // Skip if dependency doesn't exist
        if (!this.components.has(dependency)) {
          this.logger.warn(`Component ${id} depends on non-existent component: ${dependency}`);
          continue;
        }

        visit(dependency);
      }

      // Mark as visited
      temp.delete(id);
      visited.add(id);

      // Add to result
      result.push(id);
    };

    // Visit all components
    for (const id of componentIds) {
      if (!visited.has(id)) {
        visit(id);
      }
    }

    return result;
  }
}
