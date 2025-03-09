import { ServiceRegistry } from "../services/service-registry";
import { RecoveryManager } from "../orchestration/recovery-manager";
import { MemoryManager } from "../utils/memory";
import { Logger } from "../utils/logger";
import { EventEmitter } from "events";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  services: Record<
    string,
    {
      status: string;
      circuitState?: string;
      lastError?: string;
    }
  >;
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  uptime: number;
  startTime: Date;
}

export class HealthMonitor extends EventEmitter {
  private status: HealthStatus;
  private checkInterval: NodeJS.Timeout | null = null;
  private logger: Logger;
  private startTime: Date;

  constructor(
    private serviceRegistry: ServiceRegistry,
    private recoveryManager: RecoveryManager,
    private memoryManager: MemoryManager,
    private checkIntervalMs: number = 30000
  ) {
    super();
    this.logger = new Logger("health-monitor");
    this.startTime = new Date();

    this.status = {
      status: "healthy",
      services: {},
      memory: {
        total: 0,
        used: 0,
        free: 0,
        percentage: 0,
      },
      uptime: 0,
      startTime: this.startTime,
    };
  }

  start(): void {
    if (this.checkInterval) {
      return;
    }

    this.logger.info("Starting health monitoring");

    // Perform initial check
    this.check().catch((error) =>
      this.logger.error(`Error in health check: ${error}`)
    );

    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.check().catch((error) =>
        this.logger.error(`Error in health check: ${error}`)
      );
    }, this.checkIntervalMs);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async check(): Promise<HealthStatus> {
    this.logger.debug("Performing health check");

    // Check services
    const serviceIds = this.serviceRegistry.getAllServiceIds();
    const serviceStatuses: Record<
      string,
      {
        status: string;
        circuitState?: string;
        lastError?: string;
      }
    > = {};

    let unhealthyServices = 0;
    let totalServices = serviceIds.length;

    for (const id of serviceIds) {
      try {
        const service = await this.serviceRegistry.getService(id);
        const status = await service.getStatus();
        const metrics = await service.getMetrics();

        // Get circuit state if available
        let circuitState;
        try {
          circuitState = this.recoveryManager.getCircuitState(id)?.state;
        } catch (error) {
          // Circuit breaker might not exist for this service
        }

        serviceStatuses[id] = {
          status,
          circuitState,
          lastError: metrics.errorCount > 0 ? "Error occurred" : undefined,
        };

        if (status === "error" || status === "offline") {
          unhealthyServices++;
        }
      } catch (error) {
        serviceStatuses[id] = {
          status: "unknown",
          lastError: error instanceof Error ? error.message : String(error),
        };
        unhealthyServices++;
      }
    }

    // Check memory
    const memoryUsage = this.memoryManager.getMemoryUsage();

    // Calculate free memory and create memory info object
    const memoryInfo = {
      total: memoryUsage.max,
      used: memoryUsage.used,
      free: memoryUsage.max - memoryUsage.used,
      percentage: memoryUsage.percentage,
    };

    // Determine overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy";

    if (unhealthyServices === 0 && memoryInfo.percentage < 80) {
      overallStatus = "healthy";
    } else if (
      unhealthyServices / totalServices < 0.5 &&
      memoryInfo.percentage < 90
    ) {
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }

    // Calculate uptime
    const uptime = Date.now() - this.startTime.getTime();

    // Update status
    this.status = {
      status: overallStatus,
      services: serviceStatuses,
      memory: memoryInfo,
      uptime,
      startTime: this.startTime,
    };

    // Emit status change event
    this.emit("status", this.status);

    if (this.status.status !== "healthy") {
      this.logger.warn(`System health: ${this.status.status}`, {
        unhealthyServices,
        memoryPercentage: memoryInfo.percentage,
      });
    } else {
      this.logger.info(`System health: ${this.status.status}`);
    }

    return this.status;
  }

  getStatus(): HealthStatus {
    return this.status;
  }

  getServiceHealth(serviceId: string):
    | {
        status: string;
        circuitState?: string;
        lastError?: string;
      }
    | undefined {
    return this.status.services[serviceId];
  }

  isHealthy(): boolean {
    return this.status.status === "healthy";
  }

  getUptime(): number {
    return this.status.uptime;
  }

  getMemoryUsage(): {
    total: number;
    used: number;
    free: number;
    percentage: number;
  } {
    return this.status.memory;
  }
}
