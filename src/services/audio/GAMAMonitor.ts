import { Logger } from "../../utils/logger";
import { v4 as uuidv4 } from 'uuid';

export interface MonitorConfig {
  metricsConfig: MetricsConfig;
  alertConfig: AlertConfig;
  logConfig?: any;
}

export interface MetricsConfig {
  collectionIntervalMs: number;
  operationThresholds: {
    [operation: string]: {
      duration: number;
    }
  };
  metricThresholds: {
    memory: {
      used: number;
      percentage: number;
    };
    cpu: {
      system: number;
      process: number;
    }
  };
}

export interface AlertConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    server: string;
    from: string;
  };
  slack?: {
    enabled: boolean;
    webhook: string;
    channel: string;
  };
  pagerDuty?: {
    enabled: boolean;
    serviceKey: string;
    severity: string;
  };
  historyConfig: {
    maxAlerts: number;
  };
}

export interface MonitoringHandle {
  operationId: string;
  end: (result?: any) => Promise<OperationResult>;
}

export interface OperationResult {
  operationId: string;
  duration: number;
  status: string;
}

export interface SystemMetrics {
  timestamp: number;
  memory: MemoryMetrics;
  cpu: CpuMetrics;
}

export interface MemoryMetrics {
  total: number;
  used: number;
  rss: number;
}

export interface CpuMetrics {
  system: number;
  process: number;
}

export interface MetricsReport {
  timeRange?: TimeRange;
  operations: {
    [operation: string]: OperationMetrics;
  };
  system: {
    memory: MemoryTrend;
    cpu: CpuTrend;
  };
  alerts: AlertSummary;
  timestamp: Date;
}

export interface OperationMetrics {
  count: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
  p95Duration: number;
  trend: DurationTrend;
}

export interface MemoryTrend {
  average: number;
  peak: number;
  trend: number;
}

export interface CpuTrend {
  average: number;
  peak: number;
  trend: number;
}

export interface DurationTrend {
  direction: 'improving' | 'degrading' | 'stable';
  change: number;
}

export interface AlertSummary {
  total: number;
  byType: {
    [type: string]: number;
  };
  recent: Alert[];
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface Alert {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  status: 'new' | 'acknowledged' | 'resolved';
}

export interface AlertHandler {
  name: string;
  handleAlert(alert: Alert): Promise<void>;
}

/**
 * Email alert handler
 */
export class EmailAlertHandler implements AlertHandler {
  name = 'email';
  private config: AlertConfig['email'];
  private logger: Logger;

  constructor(config: AlertConfig['email']) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-monitor-email" });
  }

  async handleAlert(alert: Alert): Promise<void> {
    if (!this.config?.enabled) return;

    try {
      this.logger.info(`Sending email alert: ${alert.type}`, {
        recipients: this.config.recipients,
        alertId: alert.id
      });

      // In a real implementation, this would send an email
      // For now, we'll just log it
      this.logger.info(`[EMAIL ALERT] ${alert.type}`, {
        to: this.config.recipients.join(', '),
        from: this.config.from,
        subject: `GAMA Alert: ${alert.type}`,
        body: JSON.stringify(alert.data, null, 2)
      });
    } catch (error) {
      this.logger.error("Failed to send email alert", {
        error: error instanceof Error ? error.message : String(error),
        alertId: alert.id
      });
    }
  }
}

/**
 * Slack alert handler
 */
export class SlackAlertHandler implements AlertHandler {
  name = 'slack';
  private config: AlertConfig['slack'];
  private logger: Logger;

  constructor(config: AlertConfig['slack']) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-monitor-slack" });
  }

  async handleAlert(alert: Alert): Promise<void> {
    if (!this.config?.enabled) return;

    try {
      this.logger.info(`Sending Slack alert: ${alert.type}`, {
        channel: this.config.channel,
        alertId: alert.id
      });

      // In a real implementation, this would send a Slack message
      // For now, we'll just log it
      this.logger.info(`[SLACK ALERT] ${alert.type}`, {
        channel: this.config.channel,
        text: `GAMA Alert: ${alert.type}\n\`\`\`${JSON.stringify(alert.data, null, 2)}\`\`\``
      });
    } catch (error) {
      this.logger.error("Failed to send Slack alert", {
        error: error instanceof Error ? error.message : String(error),
        alertId: alert.id
      });
    }
  }
}

/**
 * PagerDuty alert handler
 */
export class PagerDutyAlertHandler implements AlertHandler {
  name = 'pagerduty';
  private config: AlertConfig['pagerDuty'];
  private logger: Logger;

