import {
  SystemBootstrap,
  SystemConfig,
  SystemInitializationError,
  systemBootstrap,
} from "./system-bootstrap";

// Export types and classes
export { SystemBootstrap, SystemInitializationError };

export type { SystemConfig };

// Export singleton instance
export { systemBootstrap };

// Export convenience function for quick initialization
export async function initializeSystem(config?: SystemConfig): Promise<void> {
  await systemBootstrap.initialize();
}

// Export function to get system status
export function getSystemStatus(): {
  initialized: boolean;
  services: string[];
  healthMonitoringEnabled: boolean;
} {
  return systemBootstrap.getSystemStatus();
}

// Export function to shutdown system
export async function shutdownSystem(): Promise<void> {
  await systemBootstrap.shutdown();
}

// Example usage:
/*
import { initializeSystem, getSystemStatus, shutdownSystem } from './integration';

async function main() {
  try {
    // Initialize the system
    await initializeSystem({
      enableHealthMonitoring: true,
      healthCheckIntervalMs: 30000,
      logLevel: 'info'
    });

    // Check system status
    const status = getSystemStatus();
    console.log('System status:', status);

    // Your application logic here

    // Shutdown when done
    await shutdownSystem();
  } catch (error) {
    console.error('System error:', error);
    process.exit(1);
  }
}
*/
