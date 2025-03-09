import { ServiceRegistry } from "./service-registry";
import { ServiceHealth, ServiceStatus, ServiceMetrics } from "./types";
import { Logger } from "../utils/logger";

export interface HealthCheckResult {
  status: ServiceStatus;
  metrics: ServiceMetrics;
  lastChecked: Date;
  issues?: string[];
}

export interface HealthMonitorConfig {
  checkIntervalMs?: number;
  metricsRetentionCount?: number;
  criticalMemoryThreshold?: number;
  criticalErrorRate?: number;
}

export class ServiceHealthMonitor {
  private serviceRegistry: ServiceRegistry;
  private checkInterval: number;
  private metricsHistory: Map<string, ServiceMetrics[]> = new Map();
  private healthStatus: Map<string, ServiceHealth> = new Map();
  private logger: Logger;
  private intervalId?: NodeJS.Timeout;
  private readonly metricsRetentionCount: number;
  private readonly criticalMemoryThreshold: number;
  private readonly criticalErrorRate: number;

  constructor(
    serviceRegistry: ServiceRegistry,
    config: HealthMonitorConfig = {}
  ) {
    this.serviceRegistry = serviceRegistry;
    this.checkInterval = config.checkIntervalMs || 30000; // Default 30 seconds
    this.metricsRetentionCount = config.metricsRetentionCount || 100;
    this.criticalMemoryThreshold = config.criticalMemoryThreshold || 90; // 90%
    this.criticalErrorRate = config.criticalErrorRate || 0.1; // 10%
    this.logger = new Logger({ namespace: "service-health-monitor" });
  }

  async startMonitoring(): Promise<void> {
    if (this.intervalId) {
      this.logger.warn("Health monitor is already running");
      return;
    }

    this.logger.info("Starting health monitoring");
    await this.checkAllServices(); // Initial check

    this.intervalId = setInterval(async () => {
      await this.checkAllServices();
    }, this.checkInterval);
  }

  async stopMonitoring(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.logger.info("Health monitoring stopped");
    }
  }

  async checkAllServices(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();
    const serviceIds = this.serviceRegistry.getAllServiceIds();

    for (const id of serviceIds) {
      try {
        const result = await this.checkService(id);
        results.set(id, result);
      } catch (error) {
        this.logger.error(`Failed to check service ${id}`, { error });
        results.set(id, {
          status: ServiceStatus.ERROR,
          metrics: this.getEmptyMetrics(),
          lastChecked: new Date(),
          issues: [
            `Health check failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ],
        });
      }
    }

    return results;
  }

  private async checkService(serviceId: string): Promise<HealthCheckResult> {
    const service = await this.serviceRegistry.getService(serviceId);
    const status = await service.getStatus();
    const metrics = await service.getMetrics();
    const lastChecked = new Date();
    const issues: string[] = [];

    // Store metrics history
    const history = this.metricsHistory.get(serviceId) || [];
    history.push(metrics);
    if (history.length > this.metricsRetentionCount) {
      history.shift();
    }
    this.metricsHistory.set(serviceId, history);

    // Analyze metrics for issues
    if (this.isMemoryUsageCritical(metrics)) {
      issues.push(
        `Critical memory usage: ${this.formatMemoryUsage(metrics.memoryUsage.heapUsed)}`
      );
    }

    if (this.isErrorRateCritical(metrics)) {
      issues.push(`High error rate: ${this.calculateErrorRate(metrics)}%`);
    }

    const result: HealthCheckResult = {
      status,
      metrics,
      lastChecked,
      issues: issues.length > 0 ? issues : undefined,
    };

    this.healthStatus.set(serviceId, {
      status,
      metrics,
      lastChecked,
    });

    return result;
  }

  private isMemoryUsageCritical(metrics: ServiceMetrics): boolean {
    // Assuming metrics.memoryUsage.heapUsed is in bytes and we know the total available memory
    // This is a simplified check - in practice you'd want to compare against system memory
    if (!metrics.memoryUsage || !metrics.memoryUsage.heapTotal) {
      return false;
    }

    // Check if heap usage is above the critical threshold percentage
    const usagePercentage = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    return usagePercentage > this.criticalMemoryThreshold;
  }

  private isErrorRateCritical(metrics: ServiceMetrics): boolean {
    if (metrics.requestCount === 0) return false;
    return metrics.errorCount / metrics.requestCount > this.criticalErrorRate;
  }

  private calculateErrorRate(metrics: ServiceMetrics): number {
    if (metrics.requestCount === 0) return 0;
    return (metrics.errorCount / metrics.requestCount) * 100;
  }

  private formatMemoryUsage(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  private getEmptyMetrics(): ServiceMetrics {
    return {
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      },
      resourceUsage: {
        memory: 0,
        cpu: 0
      },
      processingTime: 0,
      requestCount: 0,
      errorCount: 0,
      successCount: 0,
      averageResponseTime: 0
    };
  }

  getServiceHealth(serviceId: string): ServiceHealth | undefined {
    return this.healthStatus.get(serviceId);
  }

  getMetricsHistory(serviceId: string): ServiceMetrics[] {
    return this.metricsHistory.get(serviceId) || [];
  }

  getAllServicesHealth(): Map<string, ServiceHealth> {
    return new Map(this.healthStatus);
  }

  clearMetricsHistory(serviceId?: string): void {
    if (serviceId) {
      this.metricsHistory.delete(serviceId);
    } else {
      this.metricsHistory.clear();
    }
  }
}