  constructor(config: AlertConfig['pagerDuty']) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-monitor-pagerduty" });
  }

  async handleAlert(alert: Alert): Promise<void> {
    if (!this.config?.enabled) return;

    try {
      this.logger.info(`Sending PagerDuty alert: ${alert.type}`, {
        severity: this.config.severity,
        alertId: alert.id
      });

      // In a real implementation, this would trigger a PagerDuty incident
      // For now, we'll just log it
      this.logger.info(`[PAGERDUTY ALERT] ${alert.type}`, {
        serviceKey: this.config.serviceKey,
        severity: this.config.severity,
        summary: `GAMA Alert: ${alert.type}`,
        details: JSON.stringify(alert.data, null, 2)
      });
    } catch (error) {
      this.logger.error("Failed to send PagerDuty alert", {
        error: error instanceof Error ? error.message : String(error),
        alertId: alert.id
      });
    }
  }
}

/**
 * Alert history storage
 */
export class AlertHistory {
  private alerts: Alert[] = [];
  private config: AlertConfig['historyConfig'];
  private logger: Logger;

  constructor(config: AlertConfig['historyConfig']) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-monitor-alert-history" });
  }

  async recordAlert(alert: Alert): Promise<void> {
    try {
      // Add alert to history
      this.alerts.push(alert);

      // Prune old alerts if needed
      this.pruneAlerts();
    } catch (error) {
      this.logger.error("Error recording alert", {
        error: error instanceof Error ? error.message : String(error),
        alertId: alert.id
      });
    }
  }

  async getAlerts(limit?: number): Promise<Alert[]> {
    try {
      // Sort by timestamp (newest first)
      const sorted = [...this.alerts].sort((a, b) =>
        b.timestamp.getTime() - a.timestamp.getTime()
      );

      // Return limited number if requested
      return limit ? sorted.slice(0, limit) : sorted;
    } catch (error) {
      this.logger.error("Error retrieving alerts", {
        error: error instanceof Error ? error.message : String(error)
      });

      return [];
    }
  }

  async getAlertsByType(type: string): Promise<Alert[]> {
    try {
      return this.alerts.filter(alert => alert.type === type);
    } catch (error) {
      this.logger.error("Error retrieving alerts by type", {
        error: error instanceof Error ? error.message : String(error),
        type
      });

      return [];
    }
  }

  private pruneAlerts(): void {
    if (this.alerts.length > this.config.maxAlerts) {
      // Sort by timestamp (newest first)
      this.alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Keep only the most recent
      this.alerts = this.alerts.slice(0, this.config.maxAlerts);
    }
  }
}

/**
 * Metrics collector for GAMA operations
 */
export class MetricsCollector {
  config: MetricsConfig;
  private operationMetrics: Map<string, OperationData[]> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private logger: Logger;

