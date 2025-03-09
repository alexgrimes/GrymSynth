// Export types and interfaces
export * from "./types";

// Export core implementations
export { InMemoryContextRepository } from "./context-repository";
export { ContextManager } from "./context-manager";
export { AudioModelContextAdapter } from "./adapters/audio-model-adapter";

// Create and export default instances
import { InMemoryContextRepository } from "./context-repository";
import { ContextManager } from "./context-manager";
import { AudioModelContextAdapter } from "./adapters/audio-model-adapter";
import { Logger } from "../utils/logger";

const logger = new Logger({ namespace: "context-module" });

// Create default repository instance
export const contextRepository = new InMemoryContextRepository();

// Create default context manager instance
export const contextManager = new ContextManager();

// Register default adapters
contextManager.registerAdapter("gama", new AudioModelContextAdapter());

// Set up cleanup interval for expired items
const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
setInterval(async () => {
  try {
    await contextRepository.clear();
    logger.debug("Completed context cleanup");
  } catch (error) {
    logger.error("Failed to cleanup context repository", { error });
  }
}, CLEANUP_INTERVAL);

// Ensure cleanup on process exit
process.on("beforeExit", async () => {
  try {
    await contextRepository.clear();
    logger.info("Cleaned up context repository before exit");
  } catch (error) {
    logger.error("Failed to cleanup context repository on exit", { error });
  }
});

// Helper function to initialize context system
export async function initializeContextSystem(): Promise<void> {
  try {
    // Register any additional adapters here
    logger.info("Context management system initialized");
  } catch (error) {
    logger.error("Failed to initialize context system", { error });
    throw error;
  }
}
