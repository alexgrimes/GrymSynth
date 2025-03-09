import {
  serviceRegistry,
  healthMonitor,
  initializeDefaultServices,
} from "../services";
import { contextManager, initializeContextSystem } from "../context";
import { taskRouter, initializeOrchestration } from "../orchestration";
import { Logger } from "../utils/logger";

import { AudioLDMServiceConfig } from "../services/audio/AudioLDMService";

export interface SystemConfig {
  enableHealthMonitoring?: boolean;
  healthCheckIntervalMs?: number;
  contextCleanupIntervalMs?: number;
  logLevel?: "debug" | "info" | "warn" | "error";
  enableAudioLDM?: boolean;
  audioldmConfig?: Partial<AudioLDMServiceConfig>;
}

export class SystemInitializationError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = "SystemInitializationError";
  }
}

export class SystemBootstrap {
  private logger: Logger;
  private initialized = false;

  constructor(private config: SystemConfig = {}) {
    this.logger = new Logger({ namespace: "system-bootstrap" });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn("System is already initialized");
      return;
    }

    try {
      this.logger.info("Starting system initialization");

      // Initialize services first
      this.logger.info("Initializing services");
      await initializeDefaultServices({
        enableAudioLDM: this.config.enableAudioLDM,
        audioldmConfig: this.config.audioldmConfig,
      });

      if (this.config.enableHealthMonitoring !== false) {
        this.logger.info("Starting health monitoring");
        await healthMonitor.startMonitoring();
      }

      // Initialize context management system
      this.logger.info("Initializing context management system");
      await initializeContextSystem();

      // Initialize orchestration
      this.logger.info("Initializing orchestration system");
      await initializeOrchestration();

      this.initialized = true;
      this.logger.info("System initialization completed successfully");
    } catch (error) {
      this.logger.error("System initialization failed", { error });
      throw new SystemInitializationError(
        "Failed to initialize system",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      this.logger.warn("System is not initialized");
      return;
    }

    try {
      this.logger.info("Starting system shutdown");

      // Stop health monitoring
      await healthMonitor.stopMonitoring();

      // Shutdown all services
      await serviceRegistry.shutdownAll();

      this.initialized = false;
      this.logger.info("System shutdown completed successfully");
    } catch (error) {
      this.logger.error("System shutdown failed", { error });
      throw new SystemInitializationError(
        "Failed to shutdown system",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getSystemStatus(): {
    initialized: boolean;
    services: string[];
    healthMonitoringEnabled: boolean;
    audioLDMEnabled: boolean;
  } {
    return {
      initialized: this.initialized,
      services: serviceRegistry.getAllServiceIds(),
      healthMonitoringEnabled: this.config.enableHealthMonitoring !== false,
      audioLDMEnabled: this.config.enableAudioLDM === true,
    };
  }
}

// Create and export default system bootstrap instance
export const systemBootstrap = new SystemBootstrap();

// Ensure proper shutdown on process termination
process.on("SIGTERM", async () => {
  try {
    await systemBootstrap.shutdown();
    process.exit(0);
  } catch (error) {
    console.error("Error during system shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  try {
    await systemBootstrap.shutdown();
    process.exit(0);
  } catch (error) {
    console.error("Error during system shutdown:", error);
    process.exit(1);
  }
});

// Example usage:
/*
async function main() {
  try {
    await systemBootstrap.initialize();
    
    // System is ready to use
    const status = systemBootstrap.getSystemStatus();
    console.log('System status:', status);

    // Your application logic here
    
  } catch (error) {
    console.error('Failed to start system:', error);
    process.exit(1);
  }
}

main();
*/
