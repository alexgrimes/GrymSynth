import {
  CircuitBreaker,
  CircuitBreakerOptions,
} from "../utils/circuit-breaker";
import { ServiceRegistry } from "../services/service-registry";
import { ModelService, ServiceStatus } from "../services/types";
import { Logger } from "../utils/logger";

export interface RecoveryOptions {
  checkInterval: number; // Interval for health checks in ms
  maxRecoveryAttempts: number; // Maximum recovery attempts
  recoverableServices: string[]; // Services that can be recovered
  circuitOptions: CircuitBreakerOptions; // Circuit breaker options
}

export class RecoveryManager {
  private circuits: Map<string, CircuitBreaker> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private logger: Logger;

  constructor(
    private serviceRegistry: ServiceRegistry,
    private options: RecoveryOptions
  ) {
    this.logger = new Logger("recovery-manager");

    // Initialize circuit breakers for each recoverable service
    for (const serviceId of options.recoverableServices) {
      this.circuits.set(
        serviceId,
        new CircuitBreaker(serviceId, {
          ...options.circuitOptions,
          onOpen: async () => {
            this.logger.warn(
              `Service ${serviceId} circuit opened, marking as unavailable`
            );
            await this.markServiceUnavailable(serviceId);
          },
          onHalfOpen: async () => {
            this.logger.info(`Attempting recovery for service ${serviceId}`);
            await this.attemptServiceRecovery(serviceId);
          },
        })
      );
    }
  }

  start(): void {
    if (this.checkInterval) {
      return;
    }

    this.logger.info("Starting recovery manager health checks");
    this.checkInterval = setInterval(() => {
      this.checkServiceHealth();
    }, this.options.checkInterval);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Dispose all circuit breakers
    for (const circuit of this.circuits.values()) {
      circuit.dispose();
    }
  }

  async executeWithCircuitBreaker<T>(
    serviceId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const circuit = this.circuits.get(serviceId);

    if (!circuit) {
      // No circuit breaker for this service, execute directly
      return operation();
    }

    return circuit.execute(operation);
  }

  private async checkServiceHealth(): Promise<void> {
    for (const serviceId of this.options.recoverableServices) {
      try {
        const service = await this.serviceRegistry.getService(serviceId);
        const status = await service.getStatus();

        if (status === "error" || status === "offline") {
          this.logger.warn(`Service ${serviceId} is in ${status} state`);
          const circuit = this.circuits.get(serviceId);
          if (circuit && circuit.getState() === "closed") {
            // Record failure to potentially open circuit
            try {
              await circuit.execute(async () => {
                throw new Error(`Service in ${status} state`);
              });
            } catch (error) {
              // Expected error - circuit breaker will handle it
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error checking service ${serviceId} health: ${error}`
        );
      }
    }
  }

  private async markServiceUnavailable(serviceId: string): Promise<void> {
    try {
      const service = await this.serviceRegistry.getService(serviceId);
      // Perform any necessary cleanup or state updates
      // The service registry already tracks service status
    } catch (error) {
      this.logger.error(
        `Error marking service ${serviceId} as unavailable: ${error}`
      );
    }
  }

  private async attemptServiceRecovery(serviceId: string): Promise<boolean> {
    const attempts = this.recoveryAttempts.get(serviceId) || 0;

    if (attempts >= this.options.maxRecoveryAttempts) {
      this.logger.error(
        `Maximum recovery attempts (${attempts}) reached for service ${serviceId}`
      );
      return false;
    }

    this.recoveryAttempts.set(serviceId, attempts + 1);
    this.logger.info(
      `Recovery attempt ${attempts + 1} for service ${serviceId}`
    );

    try {
      const service = await this.serviceRegistry.getService(serviceId);

      // First try to dispose and reinitialize
      try {
        await service.shutdown();
      } catch (error) {
        this.logger.warn(`Error shutting down service ${serviceId}: ${error}`);
      }

      await service.initialize();

      // Check if service is now healthy
      const status = await service.getStatus();

      if (status === "online") {
        this.logger.info(`Service ${serviceId} recovered successfully`);
        this.recoveryAttempts.set(serviceId, 0);

        // Close circuit
        const circuit = this.circuits.get(serviceId);
        if (circuit) {
          circuit.reset();
        }

        return true;
      } else {
        this.logger.warn(
          `Service ${serviceId} still unhealthy after recovery attempt`
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Recovery attempt failed for service ${serviceId}: ${error}`
      );
      return false;
    }
  }

  getCircuitState(
    serviceId: string
  ): { state: string; failures: number } | undefined {
    const circuit = this.circuits.get(serviceId);
    if (!circuit) {
      return undefined;
    }

    const stats = circuit.getStats();
    return {
      state: stats.state,
      failures: stats.failures,
    };
  }
}
