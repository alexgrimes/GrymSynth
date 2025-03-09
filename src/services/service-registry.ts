import { ModelService, ServiceNotFoundError, ServiceStatus } from "./types";
import { Logger } from "../utils/logger";

const MAX_INIT_RETRIES = 3;
const INIT_RETRY_DELAY = 1000; // 1 second

export class ServiceRegistry {
  private services: Map<string, ModelService> = new Map();
  private initializationAttempts: Map<string, number> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ namespace: "service-registry" });
  }

  registerService(id: string, service: ModelService): void {
    if (this.services.has(id)) {
      this.logger.warn(
        `Service with id ${id} already exists. It will be overwritten.`
      );
    }
    this.services.set(id, service);
    this.initializationAttempts.set(id, 0);
    this.logger.info(`Registered service: ${id}`);
  }

  async getService(id: string): Promise<ModelService> {
    const service = this.services.get(id);
    if (!service) {
      throw new ServiceNotFoundError(`Service ${id} not found`);
    }

    try {
      if (!service.isInitialized()) {
        await this.initializeService(service, id);
      } else {
        // Check if service is healthy even if initialized
        const status = await service.getStatus();
        if (status === ServiceStatus.OFFLINE || status === ServiceStatus.ERROR) {
          this.logger.warn(`Service ${id} is ${status}, attempting recovery`);
          await this.recoverService(service, id);
        }
      }
    } catch (error) {
      this.logger.warn(`Service ${id} initialization/recovery failed`, {
        error,
      });
      // Continue anyway - the service might still work
    }

    return service;
  }

  private async initializeService(
    service: ModelService,
    id: string
  ): Promise<void> {
    const attempts = this.initializationAttempts.get(id) || 0;

    if (attempts >= MAX_INIT_RETRIES) {
      this.logger.error(
        `Service ${id} failed to initialize after ${attempts} attempts`
      );
      return; // Continue with uninitialized service rather than throwing
    }

    try {
      this.logger.info(
        `Initializing service: ${id} (attempt ${
          attempts + 1
        }/${MAX_INIT_RETRIES})`
      );
      await service.initialize();
      this.initializationAttempts.set(id, 0); // Reset counter on success
    } catch (error) {
      this.initializationAttempts.set(id, attempts + 1);
      if (attempts + 1 < MAX_INIT_RETRIES) {
        this.logger.warn(`Service ${id} initialization failed, will retry`, {
          error,
        });
        await new Promise((resolve) => setTimeout(resolve, INIT_RETRY_DELAY));
        await this.initializeService(service, id);
      } else {
        throw error;
      }
    }
  }

  private async recoverService(
    service: ModelService,
    id: string
  ): Promise<void> {
    try {
      this.logger.info(`Attempting to recover service: ${id}`);
      await service.shutdown().catch(() => {}); // Ignore shutdown errors
      await service.initialize();
      const status = await service.getStatus();
      if (status === ServiceStatus.ONLINE) {
        this.logger.info(`Successfully recovered service: ${id}`);
      } else {
        this.logger.warn(
          `Service ${id} recovery incomplete, status: ${status}`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to recover service ${id}`, { error });
      throw error;
    }
  }

  async removeService(id: string): Promise<void> {
    const service = this.services.get(id);
    if (!service) {
      throw new ServiceNotFoundError(`Service ${id} not found`);
    }

    try {
      await service.shutdown();
      this.services.delete(id);
      this.initializationAttempts.delete(id);
      this.logger.info(`Removed service: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove service ${id}`, { error });
      // Still remove from registry even if shutdown fails
      this.services.delete(id);
      this.initializationAttempts.delete(id);
      throw error;
    }
  }

  getAllServiceIds(): string[] {
    return Array.from(this.services.keys());
  }

  async getServiceStatuses(): Promise<Record<string, ServiceStatus>> {
    const statuses: Record<string, ServiceStatus> = {};

    for (const [id, service] of this.services) {
      try {
        const status = await service.getStatus();
        statuses[id] = status;

        // Log when a service is in a non-optimal state
        if (status !== ServiceStatus.ONLINE) {
          this.logger.warn(`Service ${id} is in ${status} state`);
        }
      } catch (error) {
        this.logger.error(`Failed to get status for service ${id}`, { error });
        statuses[id] = ServiceStatus.ERROR;
      }
    }

    return statuses;
  }

  async shutdownAll(): Promise<void> {
    const errors: Error[] = [];

    for (const [id, service] of this.services) {
      try {
        await service.shutdown();
        this.logger.info(`Shut down service: ${id}`);
      } catch (error) {
        this.logger.error(`Failed to shut down service ${id}`, { error });
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.services.clear();
    this.initializationAttempts.clear();

    if (errors.length > 0) {
      throw new Error(
        `Failed to shut down all services: ${errors.length} errors occurred`
      );
    }
  }

  // Utility method for health checks
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<
      string,
      {
        status: ServiceStatus;
        initializationAttempts: number;
      }
    >;
  }> {
    const healthStatus: Record<
      string,
      {
        status: ServiceStatus;
        initializationAttempts: number;
      }
    > = {};

    let allHealthy = true;

    for (const [id, service] of this.services) {
      try {
        const status = await service.getStatus();
        const attempts = this.initializationAttempts.get(id) || 0;

        healthStatus[id] = {
          status,
          initializationAttempts: attempts,
        };

        if (status !== ServiceStatus.ONLINE) {
          allHealthy = false;
        }
      } catch (error) {
        healthStatus[id] = {
          status: ServiceStatus.ERROR,
          initializationAttempts: this.initializationAttempts.get(id) || 0,
        };
        allHealthy = false;
      }
    }

    return {
      healthy: allHealthy,
      services: healthStatus,
    };
  }
}
