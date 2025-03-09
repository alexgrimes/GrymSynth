import { memoryLoggingDemo } from "../memory-logging-demo";
import { Logger } from "../../src/utils/logger";
import { MemoryManager } from "../../src/utils/memory";

jest.mock("../../src/utils/logger");
jest.mock("../../src/utils/memory");

const MockedLogger = Logger as jest.MockedClass<typeof Logger>;
const MockedMemoryManager = MemoryManager as jest.MockedClass<
  typeof MemoryManager
>;

describe("Memory Logging Demo", () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      log: jest.spyOn(console, "log").mockImplementation(() => {}),
      error: jest.spyOn(console, "error").mockImplementation(() => {}),
    };

    // Reset mocks
    jest.clearAllMocks();

    // Setup Logger mock methods
    MockedLogger.prototype.info = jest.fn();
    MockedLogger.prototype.error = jest.fn();
    MockedLogger.prototype.warn = jest.fn();
    MockedLogger.prototype.memory = jest.fn();

    // Setup MemoryManager mock methods
    MockedMemoryManager.prototype.startOperation = jest
      .fn()
      .mockReturnValue(Date.now());
    MockedMemoryManager.prototype.endOperation = jest.fn().mockReturnValue(100);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should run demo successfully", async () => {
    // Mock memory usage
    const memoryUsage = {
      heapTotal: 100 * 1024 * 1024,
      heapUsed: 50 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
      rss: 200 * 1024 * 1024,
      buffers: 0,
    };
    jest.spyOn(process, "memoryUsage").mockReturnValue(memoryUsage);

    // Run demo
    await memoryLoggingDemo();

    // Verify logger was initialized correctly
    expect(MockedLogger).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: "demo" })
    );

    // Verify memory manager was initialized correctly
    expect(MockedMemoryManager).toHaveBeenCalledWith(
      expect.objectContaining({ maxMemory: "1GB" })
    );

    // Verify operations were logged
    const loggerInstance = MockedLogger.mock.instances[0];
    expect(loggerInstance.info).toHaveBeenCalledWith(
      "Starting memory management demo"
    );

    // Verify memory operations were tracked
    const memoryInstance = MockedMemoryManager.mock.instances[0];
    expect(memoryInstance.startOperation).toHaveBeenCalled();
    expect(memoryInstance.endOperation).toHaveBeenCalled();

    // Verify successful completion
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Demo completed successfully")
    );
  });

  test("should handle errors gracefully", async () => {
    // Setup error scenario
    MockedMemoryManager.prototype.startOperation = jest
      .fn()
      .mockImplementation(() => {
        throw new Error("Memory error");
      });

    // Run demo
    await memoryLoggingDemo();

    // Verify error was logged
    const loggerInstance = MockedLogger.mock.instances[0];
    expect(loggerInstance.error).toHaveBeenCalledWith(
      expect.stringContaining("Error in operation"),
      expect.objectContaining({
        error: expect.stringContaining("Memory error"),
      })
    );
  });

  test("should handle circular references", async () => {
    await memoryLoggingDemo();

    // Verify complex object logging
    const loggerInstance = MockedLogger.mock.instances[0];
    expect(loggerInstance.info).toHaveBeenCalledWith(
      "Complex object test",
      expect.objectContaining({
        nested: expect.any(Object),
      })
    );
  });

  test("should attempt garbage collection", async () => {
    // Mock global gc
    const mockGc = jest.fn();
    (global as any).gc = mockGc;

    await memoryLoggingDemo();

    // Verify gc was called
    expect(mockGc).toHaveBeenCalled();

    // Verify gc logging
    const loggerInstance = MockedLogger.mock.instances[0];
    expect(loggerInstance.info).toHaveBeenCalledWith(
      "Garbage collection triggered"
    );

    delete (global as any).gc;
  });

  test("should log final memory state", async () => {
    await memoryLoggingDemo();

    // Verify final memory logging
    const loggerInstance = MockedLogger.mock.instances[0];
    expect(loggerInstance.memory).toHaveBeenCalledWith("Final memory state");
  });
});
