/**
 * SystemHealthMonitor
 *
 * Service for monitoring overall system health
 */
import { Logger } from '../../utils/logger';
import { ComponentRegistry, ComponentHealth } from './ComponentRegistry';

// Define system health status
export type SystemStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

// Define component status (to match ComponentHealth)
export type ComponentStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

// Define system health metrics
export interface SystemHealthMetrics {
  totalComponents: number;
  healthyComponents: number;
  degradedComponents: number;
  unhealthyComponents: number;
  unknownComponents: number;
  healthyPercentage: number;
  criticalComponentsHealthy: number;
  criticalComponentsTotal: number;
  criticalHealthPercentage: number;
  lastCheckTimestamp: number;
}

// Define system health
export interface SystemHealth {
  status: SystemStatus;
  metrics: SystemHealthMetrics;
  healthyComponents: string[];
  degradedComponents: string[];
  unhealthyComponents: string[];
  unknownComponents: string[];
  issues: string[];
  lastChecked: Date;
}

// Define health check options
export interface HealthCheckOptions {
  includeDetails?: boolean;
  checkCriticalOnly?: boolean;
  componentIds?: string[];
}

export class SystemHealthMonitor {
  private registry: ComponentRegistry;
  private logger: Logger;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthHistory: SystemHealth[] = [];
  private maxHistorySize = 100;
  private checkIntervalMs = 60000; // 1 minute
  private lastHealth: SystemHealth | null = null;
  private healthListeners: ((health: SystemHealth) => void)[] = [];

  constructor(registry: ComponentRegistry) {
    this.registry = registry;
    this.logger = new Logger({ namespace: 'system-health-monitor' });
  }

  /**
   * Start health monitoring
   */
  startMonitoring(intervalMs = this.checkIntervalMs): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.checkIntervalMs = intervalMs;
    this.monitoringInterval = setInterval(() => {
      this.checkHealth()
        .then(health => {
          this.updateHealthHistory(health);
          this.notifyHealthListeners(health);
        })
        .catch(error => {
          this.logger.error('Error checking system health', { error });
        });
    }, this.checkIntervalMs);

    this.logger.info('Started health monitoring', {
      intervalMs: this.checkIntervalMs
    });

