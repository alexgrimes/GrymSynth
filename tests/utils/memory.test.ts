import { MemoryManager } from "../../src/utils/memory";

describe("MemoryManager", () => {
  let memoryManager: MemoryManager;
  let originalMemoryUsage: typeof process.memoryUsage;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    memoryManager = new MemoryManager({ maxMemory: "1GB" });
    originalMemoryUsage = process.memoryUsage;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Set up mock memory usage function
    process.memoryUsage = Object.assign(
      jest.fn(() => ({
        heapUsed: 1024 * 1024,
        heapTotal: 2048 * 1024,
        external: 0,
        arrayBuffers: 0,
        rss: 4096 * 1024,
      })),
      { rss: true }
    ) as unknown as typeof process.memoryUsage;
  });

  afterEach(() => {
    process.memoryUsage = originalMemoryUsage;
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    test("should handle various memory formats", () => {
      expect(() => new MemoryManager({ maxMemory: "1GB" })).not.toThrow();
      expect(() => new MemoryManager({ maxMemory: "512MB" })).not.toThrow();
      expect(() => new MemoryManager({ maxMemory: "2048KB" })).not.toThrow();
      expect(() => new MemoryManager({ maxMemory: "1024MB" })).not.toThrow();
      expect(() => new MemoryManager({ maxMemory: "1024B" })).not.toThrow();
      expect(() => new MemoryManager({ maxMemory: "0.5GB" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "1.5GB" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "invalid" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "-1GB" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "1G" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "TB" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "1024" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "1024 B" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "KB1024" })).toThrow();
    });

    test("should handle edge cases in memory values", () => {
      // Test maximum safe integer
      expect(() => new MemoryManager({ maxMemory: "8192GB" })).not.toThrow();

      // Test invalid units
      expect(() => new MemoryManager({ maxMemory: "1PB" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: "1TB" })).toThrow();

      // Test boundary values
      const hugeValue = "9".repeat(20) + "B"; // More than Number.MAX_SAFE_INTEGER bytes
      expect(() => new MemoryManager({ maxMemory: hugeValue })).toThrow();

      // Test decimal values
      expect(() => new MemoryManager({ maxMemory: "1.0GB" })).toThrow();
      expect(() => new MemoryManager({ maxMemory: ".5GB" })).toThrow();
    });

    test("should convert memory units correctly", () => {
      const testCases = [
        { maxMemory: "1GB", expected: 1024 * 1024 * 1024 },
        { maxMemory: "512MB", expected: 512 * 1024 * 1024 },
        { maxMemory: "2048KB", expected: 2048 * 1024 },
        { maxMemory: "1024B", expected: 1024 },
      ];

      testCases.forEach(({ maxMemory, expected }) => {
        const manager = new MemoryManager({ maxMemory });
        expect((manager as any).maxBytes).toBe(expected);
      });
    });
  });

  describe("operation tracking", () => {
    test("should track operation stats correctly", () => {
      const start1 = memoryManager.startOperation("test");
      jest.advanceTimersByTime(100);
      memoryManager.endOperation("test", start1);

      const start2 = memoryManager.startOperation("test");
      jest.advanceTimersByTime(200);
      memoryManager.endOperation("test", start2);

      const stats = memoryManager.getOperationStats();
      expect(stats.test).toBeDefined();
      expect(stats.test.count).toBe(2);
      expect(typeof stats.test.totalMemory).toBe("number");
      expect(typeof stats.test.peakMemory).toBe("number");

      if (stats.test.totalMemory !== undefined) {
        expect(stats.test.totalMemory).toBeGreaterThan(0);
      }
    });

    test("should validate operation names", () => {
      expect(() => memoryManager.startOperation("")).toThrow(
        "Operation name cannot be empty"
      );
      expect(() => memoryManager.startOperation(undefined as any)).toThrow();
      expect(() => memoryManager.startOperation(null as any)).toThrow();
    });

    test("should handle multiple operation types", () => {
      const start1 = memoryManager.startOperation("op1");
      jest.advanceTimersByTime(100);
      memoryManager.endOperation("op1", start1);

      const start2 = memoryManager.startOperation("op2");
      jest.advanceTimersByTime(100);
      memoryManager.endOperation("op2", start2);

      const stats = memoryManager.getOperationStats();
      expect(stats.op1).toBeDefined();
      expect(stats.op2).toBeDefined();
      expect(stats.op1.count).toBe(1);
      expect(stats.op2.count).toBe(1);
      expect(typeof stats.op1.totalMemory).toBe("number");
      expect(typeof stats.op2.totalMemory).toBe("number");
    });

    test("should handle invalid operations gracefully", () => {
      const start = memoryManager.startOperation("test");

      expect(() => memoryManager.endOperation("invalid", start)).not.toThrow();
      expect(() => memoryManager.endOperation("test", -1)).not.toThrow();
      expect(() => memoryManager.endOperation("test", undefined)).not.toThrow();
      expect(() => memoryManager.endOperation("", start)).not.toThrow();
      expect(() =>
        memoryManager.endOperation("test", Date.now() + 1000)
      ).not.toThrow();
    });

    test("should maintain duration history correctly", () => {
      const now = Date.now();
      jest.spyOn(Date, "now").mockImplementation(() => now);

      for (let i = 0; i < 110; i++) {
        const start = memoryManager.startOperation("test");
        jest.spyOn(Date, "now").mockImplementation(() => now + 100);
        memoryManager.endOperation("test", start);
      }

      const stats = memoryManager.getOperationStats();
      expect(stats.test.avgDuration).toBeDefined();
      expect(stats.test.count).toBe(110);
    });
  });

  describe("memory limits", () => {
    test("should track memory limits", () => {
      const smallManager = new MemoryManager({ maxMemory: "1MB" });

      process.memoryUsage = Object.assign(
        jest.fn(() => ({
          heapUsed: 2 * 1024 * 1024,
          heapTotal: 4 * 1024 * 1024,
          external: 0,
          arrayBuffers: 0,
          rss: 8 * 1024 * 1024,
        })),
        { rss: true }
      ) as unknown as typeof process.memoryUsage;

      const start = smallManager.startOperation("test");
      jest.advanceTimersByTime(100);
      smallManager.endOperation("test", start);

      const stats = smallManager.getOperationStats();
      expect(stats.test.memoryExceeded).toBe(true);
    });

    test("should trigger warnings at memory thresholds", () => {
      const warningManager = new MemoryManager({ maxMemory: "10MB" });
      const warnSpy = jest.spyOn(console, "warn");

      // Test 80% threshold
      process.memoryUsage = Object.assign(
        jest.fn(() => ({
          heapUsed: 8.5 * 1024 * 1024,
          heapTotal: 10 * 1024 * 1024,
          external: 0,
          arrayBuffers: 0,
          rss: 12 * 1024 * 1024,
        })),
        { rss: true }
      ) as unknown as typeof process.memoryUsage;

      warningManager.startOperation("test");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Memory usage above 80%")
      );

      // Test 90% threshold
      process.memoryUsage = Object.assign(
        jest.fn(() => ({
          heapUsed: 9.5 * 1024 * 1024,
          heapTotal: 10 * 1024 * 1024,
          external: 0,
          arrayBuffers: 0,
          rss: 12 * 1024 * 1024,
        })),
        { rss: true }
      ) as unknown as typeof process.memoryUsage;

      warningManager.startOperation("test2");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Memory usage above 90%")
      );

      warnSpy.mockRestore();
    });

    test("should handle memory spikes", () => {
      let memoryValue = 1024 * 1024;

      const mockMemoryUsage = () => ({
        heapUsed: memoryValue,
        heapTotal: memoryValue * 2,
        external: 0,
        arrayBuffers: 0,
        rss: memoryValue * 4,
      });

      process.memoryUsage = Object.assign(jest.fn(mockMemoryUsage), {
        rss: true,
      }) as unknown as typeof process.memoryUsage;

      for (let i = 0; i < 5; i++) {
        memoryValue *= 2;
        const start = memoryManager.startOperation("spike");
        jest.advanceTimersByTime(100);
        memoryManager.endOperation("spike", start);
      }

      const stats = memoryManager.getOperationStats();
      expect(stats.spike).toBeDefined();
      if (stats.spike.peakMemory && stats.spike.totalMemory) {
        expect(stats.spike.peakMemory).toBeGreaterThan(
          stats.spike.totalMemory / stats.spike.count
        );
      }
    });
  });

  describe("error conditions", () => {
    test("should handle missing start times", () => {
      expect(() => memoryManager.endOperation("test", undefined)).not.toThrow();
    });

    test("should handle NaN memory values", () => {
      process.memoryUsage = Object.assign(
        jest.fn(() => ({
          heapUsed: NaN,
          heapTotal: NaN,
          external: NaN,
          arrayBuffers: NaN,
          rss: NaN,
        })),
        { rss: true }
      ) as unknown as typeof process.memoryUsage;

      const start = memoryManager.startOperation("test");
      expect(() => memoryManager.endOperation("test", start)).not.toThrow();
    });

    test("should handle memory usage errors", () => {
      process.memoryUsage = Object.assign(
        jest.fn(() => {
          throw new Error("Memory error");
        }),
        { rss: true }
      ) as unknown as typeof process.memoryUsage;

      const start = memoryManager.startOperation("test");
      expect(() => memoryManager.endOperation("test", start)).not.toThrow();
    });

    test("should handle garbage collection failures", () => {
      // Mock process.memoryUsage to return high memory usage
      process.memoryUsage = Object.assign(
        jest.fn(() => ({
          heapUsed: 950 * 1024 * 1024, // 95% of 1GB
          heapTotal: 1024 * 1024 * 1024,
          external: 0,
          arrayBuffers: 0,
          rss: 1024 * 1024 * 1024,
        })),
        { rss: true }
      ) as unknown as typeof process.memoryUsage;

      // Mock gc to throw
      (global as any).gc = jest.fn(() => {
        throw new Error("GC failed");
      });

      // This should trigger GC through high memory usage
      memoryManager.startOperation("test");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to trigger garbage collection"
      );
      expect((global as any).gc).toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    test("should reset stats correctly", () => {
      const start = memoryManager.startOperation("test");
      memoryManager.endOperation("test", start);

      let stats = memoryManager.getOperationStats();
      expect(Object.keys(stats)).toHaveLength(1);

      memoryManager.resetStats();
      stats = memoryManager.getOperationStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });

    test("should clean up memory usage reporting", () => {
      const usageSpy = jest.spyOn(process, "memoryUsage");
      const usage = memoryManager.getMemoryUsage();

      expect(usage).toHaveProperty("used");
      expect(usage).toHaveProperty("max");
      expect(usage).toHaveProperty("percentage");
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
      expect(usage.percentage).toBeLessThanOrEqual(100);

      expect(usageSpy).toHaveBeenCalled();
    });
  });
});
