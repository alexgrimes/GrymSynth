import { MetricsCollector } from "./metrics-collector";
import { Logger } from "../utils/logger";
import { MemoryManager } from "../utils/memory";
import os from "os";

export interface PerformanceMetrics {
  cpu: {
    system: number; // System-wide CPU usage (%)
    process: number; // Process CPU usage (%)
  };
  memory: {
    rss: number; // Resident Set Size in bytes
    heapTotal: number; // Total size of the heap in bytes
    heapUsed: number; // Used heap size in bytes
    external: number; // Memory usage of C++ objects bound to JavaScript objects
    systemTotal: number; // Total system memory
    systemFree: number; // Free system memory
  };
  eventLoop: {
    latency: number; // Event loop latency in ms
  };
  operations: {
    [key: string]: {
      count: number; // Number of operations
      avgDuration: number; // Average duration in ms
      p95Duration: number; // 95th percentile duration in ms
    };
  };
}

export class PerformanceMonitor {
  private metricsCollector: MetricsCollector;
  private memoryManager: MemoryManager;
  private logger: Logger;
  private checkInterval: NodeJS.Timeout | null = null;
  private latencyCheckInterval: NodeJS.Timeout | null = null;
  private lastCpuUsage: NodeJS.CpuUsage | null = null;
  private lastCpuInfo: os.CpuInfo[] | null = null;
  private startTime: number;
  private eventLoopLag: number = 0;

  constructor(
    metricsCollector: MetricsCollector,
    memoryManager: MemoryManager,
    private checkIntervalMs: number = 5000 // 5 seconds default
  ) {
    this.metricsCollector = metricsCollector;
    this.memoryManager = memoryManager;
    this.logger = new Logger("performance-monitor");
    this.startTime = Date.now();

    // Get initial CPU usage
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuInfo = os.cpus();
  }

  start(): void {
    if (this.checkInterval) {
      return;
    }

    this.logger.info("Starting performance monitoring");

    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.check();
    }, this.checkIntervalMs);

    // Start event loop latency checks (more frequent)
    this.latencyCheckInterval = setInterval(() => {
      this.checkEventLoopLatency();
    }, 1000);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.latencyCheckInterval) {
      clearInterval(this.latencyCheckInterval);
      this.latencyCheckInterval = null;
    }
  }

  getMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    const memoryInfo = this.memoryManager.getMemoryUsage();

    // Get operation metrics
    const operations: Record<
      string,
      {
        count: number;
        avgDuration: number;
        p95Duration: number;
      }
    > = {};

    // Get all distinct operation names from metrics
    const operationMetrics = this.metricsCollector.query({
      name: "operation.duration",
    });

    const operationNames = new Set<string>();
    for (const metric of operationMetrics) {
      if (metric.tags.operation) {
        operationNames.add(metric.tags.operation);
      }
    }

    // Calculate metrics for each operation
    for (const operation of operationNames) {
      const durationsMetrics = this.metricsCollector.query({
        name: "operation.duration",
        tags: { operation },
      });

      const durations = durationsMetrics.map((m) => m.value);
      const avgDuration =
        durations.length > 0
          ? durations.reduce((sum, val) => sum + val, 0) / durations.length
          : 0;

      const sortedDurations = [...durations].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedDurations.length * 0.95);
      const p95Duration =
        sortedDurations.length > 0 && p95Index >= 0
          ? sortedDurations[p95Index]
          : 0;

      operations[operation] = {
        count: durations.length,
        avgDuration,
        p95Duration,
      };
    }

    return {
      cpu: {
        system: this.getSystemCpuUsage(),
        process: this.getProcessCpuUsage(),
      },
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        systemTotal: memoryInfo.max,
        systemFree: memoryInfo.max - memoryInfo.used,
      },
      eventLoop: {
        latency: this.eventLoopLag,
      },
      operations,
    };
  }

  private check(): void {
    const metrics = this.getMetrics();

    // Record system metrics
    this.metricsCollector.record("system.cpu.system", metrics.cpu.system);
    this.metricsCollector.record("system.cpu.process", metrics.cpu.process);
    this.metricsCollector.record("system.memory.rss", metrics.memory.rss);
    this.metricsCollector.record(
      "system.memory.heap_total",
      metrics.memory.heapTotal
    );
    this.metricsCollector.record(
      "system.memory.heap_used",
      metrics.memory.heapUsed
    );
    this.metricsCollector.record(
      "system.memory.external",
      metrics.memory.external
    );
    this.metricsCollector.record(
      "system.event_loop.latency",
      metrics.eventLoop.latency
    );

    // Log if there are performance issues
    if (metrics.cpu.process > 80) {
      this.logger.warn("High CPU usage detected", {
        cpuUsage: metrics.cpu.process,
      });
    }

    if (metrics.memory.heapUsed / metrics.memory.heapTotal > 0.9) {
      this.logger.warn("High heap usage detected", {
        heapUsed: metrics.memory.heapUsed,
        heapTotal: metrics.memory.heapTotal,
        percentage:
          ((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100).toFixed(
            2
          ) + "%",
      });
    }

    if (metrics.eventLoop.latency > 100) {
      this.logger.warn("High event loop latency detected", {
        latency: metrics.eventLoop.latency,
      });
    }
  }

  private checkEventLoopLatency(): void {
    const start = Date.now();

    // Use nextTick to measure event loop lag
    process.nextTick(() => {
      const lag = Date.now() - start;
      this.eventLoopLag = lag;
    });
  }

  private getProcessCpuUsage(): number {
    if (!this.lastCpuUsage) {
      this.lastCpuUsage = process.cpuUsage();
      return 0;
    }

    const currentUsage = process.cpuUsage();
    const userDiff = currentUsage.user - this.lastCpuUsage.user;
    const systemDiff = currentUsage.system - this.lastCpuUsage.system;
    const total = userDiff + systemDiff;

    // Get elapsed time in microseconds
    const elapsedMs = this.checkIntervalMs * 1000;

    // CPU usage as percentage (usage per cpu core)
    const cpuCount = os.cpus().length;
    const percentage = ((total / elapsedMs) * 100) / cpuCount;

    // Update last usage
    this.lastCpuUsage = currentUsage;

    return percentage;
  }

  private getSystemCpuUsage(): number {
    const currentCpuInfo = os.cpus();

    if (!this.lastCpuInfo) {
      this.lastCpuInfo = currentCpuInfo;
      return 0;
    }

    let totalIdle = 0;
    let totalTick = 0;

    // Calculate the difference between current and last CPU measurements
    for (let i = 0; i < currentCpuInfo.length; i++) {
      const cpu = currentCpuInfo[i];
      const lastCpu = this.lastCpuInfo[i];

      // Calculate total time spent in all states
      const idle = cpu.times.idle - lastCpu.times.idle;
      const user = cpu.times.user - lastCpu.times.user;
      const sys = cpu.times.sys - lastCpu.times.sys;
      const nice = cpu.times.nice - lastCpu.times.nice;
      const irq = cpu.times.irq - lastCpu.times.irq;

      const tick = idle + user + sys + nice + irq;

      totalIdle += idle;
      totalTick += tick;
    }

    // Update last CPU info
    this.lastCpuInfo = currentCpuInfo;

    // Calculate CPU usage percentage
    const totalUsage = totalTick > 0 ? (1 - totalIdle / totalTick) * 100 : 0;

    return totalUsage;
  }
}