    // Perform initial health check
    this.checkHealth()
      .then(health => {
        this.updateHealthHistory(health);
        this.notifyHealthListeners(health);
      })
      .catch(error => {
        this.logger.error('Error performing initial health check', { error });
      });
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.info('Stopped health monitoring');
    }
  }

  /**
   * Check system health
   */
  async checkHealth(options: HealthCheckOptions = {}): Promise<SystemHealth> {
    const startTime = Date.now();

    try {
      // Get component health
      const componentHealth = this.getComponentsHealth(options);

      // Calculate metrics
      const metrics = this.calculateHealthMetrics(componentHealth);

      // Determine overall status
      const status = this.determineSystemStatus(metrics);

      // Identify issues
      const issues = this.identifyHealthIssues(componentHealth);

      // Create health report
      const health: SystemHealth = {
        status,
        metrics,
        healthyComponents: Object.keys(componentHealth).filter(
          id => componentHealth[id].status === 'healthy'
        ),
        degradedComponents: Object.keys(componentHealth).filter(
          id => componentHealth[id].status === 'degraded'
        ),
        unhealthyComponents: Object.keys(componentHealth).filter(
          id => componentHealth[id].status === 'unhealthy'
        ),
        unknownComponents: Object.keys(componentHealth).filter(
          id => componentHealth[id].status === 'unknown'
        ),
        issues,
        lastChecked: new Date()
      };

      const duration = Date.now() - startTime;
      this.logger.debug('Health check completed', {
        status: health.status,
        healthyPercentage: metrics.healthyPercentage.toFixed(2),
        duration
      });

      this.lastHealth = health;
      return health;
    } catch (error) {
      this.logger.error('Health check failed', { error });

      // Return unknown status if health check fails
      const unknownHealth: SystemHealth = {
        status: 'unknown',
        metrics: {
          totalComponents: 0,
          healthyComponents: 0,
          degradedComponents: 0,
          unhealthyComponents: 0,
          unknownComponents: 0,
          healthyPercentage: 0,
          criticalComponentsHealthy: 0,
          criticalComponentsTotal: 0,
          criticalHealthPercentage: 0,
          lastCheckTimestamp: Date.now()
        },
        healthyComponents: [],
        degradedComponents: [],
        unhealthyComponents: [],
        unknownComponents: [],
        issues: [`Health check failed: ${error instanceof Error ? error.message : String(error)}`],
        lastChecked: new Date()
      };

      this.lastHealth = unknownHealth;
      return unknownHealth;
    }
  }

  /**
   * Get the most recent health check result
   */
  getLastHealth(): SystemHealth | null {
    return this.lastHealth;
  }

  /**
   * Get health history
   */
  getHealthHistory(): SystemHealth[] {
    return [...this.healthHistory];
  }

  /**
   * Add health listener
   */
  addHealthListener(listener: (health: SystemHealth) => void): void {
    this.healthListeners.push(listener);
  }

  /**
   * Remove health listener
   */
  removeHealthListener(listener: (health: SystemHealth) => void): void {
    const index = this.healthListeners.indexOf(listener);
    if (index !== -1) {
      this.healthListeners.splice(index, 1);
    }
  }

  /**
   * Get component health
   */
  private getComponentsHealth(options: HealthCheckOptions): Record<string, ComponentHealth> {
    const componentIds = options.componentIds || this.registry.getComponentIds();
    const result: Record<string, ComponentHealth> = {};

    for (const id of componentIds) {
      // Skip non-critical components if checkCriticalOnly is true
      if (options.checkCriticalOnly && !this.registry.isComponentCritical(id)) {
        continue;
      }

      const health = this.registry.getComponentHealth(id);
      if (health) {
        result[id] = health;
      } else {
        // Component doesn't implement checkHealth
        result[id] = { status: 'unknown' };
      }
    }

    return result;
  }

  /**
   * Calculate health metrics
   */
  private calculateHealthMetrics(
    componentHealth: Record<string, ComponentHealth>
  ): SystemHealthMetrics {
    const componentIds = Object.keys(componentHealth);
    const totalComponents = componentIds.length;

    // Count components by status
    const healthyComponents = componentIds.filter(
      id => componentHealth[id].status === 'healthy'
    ).length;

    const degradedComponents = componentIds.filter(
      id => componentHealth[id].status === 'degraded'
    ).length;

    const unhealthyComponents = componentIds.filter(
      id => componentHealth[id].status === 'unhealthy'
    ).length;

    const unknownComponents = componentIds.filter(
      id => componentHealth[id].status === 'unknown'
    ).length;

    // Calculate percentages
    const healthyPercentage = totalComponents > 0
      ? (healthyComponents / totalComponents) * 100
      : 0;

    // Calculate critical component metrics
    const criticalComponentIds = componentIds.filter(
      id => this.registry.isComponentCritical(id)
    );

    const criticalComponentsTotal = criticalComponentIds.length;
    const criticalComponentsHealthy = criticalComponentIds.filter(
      id => componentHealth[id].status === 'healthy'
    ).length;

    const criticalHealthPercentage = criticalComponentsTotal > 0
      ? (criticalComponentsHealthy / criticalComponentsTotal) * 100
      : 0;

    return {
      totalComponents,
      healthyComponents,
      degradedComponents,
      unhealthyComponents,
      unknownComponents,
      healthyPercentage,
      criticalComponentsHealthy,
      criticalComponentsTotal,
      criticalHealthPercentage,
      lastCheckTimestamp: Date.now()
    };
  }

  /**
   * Determine system status based on metrics
   */
  private determineSystemStatus(metrics: SystemHealthMetrics): SystemStatus {
    // System is unhealthy if any critical component is unhealthy
    if (metrics.criticalComponentsTotal > 0 && metrics.criticalComponentsHealthy < metrics.criticalComponentsTotal) {
      return 'unhealthy';
    }

    // System is degraded if overall health is below 80%
    if (metrics.healthyPercentage < 80) {
      return 'degraded';
    }

    // System is healthy if all critical components are healthy and overall health is good
    if (metrics.criticalComponentsHealthy === metrics.criticalComponentsTotal && metrics.healthyPercentage >= 80) {
      return 'healthy';
    }

    // Default to unknown
    return 'unknown';
  }

  /**
   * Identify health issues
   */
  private identifyHealthIssues(componentHealth: Record<string, ComponentHealth>): string[] {
    const issues: string[] = [];

    // Check for unhealthy critical components
    for (const id of Object.keys(componentHealth)) {
      const health = componentHealth[id];
      const isCritical = this.registry.isComponentCritical(id);

      if (health.status === 'unhealthy') {
        const criticalPrefix = isCritical ? 'Critical ' : '';
        const errorMessage = health.error ? `: ${health.error.message}` : '';
        issues.push(`${criticalPrefix}Component ${id} is unhealthy${errorMessage}`);
      } else if (health.status === 'degraded') {
        const criticalPrefix = isCritical ? 'Critical ' : '';
        issues.push(`${criticalPrefix}Component ${id} is degraded`);
      }
    }

    return issues;
  }

  /**
   * Update health history
   */
  private updateHealthHistory(health: SystemHealth): void {
    this.healthHistory.push(health);

    // Trim history if it exceeds max size
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Notify health listeners
   */
  private notifyHealthListeners(health: SystemHealth): void {
    for (const listener of this.healthListeners) {
      try {
        listener(health);
      } catch (error) {
        this.logger.error('Error in health listener', { error });
      }
    }
  }
}
