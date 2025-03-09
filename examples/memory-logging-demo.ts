import { MemoryManager } from "../src/utils/memory";
import { Logger } from "../src/utils/logger";

/**
 * Demo of memory management and logging system
 */
async function memoryLoggingDemo() {
  // Initialize components
  const memory = new MemoryManager({ maxMemory: "1GB" });
  const logger = new Logger({ namespace: "demo" });

  logger.info("Starting memory management demo");

  // Simulate memory-intensive operations
  for (let i = 0; i < 3; i++) {
    const operationId = `operation-${i + 1}`;
    const startTime = memory.startOperation(operationId);

    logger.info(`Starting ${operationId}`);

    try {
      // Simulate work by allocating memory
      const data = new Array(1000000).fill(0);
      logger.info(`Allocated memory for ${operationId}`, {
        size: data.length,
        type: "number[]",
      });

      // Log memory usage mid-operation
      logger.memory(`Memory usage during ${operationId}`);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create circular reference for logging test
      const circular: any = { data };
      circular.self = circular;

      logger.info(`Completed ${operationId}`, circular);
    } catch (error) {
      logger.error(`Error in ${operationId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      const duration = memory.endOperation(operationId, startTime);
      logger.info(`${operationId} completed`, { duration });
    }
  }

  // Log final memory usage
  const memoryUsage = process.memoryUsage();
  logger.info("Memory statistics", {
    heapUsed: memoryUsage.heapUsed,
    heapTotal: memoryUsage.heapTotal,
    external: memoryUsage.external,
    rss: memoryUsage.rss,
  });

  // Demonstrate error handling
  try {
    throw new Error("Test error");
  } catch (error) {
    logger.error("Operation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Complex object logging
  const complexObj = {
    nested: {
      array: [1, 2, { value: 3 }],
      circular: {} as any,
    },
    date: new Date(),
  };
  complexObj.nested.circular = complexObj;

  logger.info("Complex object test", complexObj);

  // Simulate cleanup
  try {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      logger.info("Garbage collection triggered");
    }

    // Log final memory state
    logger.memory("Final memory state");
  } catch (error) {
    logger.warn("Cleanup error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Run the demo
if (require.main === module) {
  memoryLoggingDemo()
    .then(() => {
      console.log("\nDemo completed successfully");
    })
    .catch((error) => {
      console.error("Demo failed:", error);
      process.exit(1);
    });
}

export { memoryLoggingDemo };
