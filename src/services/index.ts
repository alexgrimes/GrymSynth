// Export service types and interfaces
export * from "./types";

// Export core service implementations
export { GAMAService } from "./audio/GAMAService";
export { AudioLDMService } from "./audio/AudioLDMService";
export { AudioLDMAdapter } from "./audio/AudioLDMAdapter";
// Import AudioGenerationResult from types instead
import { AudioGenerationResult } from "../types/audio";
export { AudioGenerationResult };

// Import and export service management
import { ServiceRegistry } from "./service-registry";
import { ServiceFactory, serviceFactory } from "./service-factory";
import { ServiceHealthMonitor } from "./service-health-monitor";
import { AudioLDMAdapter } from "./audio/AudioLDMAdapter";

export { ServiceRegistry } from "./service-registry";
export { ServiceFactory, serviceFactory } from "./service-factory";
export { ServiceHealthMonitor } from "./service-health-monitor";

// Create and export default instances
export const serviceRegistry = new ServiceRegistry();
export const healthMonitor = new ServiceHealthMonitor(serviceRegistry);

// Initialize health monitoring on module load
healthMonitor.startMonitoring().catch((error) => {
  console.error("Failed to start health monitoring:", error);
});

// Ensure cleanup on process exit
process.on("beforeExit", async () => {
  await healthMonitor.stopMonitoring();
  await serviceRegistry.shutdownAll().catch((error) => {
    console.error("Error during service shutdown:", error);
  });
});

// Helper function to initialize common services
export async function initializeDefaultServices(options?: {
  enableAudioLDM?: boolean;
  audioldmConfig?: Partial<import("../types/audio").AudioServiceConfig>;
  gamaConfig?: Partial<import("./audio/GAMAService").GAMAServiceConfig>;
}): Promise<void> {
  try {
    // Create and register GAMA service
    const gamaService = serviceFactory.createGAMAService(options?.gamaConfig);
    serviceRegistry.registerService("gama", gamaService);

    // Initialize the service
    await gamaService.initialize();

    // Create and register AudioLDM service if enabled
    if (options?.enableAudioLDM) {
      const audioldmService = await serviceFactory.createAudioLDMService(
        options.audioldmConfig
      );
      // Create an adapter that implements the ModelService interface
      const audioldmAdapter = new AudioLDMAdapter(audioldmService);
      serviceRegistry.registerService("audioldm", audioldmAdapter);

      // No need to call initialize as it's already initialized by the factory
    }
  } catch (error) {
    console.error("Failed to initialize default services:", error);
    throw error;
  }
}