  constructor(config: MetricsConfig) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-monitor-metrics" });
  }

  async recordOperationStart(operation: string, operationId: string, context: any): Promise<void> {
    try {
      // Get existing metrics for this operation
      const metrics = this.operationMetrics.get(operation) || [];

      // Add new operation data
      metrics.push({
        id: operationId,
        startTime: Date.now(),
        context,
        status: 'running'
      });

      // Store updated metrics
      this.operationMetrics.set(operation, metrics);
    } catch (error) {
      this.logger.error("Error recording operation start", {
        error: error instanceof Error ? error.message : String(error),
        operation,
        operationId
      });
    }
  }

  async recordOperationEnd(operation: string, operationId: string, result: any): Promise<void> {
    try {
      // Get existing metrics for this operation
      const metrics = this.operationMetrics.get(operation) || [];

      // Find the operation data
      const operationData = metrics.find(data => data.id === operationId);

      if (operationData) {
        // Update operation data
        operationData.endTime = Date.now();
        operationData.duration = operationData.endTime - operationData.startTime;
        operationData.status = result.status || 'completed';
        operationData.result = result;

        // Store updated metrics
        this.operationMetrics.set(operation, metrics);
      } else {
        this.logger.warn("Operation not found for end recording", {
          operation,
          operationId
        });
      }
    } catch (error) {
      this.logger.error("Error recording operation end", {
        error: error instanceof Error ? error.message : String(error),
        operation,
        operationId
      });
    }
  }

  async recordMetrics(operation: string, operationId: string, metrics: SystemMetrics): Promise<void> {
    try {
      // Add operation info to metrics
      const metricsWithOperation = {
        ...metrics,
        operation,
        operationId
      };

      // Add to system metrics
      this.systemMetrics.push(metricsWithOperation);

      // Prune old metrics if needed
      this.pruneMetrics();
    } catch (error) {
      this.logger.error("Error recording system metrics", {
        error: error instanceof Error ? error.message : String(error),
        operation,
        operationId
      });
    }
  }

  async generateReport(timeRange?: TimeRange): Promise<MetricsReport> {
    try {
      // Filter metrics by time range if provided
      let filteredSystemMetrics = this.systemMetrics;
      let filteredOperationMetrics = new Map(this.operationMetrics);

      if (timeRange) {
        const startTime = timeRange.start.getTime();
        const endTime = timeRange.end.getTime();

        // Filter system metrics
        filteredSystemMetrics = this.systemMetrics.filter(metric =>
          metric.timestamp >= startTime && metric.timestamp <= endTime
        );

        // Filter operation metrics
        filteredOperationMetrics = new Map();
        for (const [operation, metrics] of this.operationMetrics.entries()) {
          const filtered = metrics.filter(metric =>
            metric.startTime >= startTime &&
            (metric.endTime ? metric.endTime <= endTime : true)
          );

          if (filtered.length > 0) {
            filteredOperationMetrics.set(operation, filtered);
          }
        }
      }

      // Generate operation metrics
      const operations: { [operation: string]: OperationMetrics } = {};

      for (const [operation, metrics] of filteredOperationMetrics.entries()) {
        const completedMetrics = metrics.filter(m => m.status !== 'running' && m.duration !== undefined);

        if (completedMetrics.length === 0) continue;

        const durations = completedMetrics.map(m => m.duration!).sort((a, b) => a - b);
        const successCount = completedMetrics.filter(m => m.status === 'success' || m.status === 'completed').length;
        const errorCount = completedMetrics.filter(m => m.status === 'error' || m.status === 'failed').length;

        // Calculate p95 duration
        const p95Index = Math.floor(durations.length * 0.95);
        const p95Duration = durations[p95Index] || durations[durations.length - 1] || 0;

        // Calculate average duration
        const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
        const averageDuration = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0;

        // Calculate trend
        const trend = this.calculateDurationTrend(completedMetrics);

        operations[operation] = {
          count: completedMetrics.length,
          successCount,
          errorCount,
          averageDuration,
          p95Duration,
          trend
        };
      }

      // Generate system metrics
      const memoryMetrics = filteredSystemMetrics.map(m => m.memory.used);
      const cpuMetrics = filteredSystemMetrics.map(m => m.cpu.process);

      const memoryAverage = memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, value) => sum + value, 0) / memoryMetrics.length
        : 0;

      const cpuAverage = cpuMetrics.length > 0
        ? cpuMetrics.reduce((sum, value) => sum + value, 0) / cpuMetrics.length
        : 0;

      const memoryPeak = memoryMetrics.length > 0
        ? Math.max(...memoryMetrics)
        : 0;

      const cpuPeak = cpuMetrics.length > 0
        ? Math.max(...cpuMetrics)
        : 0;

      // Calculate memory trend
      const memoryTrend = this.calculateMetricTrend(filteredSystemMetrics.map(m => m.memory.used));

      // Calculate CPU trend
      const cpuTrend = this.calculateMetricTrend(filteredSystemMetrics.map(m => m.cpu.process));

      return {
        timeRange,
        operations,
        system: {
          memory: {
            average: memoryAverage,
            peak: memoryPeak,
            trend: memoryTrend
          },
          cpu: {
            average: cpuAverage,
            peak: cpuPeak,
            trend: cpuTrend
          }
        },
        alerts: await this.generateAlertSummary(),
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error("Error generating metrics report", {
        error: error instanceof Error ? error.message : String(error)
      });

      // Return empty report
      return {
        timeRange,
        operations: {},
        system: {
          memory: {
            average: 0,
            peak: 0,
            trend: 0
          },
          cpu: {
            average: 0,
            peak: 0,
            trend: 0
          }
        },
        alerts: {
          total: 0,
          byType: {},
          recent: []
        },
        timestamp: new Date()
      };
    }
  }

  private async generateAlertSummary(): Promise<AlertSummary> {
    // This would normally fetch from AlertHistory
    // For now, return empty summary
    return {
      total: 0,
      byType: {},
      recent: []
    };
  }

  private calculateDurationTrend(metrics: OperationData[]): DurationTrend {
    if (metrics.length < 2) {
      return { direction: 'stable', change: 0 };
    }

    // Sort by timestamp
    const sorted = [...metrics].sort((a, b) => a.startTime - b.startTime);

    // Split into two halves
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    // Calculate average duration for each half
    const firstHalfDurations = firstHalf.map(m => m.duration!);
    const secondHalfDurations = secondHalf.map(m => m.duration!);

    const firstHalfAvg = firstHalfDurations.reduce((sum, d) => sum + d, 0) / firstHalfDurations.length;
    const secondHalfAvg = secondHalfDurations.reduce((sum, d) => sum + d, 0) / secondHalfDurations.length;

    const change = firstHalfAvg - secondHalfAvg;
    const percentChange = (change / firstHalfAvg) * 100;

    return {
      direction: percentChange > 5 ? 'improving' : percentChange < -5 ? 'degrading' : 'stable',
      change: percentChange
    };
  }

  private calculateMetricTrend(values: number[]): number {
    if (values.length < 2) {
      return 0;
    }

    // Split into two halves
    const midpoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);

    // Calculate average for each half
    const firstHalfAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    // Calculate percentage change
    return ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  }

  private pruneMetrics(): void {
    // Limit the number of system metrics stored
    const maxMetrics = 1000; // Arbitrary limit

    if (this.systemMetrics.length > maxMetrics) {
      this.systemMetrics = this.systemMetrics.slice(-maxMetrics);
    }

    // Prune operation metrics
    for (const [operation, metrics] of this.operationMetrics.entries()) {
      if (metrics.length > maxMetrics) {
        // Keep the most recent metrics
        this.operationMetrics.set(operation, metrics.slice(-maxMetrics));
      }
    }
  }
}

