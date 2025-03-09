import { MemoryManager } from "../../src/utils/memory";
import { Logger } from "../../src/utils/logger";

describe("Memory Logging Integration", () => {
  let memoryManager: MemoryManager;
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    logger = new Logger({ namespace: "memory-test" });
    memoryManager = new MemoryManager({ maxMemory: "1GB" });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  test("should log memory usage during operations", () => {
    const startTime = memoryManager.startOperation("test-op");

    logger.memory("Operation started");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] [memory-test] Operation started")
    );

    memoryManager.endOperation("test-op", startTime);
    logger.memory("Operation completed");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] [memory-test] Operation completed")
    );
  });

  test("should handle complex memory stats with circular references", () => {
    // Create circular reference in stats
    const stats: any = {
      operation: "test",
      memory: {},
    };
    stats.memory.self = stats;

    logger.info("Memory stats", stats);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"memory":{"self":"[Circular]"}')
    );
  });

  test("should maintain consistent logging across instances", () => {
    const logger1 = new Logger({ namespace: "test-1" });
    const logger2 = new Logger({ namespace: "test-2" });

    logger1.info("Test message 1");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[test-1]")
    );

    logger2.info("Test message 2");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[test-2]")
    );
  });

  test("should include memory metrics in logs", async () => {
    // Mock memory usage values
    const memoryUsage = {
      heapTotal: 1024 * 1024 * 100, // 100MB
      heapUsed: 1024 * 1024 * 50, // 50MB
      external: 0,
      arrayBuffers: 0,
      rss: 1024 * 1024 * 200, // 200MB
      buffers: 0,
    };

    jest.spyOn(process, "memoryUsage").mockReturnValue(memoryUsage);

    // Configure memory manager with limit
    const memManager = new MemoryManager({ maxMemory: "200MB" });
    const startTime = memManager.startOperation("memory-test");

    logger.memory("Memory test");

    // Verify memory stats in log
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("heapUsed")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("heapTotal")
    );

    memManager.endOperation("memory-test", startTime);
  });

  test("should handle rapid consecutive operations", async () => {
    const operations = ["op1", "op2", "op3"];
    const promises = operations.map(async (op) => {
      const start = memoryManager.startOperation(op);
      logger.memory(`${op} started`);

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 10));

      memoryManager.endOperation(op, start);
      logger.memory(`${op} completed`);
    });

    await Promise.all(promises);

    // Verify all operations were logged
    operations.forEach((op) => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${op} started`)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${op} completed`)
      );
    });

    // Verify memory stats were included
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("heapUsed")
    );
  });
});
