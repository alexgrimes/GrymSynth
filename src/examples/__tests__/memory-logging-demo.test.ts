import { memoryLoggingDemo } from "../memory-logging-demo";
import { Logger } from "../../utils/logger";
import { MemoryManager } from "../../utils/memory";

jest.mock("../../utils/logger");
jest.mock("../../utils/memory");

describe("Memory Logging Demo", () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };
  let mockLogger: jest.Mocked<Logger>;
  let mockMemoryManager: jest.Mocked<MemoryManager>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock console methods
    consoleSpy = {
      log: jest.spyOn(console, "log").mockImplementation(() => {}),
      error: jest.spyOn(console, "error").mockImplementation(() => {}),
    };

    // Create mock instances
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      memory: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockMemoryManager = {
      startOperation: jest.fn().mockReturnValue(Date.now()),
      endOperation: jest.fn().mockReturnValue(100),
    } as unknown as jest.Mocked<MemoryManager>;

    // Setup mock memory usage
    jest.spyOn(process, "memoryUsage").mockReturnValue({
      heapTotal: 100 * 1024 * 1024,
      heapUsed: 50 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
      rss: 200 * 1024 * 1024,
    } as NodeJS.MemoryUsage);

    // Setup constructor mocks
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(
      () => mockLogger
    );
    (
      MemoryManager as jest.MockedClass<typeof MemoryManager>
    ).mockImplementation(() => mockMemoryManager);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should run demo successfully", async () => {
    // Run demo
    await memoryLoggingDemo();

    // Verify logger initialization
    expect(Logger).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: "demo" })
    );

    // Verify memory manager initialization
    expect(MemoryManager).toHaveBeenCalledWith(
      expect.objectContaining({ maxMemory: "1GB" })
    );

    // Verify startup logging
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Starting memory management demo"
    );

    // Verify operations were tracked
    expect(mockMemoryManager.startOperation).toHaveBeenCalled();
    expect(mockMemoryManager.endOperation).toHaveBeenCalled();

    // Verify completion logging
    expect(consoleSpy.log).toHaveBeenCalledWith(
      "\nDemo completed successfully"
    );
  });

  test("should handle errors gracefully", async () => {
    const errorMessage = "Memory error";

    // Setup mocks for error scenario
    mockMemoryManager.startOperation
      .mockReturnValueOnce(undefined as any) // First call returns undefined to simulate error
      .mockReturnValue(Date.now()); // Subsequent calls succeed

    mockLogger.error.mockImplementation(() => {
      // When error is logged, simulate error handling complete
      mockMemoryManager.startOperation.mockReturnValue(Date.now());
    });

    // Run demo
    await memoryLoggingDemo();

    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error in operation-1",
      expect.anything()
    );

    // Verify demo continues and completes
    expect(mockMemoryManager.startOperation).toHaveBeenCalledTimes(3);
    expect(consoleSpy.log).toHaveBeenCalledWith(
      "\nDemo completed successfully"
    );
  });

  test("should handle circular references", async () => {
    await memoryLoggingDemo();

    // Verify complex object logging
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Complex object test",
      expect.objectContaining({
        nested: expect.any(Object),
      })
    );
  });

  test("should attempt garbage collection", async () => {
    // Mock global gc
    const mockGc = jest.fn();
    (globalThis as any).gc = mockGc;

    await memoryLoggingDemo();

    // Verify gc was called
    expect(mockGc).toHaveBeenCalled();

    // Verify gc logging
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Garbage collection triggered"
    );

    delete (globalThis as any).gc;
  });

  test("should log final memory state", async () => {
    await memoryLoggingDemo();

    // Verify final memory logging
    expect(mockLogger.memory).toHaveBeenCalledWith("Final memory state");

    // Verify memory stats were logged
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Memory statistics",
      expect.objectContaining({
        heapUsed: expect.any(Number),
        heapTotal: expect.any(Number),
      })
    );
  });
});
