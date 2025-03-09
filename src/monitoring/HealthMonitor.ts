export interface MetricData {
  [key: string]: any;
}

export interface HealthMetric {
  name: string;
  value: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
  lastUpdated: number;
  metrics: HealthMetric[];
}

export interface HealthMonitor {
  /**
   * Record a metric with optional metadata
   */
  recordMetric(name: string, data: MetricData): void;

  /**
   * Get the current health status
   */
  getStatus(): HealthStatus;

  /**
   * Get metrics within a time range
   */
  getMetrics(startTime?: number, endTime?: number): HealthMetric[];

  /**
   * Reset all metrics
   */
  reset(): void;
}

export class BaseHealthMonitor implements HealthMonitor {
  private metrics: HealthMetric[] = [];
  private status: HealthStatus = {
    status: "healthy",
    lastUpdated: Date.now(),
    metrics: [],
  };

  recordMetric(name: string, data: MetricData): void {
    const metric: HealthMetric = {
      name,
      value: data,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    this.updateStatus(metric);
  }

  getStatus(): HealthStatus {
    return { ...this.status };
  }

  getMetrics(startTime?: number, endTime?: number): HealthMetric[] {
    return this.metrics.filter((metric) => {
      if (startTime && metric.timestamp < startTime) return false;
      if (endTime && metric.timestamp > endTime) return false;
      return true;
    });
  }

  reset(): void {
    this.metrics = [];
    this.status = {
      status: "healthy",
      lastUpdated: Date.now(),
      metrics: [],
    };
  }

  private updateStatus(metric: HealthMetric): void {
    // Update status based on new metric
    // This is a simple implementation - you might want to make this more sophisticated
    if (metric.name.includes("error")) {
      this.status = {
        status: "degraded",
        message: "Errors detected in system",
        lastUpdated: Date.now(),
        metrics: [...this.getMetrics(Date.now() - 5 * 60 * 1000)], // Last 5 minutes
      };
    } else {
      this.status = {
        status: "healthy",
        lastUpdated: Date.now(),
        metrics: [...this.getMetrics(Date.now() - 5 * 60 * 1000)],
      };
    }
  }
}
