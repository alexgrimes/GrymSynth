import { ServiceRegistry } from "../services/service-registry";
import { HealthMonitor } from "../monitoring/health-monitor";
import { MetricsCollector } from "../monitoring/metrics-collector";
import { PerformanceMonitor } from "../monitoring/performance-monitor";
import { RecoveryManager } from "../orchestration/recovery-manager";
import { MemoryManager } from "../utils/memory";
import { ResourceManager } from "../resources/resource-manager";
import { Logger } from "../utils/logger";

export interface SystemHardeningConfig {
  enableHealthMonitoring: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorRecovery: boolean;
  enableResourceManagement: boolean;
  healthCheckIntervalMs?: number;
  performanceCheckIntervalMs?: number;
  maxResourceMemory?: string;
  recoverableServices?: string[];
}

export class SystemHardening {
  private healthMonitor: HealthMonitor | null = null;
  private performanceMonitor: PerformanceMonitor | null = null;
  private recoveryManager: RecoveryManager | null = null;
  private resourceManager: ResourceManager | null = null;
  private logger: Logger;
  private metricsCollector: MetricsCollector;

  constructor(
    private serviceRegistry: ServiceRegistry,
    private memoryManager: MemoryManager,
    private config: SystemHardeningConfig
  ) {
    this.logger = new Logger("system-hardening");
    this.metricsCollector = new MetricsCollector();
  }

  async initialize(): Promise<void> {
    this.logger.info("Initializing system hardening components");

    // Initialize metrics collector
    this.logger.info("Initializing metrics collection");

    // Initialize components based on configuration
    if (this.config.enableErrorRecovery) {
      this.logger.info("Initializing error recovery system");
      this.recoveryManager = new RecoveryManager(this.serviceRegistry, {
        checkInterval: this.config.healthCheckIntervalMs || 30000,
        maxRecoveryAttempts: 3,
        recoverableServices: this.config.recoverableServices || [],
        circuitOptions: {
          failureThreshold: 3,
          resetTimeout: 60000,
          monitorInterval: 10000,
        },
      });

      this.recoveryManager.start();
    }

    if (this.config.enableHealthMonitoring) {
      this.logger.info("Initializing health monitoring");

      if (!this.recoveryManager) {
        this.recoveryManager = new RecoveryManager(this.serviceRegistry, {
          checkInterval: this.config.healthCheckIntervalMs || 30000,
          maxRecoveryAttempts: 3,
          recoverableServices: this.config.recoverableServices || [],
          circuitOptions: {
            failureThreshold: 3,
            resetTimeout: 60000,
            monitorInterval: 10000,
          },
        });
      }

      this.healthMonitor = new HealthMonitor(
        this.serviceRegistry,
        this.recoveryManager,
        this.memoryManager,
        this.config.healthCheckIntervalMs
      );

      this.healthMonitor.start();
    }

    if (this.config.enablePerformanceMonitoring) {
      this.logger.info("Initializing performance monitoring");
      this.performanceMonitor = new PerformanceMonitor(
        this.metricsCollector,
        this.memoryManager,
        this.config.performanceCheckIntervalMs
      );

      this.performanceMonitor.start();
    }

    if (this.config.enableResourceManagement) {
      this.logger.info("Initializing resource management");
      this.resourceManager = new ResourceManager(this.metricsCollector, {
        resourceTimeoutMs: 30 * 60 * 1000, // 30 minutes
        checkIntervalMs: 10000, // 10 seconds
      });

      // Register base resources
      this.registerBaseResources();
    }

    this.logger.info("System hardening components initialized");
  }

  private registerBaseResources(): void {
    if (!this.resourceManager) {
      return;
    }

    // Register CPU resources
    const cpuCount = require("os").cpus().length;
    for (let i = 0; i < cpuCount; i++) {
      this.resourceManager.registerResource("cpu", {
        core: i,
        type: "processing",
      });
    }

    // Register memory resources
    const memoryInfo = this.memoryManager.getMemoryUsage();
    const maxResourceMemory = this.config.maxResourceMemory || "1GB";
    const maxMemoryBytes =
      this.memoryManager.parseMemoryString(maxResourceMemory);

    const memoryResourceCount = Math.floor(memoryInfo.max / maxMemoryBytes);
    for (let i = 0; i < memoryResourceCount; i++) {
      this.resourceManager.registerResource("memory", {
        sizeBytes: maxMemoryBytes,
        type: "ram",
      });
    }

    // Register GPU resources if available
    try {
      // This is a placeholder for GPU detection
      // In a real implementation, you'd use a library to detect GPUs
      const gpuCount = 1; // Placeholder

      for (let i = 0; i < gpuCount; i++) {
        this.resourceManager.registerResource("gpu", {
          index: i,
          type: "cuda",
        });
      }
    } catch (error) {
      this.logger.info("No GPU resources detected");
    }
  }

  getHealthStatus(): any {
    if (!this.healthMonitor) {
      return { status: "unknown", message: "Health monitoring not enabled" };
    }

    return this.healthMonitor.getStatus();
  }

  getPerformanceMetrics(): any {
    if (!this.performanceMonitor) {
      return { message: "Performance monitoring not enabled" };
    }

    return this.performanceMonitor.getMetrics();
  }

  getResourceStats(): any {
    if (!this.resourceManager) {
      return { message: "Resource management not enabled" };
    }

    return this.resourceManager.getResourceStats();
  }

  async requestResource(
    type: string,
    taskId: string,
    priority: number = 1,
    requirements: Record<string, any> = {}
  ): Promise<any> {
    if (!this.resourceManager) {
      throw new Error("Resource management not enabled");
    }

    return this.resourceManager.requestResource(
      type,
      taskId,
      priority,
      requirements
    );
  }

  releaseResource(resourceId: string, taskId: string): boolean {
    if (!this.resourceManager) {
      return false;
    }

    return this.resourceManager.releaseResource(resourceId, taskId);
  }

  shutdown(): void {
    this.logger.info("Shutting down system hardening components");

    if (this.healthMonitor) {
      this.healthMonitor.stop();
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.stop();
    }

    if (this.recoveryManager) {
      this.recoveryManager.stop();
    }

    if (this.resourceManager) {
      this.resourceManager.stop();
    }

    this.logger.info("System hardening components shut down");
  }
}
