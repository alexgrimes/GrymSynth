/**
 * Metric data that can be recorded by the health monitor
 */
export type MetricData = Record<string, string | number | boolean | object>;

/**
 * System for monitoring health and performance metrics
 */
export class HealthMonitor {
  /**
   * Record a metric event
   * @param name Name of the metric
   * @param data Additional data for the metric (optional)
   */
  recordMetric(name: string, data?: Partial<MetricData>): void {
    try {
      // Filter out undefined values from data
      const cleanData = data
        ? Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
          )
        : {};

      // Implementation would record metric to monitoring system
      // For now just log to console
      console.log("[Metric]", name, cleanData);
    } catch (error) {
      // Avoid recursive error reporting
      console.error("[HealthMonitor] Failed to record metric:", error);
    }
  }

  /**
   * Start timing an operation
   * @param name Name of the operation
   */
  startTimer(name: string): void {
    this.recordMetric(`${name}.start`);
  }

  /**
   * End timing an operation and record duration
   * @param name Name of the operation
   */
  endTimer(name: string): void {
    this.recordMetric(`${name}.end`);
  }

  /**
   * Record an error event
   * @param name Name of the error
   * @param error Error object or message
   * @param data Additional context data
   */
  recordError(name: string, error: Error | string, data?: MetricData): void {
    this.recordMetric(`error.${name}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...data,
    });
  }

  /**
   * Record a state change event
   * @param component Name of the component
   * @param fromState Previous state
   * @param toState New state
   * @param data Additional context data
   */
  recordStateChange(
    component: string,
    fromState: string,
    toState: string,
    data?: MetricData
  ): void {
    this.recordMetric(`state_change.${component}`, {
      fromState,
      toState,
      ...data,
    });
  }
}