/**
 * Operation data for metrics collection
 */
interface OperationData {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  context: any;
  status: string;
  result?: any;
}

/**
 * Alert system for GAMA monitoring
 */
export class AlertSystem {
  private alertHandlers: Map<string, AlertHandler[]> = new Map();
  private alertHistory: AlertHistory;
  private logger: Logger;

  constructor(config: AlertConfig) {
    this.logger = new Logger({ namespace: "gama-monitor-alerts" });
    this.alertHistory = new AlertHistory(config.historyConfig);
    this.registerDefaultHandlers(config);
  }

  async sendAlert(type: string, data: any): Promise<void> {
    try {
      const alert: Alert = {
        id: uuidv4(),
        type,
        data,
        timestamp: new Date(),
        status: 'new'
      };

      this.logger.warn(`Alert triggered: ${type}`, data);

      // Record the alert
      await this.alertHistory.recordAlert(alert);

      // Process the alert with handlers
      const specificHandlers = this.alertHandlers.get(type) || [];
      const wildcardHandlers = this.alertHandlers.get('*') || [];

      const handlers = [...specificHandlers, ...wildcardHandlers];

      for (const handler of handlers) {
        try {
          await handler.handleAlert(alert);
        } catch (error) {
          this.logger.error(`Error in alert handler: ${error instanceof Error ? error.message : String(error)}`, {
            alertType: type,
            alertId: alert.id,
            handlerName: handler.name
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error sending alert: ${error instanceof Error ? error.message : String(error)}`, {
        alertType: type
      });
    }
  }

  registerHandler(type: string, handler: AlertHandler): void {
    try {
      // Get existing handlers for this type
      const handlers = this.alertHandlers.get(type) || [];

      // Add new handler
      handlers.push(handler);

      // Store updated handlers
      this.alertHandlers.set(type, handlers);
    } catch (error) {
      this.logger.error(`Error registering alert handler: ${error instanceof Error ? error.message : String(error)}`, {
        alertType: type,
        handlerName: handler.name
      });
    }
  }

  private registerDefaultHandlers(config: AlertConfig): void {
    try {
      // Register default handlers based on configuration
      if (config.email?.enabled) {
        this.registerHandler('*', new EmailAlertHandler(config.email));
      }

      if (config.slack?.enabled) {
        this.registerHandler('*', new SlackAlertHandler(config.slack));
      }

      if (config.pagerDuty?.enabled) {
        // Register PagerDuty only for critical alerts
        this.registerHandler('HighMemoryUsage', new PagerDutyAlertHandler(config.pagerDuty));
        this.registerHandler('HighCpuUsage', new PagerDutyAlertHandler(config.pagerDuty));
        this.registerHandler('ServiceDown', new PagerDutyAlertHandler(config.pagerDuty));
      }
    } catch (error) {
      this.logger.error(`Error registering default handlers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Main monitoring system for GAMA
 */
export class GAMAMonitor {
  private metrics: MetricsCollector;
  private logger: Logger;
  private alertSystem: AlertSystem;

  constructor(config: MonitorConfig) {
    this.metrics = new MetricsCollector(config.metricsConfig);
    this.logger = new Logger({ namespace: "gama-monitor" });
    this.alertSystem = new AlertSystem(config.alertConfig);
  }

  /**
   * Start monitoring an operation
   */
  async monitorOperation(operation: string, context: any): Promise<MonitoringHandle> {
    const operationId = uuidv4();

    this.logger.info(`Starting operation: ${operation}`, {
      operationId,
      ...context
    });

    // Record operation start
    await this.metrics.recordOperationStart(operation, operationId, context);

    // Start periodic metrics collection
    const intervalId = setInterval(async () => {
      await this.collectMetrics(operation, operationId, context);
    }, this.metrics.config.collectionIntervalMs);

    return {
      operationId,
      end: async (result?: any) => {
        clearInterval(intervalId);

        const duration = Date.now() - Date.now(); // This should be fixed to use the actual start time
        const status = result?.error ? 'error' : 'success';

        this.logger.info(`Completed operation: ${operation}`, {
          operationId,
          duration,
          status,
          ...context
        });

        // Record operation end
        await this.metrics.recordOperationEnd(operation, operationId, {
          duration,
          status,
          result
        });

        // Check for performance issues
        if (duration > this.metrics.config.operationThresholds[operation]?.duration) {
          await this.alertSystem.sendAlert('SlowOperation', {
            operation,
            operationId,
            duration,
            threshold: this.metrics.config.operationThresholds[operation].duration,
            context
          });
        }

        return {
          operationId,
          duration,
          status
        };
      }
    };
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(operation: string, operationId: string, context: any): Promise<void> {
    try {
      // Collect system metrics
      const systemMetrics = await this.getSystemMetrics();

      // Record metrics
      await this.metrics.recordMetrics(operation, operationId, systemMetrics);

      // Check for anomalies
      await this.checkForAnomalies(operation, operationId, systemMetrics, context);
    } catch (error) {
      this.logger.error(`Error collecting metrics: ${error instanceof Error ? error.message : String(error)}`, {
        operation,
        operationId,
        context
      });
    }
  }

  /**
   * Get system metrics (CPU, memory, etc.)
   */
  private async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get memory usage from Node.js process
      const memoryUsage = process.memoryUsage();

      return {
        timestamp: Date.now(),
        memory: {
          total: memoryUsage.heapTotal,
          used: memoryUsage.heapUsed,
          rss: memoryUsage.rss
        },
        cpu: await this.getCpuUsage()
      };
    } catch (error) {
      this.logger.error(`Error getting system metrics: ${error instanceof Error ? error.message : String(error)}`);

      // Return default metrics
      return {
        timestamp: Date.now(),
        memory: {
          total: 0,
          used: 0,
          rss: 0
        },
        cpu: {
          system: 0,
          process: 0
        }
      };
    }
  }

  /**
   * Get CPU usage (this is a placeholder implementation)
   */
  private async getCpuUsage(): Promise<CpuMetrics> {
    // In a real implementation, this would use a library like node-os-utils
    // For now, return placeholder values
    return {
      system: 0,
      process: 0
    };
  }

  /**
   * Check for anomalies in metrics
   */
  private async checkForAnomalies(
    operation: string,
    operationId: string,
    metrics: SystemMetrics,
    context: any
  ): Promise<void> {
    try {
      const thresholds = this.metrics.config.metricThresholds;

      // Check memory usage
      if (metrics.memory.used > thresholds.memory.used) {
        await this.alertSystem.sendAlert('HighMemoryUsage', {
          operation,
          operationId,
          memoryUsed: metrics.memory.used,
          memoryThreshold: thresholds.memory.used,
          context
        });
      }

      // Check CPU usage
      if (metrics.cpu.process > thresholds.cpu.process) {
        await this.alertSystem.sendAlert('HighCpuUsage', {
          operation,
          operationId,
          cpuUsage: metrics.cpu.process,
          cpuThreshold: thresholds.cpu.process,
          context
        });
      }
    } catch (error) {
      this.logger.error(`Error checking for anomalies: ${error instanceof Error ? error.message : String(error)}`, {
        operation,
        operationId
      });
    }
  }

  /**
   * Get metrics report
   */
  async getMetricsReport(timeRange?: TimeRange): Promise<MetricsReport> {
    return await this.metrics.generateReport(timeRange);
  }
}
