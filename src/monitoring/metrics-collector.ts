import { EventEmitter } from "events";
import { Logger } from "../utils/logger";

export interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

export interface MetricQuery {
  name?: string;
  tags?: Record<string, string>;
  timeRange?: [number, number]; // [start, end]
}

export interface OperationMetrics {
  duration: number;
  memoryDelta: number;
  cpuTime?: number;
  success: boolean;
  error?: string;
}

export interface ServiceMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  memoryUsage: number;
}

export class MetricsCollector extends EventEmitter {
  private metrics: Metric[] = [];
  private retentionPeriod: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private logger: Logger;

  constructor(retentionPeriodMs: number = 24 * 60 * 60 * 1000) {
    // 24 hours default
    super();
    this.retentionPeriod = retentionPeriodMs;
    this.logger = new Logger("metrics-collector");

    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, Math.min(retentionPeriodMs / 10, 60 * 60 * 1000)); // At most every hour
  }

  record(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: Metric = {
      name,
      value,
      tags,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    this.emit("metric", metric);
  }

  recordOperation(
    name: string,
    metrics: OperationMetrics,
    tags: Record<string, string> = {}
  ): void {
    // Record individual metrics
    this.record(`${name}.duration`, metrics.duration, tags);
    this.record(`${name}.memory_delta`, metrics.memoryDelta, tags);
    if (metrics.cpuTime !== undefined) {
      this.record(`${name}.cpu_time`, metrics.cpuTime, tags);
    }
    this.record(`${name}.success`, metrics.success ? 1 : 0, tags);

    if (!metrics.success && metrics.error) {
      const errorTags = { ...tags, error_type: metrics.error.split(":")[0] };
      this.record(`${name}.error`, 1, errorTags);
    }
  }

  recordServiceMetrics(
    serviceId: string,
    metrics: ServiceMetrics,
    tags: Record<string, string> = {}
  ): void {
    const serviceTags = { ...tags, service: serviceId };

    this.record("service.request_count", metrics.requestCount, serviceTags);
    this.record("service.success_count", metrics.successCount, serviceTags);
    this.record("service.error_count", metrics.errorCount, serviceTags);
    this.record(
      "service.avg_response_time",
      metrics.avgResponseTime,
      serviceTags
    );
    this.record(
      "service.p95_response_time",
      metrics.p95ResponseTime,
      serviceTags
    );
    this.record("service.memory_usage", metrics.memoryUsage, serviceTags);
  }

  query(query: MetricQuery = {}): Metric[] {
    let result = this.metrics;

    if (query.name) {
      result = result.filter((m) => m.name === query.name);
    }

    if (query.tags) {
      result = result.filter((m) => {
        for (const [key, value] of Object.entries(query.tags!)) {
          if (m.tags[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    if (query.timeRange) {
      const [start, end] = query.timeRange;
      result = result.filter((m) => m.timestamp >= start && m.timestamp <= end);
    }

    return result;
  }

  getServiceMetrics(
    serviceId: string,
    timeRangeMs: number = 60 * 60 * 1000 // 1 hour default
  ): ServiceMetrics {
    const now = Date.now();
    const timeRange: [number, number] = [now - timeRangeMs, now];

    const requestMetrics = this.query({
      name: "service.request_count",
      tags: { service: serviceId },
      timeRange,
    });

    const durationsMetrics = this.query({
      name: "service.avg_response_time",
      tags: { service: serviceId },
      timeRange,
    });

    const memoryMetrics = this.query({
      name: "service.memory_usage",
      tags: { service: serviceId },
      timeRange,
    });

    const errorMetrics = this.query({
      name: "service.error_count",
      tags: { service: serviceId },
      timeRange,
    });

    const requestCount =
      requestMetrics.length > 0
        ? requestMetrics.reduce((sum, m) => sum + m.value, 0)
        : 0;

    const errorCount =
      errorMetrics.length > 0
        ? errorMetrics.reduce((sum, m) => sum + m.value, 0)
        : 0;

    const successCount = requestCount - errorCount;

    const durations = durationsMetrics
      .map((m) => m.value)
      .sort((a, b) => a - b);
    const avgResponseTime =
      durations.length > 0
        ? durations.reduce((sum, val) => sum + val, 0) / durations.length
        : 0;

    const p95Index = Math.floor(durations.length * 0.95);
    const p95ResponseTime =
      durations.length > 0 && p95Index >= 0 ? durations[p95Index] : 0;

    const memoryUsage =
      memoryMetrics.length > 0
        ? memoryMetrics[memoryMetrics.length - 1].value
        : 0;

    return {
      requestCount,
      successCount,
      errorCount,
      avgResponseTime,
      p95ResponseTime,
      memoryUsage,
    };
  }

  getMetricHistory(
    name: string,
    tags: Record<string, string> = {},
    timeRangeMs: number = 24 * 60 * 60 * 1000, // 24 hours default
    bucketSizeMs: number = 5 * 60 * 1000 // 5 minutes default
  ): { time: number; value: number }[] {
    const now = Date.now();
    const startTime = now - timeRangeMs;

    const metrics = this.query({
      name,
      tags,
      timeRange: [startTime, now],
    });

    // Group by time bucket
    const buckets: Record<number, number[]> = {};

    for (const metric of metrics) {
      const bucketTime =
        Math.floor(metric.timestamp / bucketSizeMs) * bucketSizeMs;

      if (!buckets[bucketTime]) {
        buckets[bucketTime] = [];
      }

      buckets[bucketTime].push(metric.value);
    }

    // Calculate average for each bucket
    const result: { time: number; value: number }[] = [];

    for (const [timeStr, values] of Object.entries(buckets)) {
      const time = parseInt(timeStr);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;

      result.push({
        time,
        value: avg,
      });
    }

    // Sort by time
    return result.sort((a, b) => a.time - b.time);
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.retentionPeriod;
    const initialCount = this.metrics.length;

    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);

    const removedCount = initialCount - this.metrics.length;
    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired metrics`);
    }
  }

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
